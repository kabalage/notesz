import { request as octokitRequest } from '@octokit/request';
import fileIndexModel, { type FileIndex } from '@/model/fileIndexModel';
import { initTransaction } from '@/model/noteszDb';
import blobModel from '@/model/blobModel';
import userModel from '@/model/userModel';
import NoteszError from '@/utils/NoteszError';
import type { RequestError } from '@octokit/types';
import trial from '@/utils/trial';

/**
 * Creates a GitHub commit based on the changes in the **local** fileIndex.
 *
 * The changes are finalized and the base and remote fileIndexes are updated to represent the
 * new commit.
 */
export default async function push(repositoryId: string) {
  const localIndex = await fileIndexModel.getFileIndex(repositoryId, 'local');
  if (!localIndex) {
    throw new Error(`Missing fileIndex: "${repositoryId}/local"`);
  }
  const baseIndex = await fileIndexModel.getFileIndex(repositoryId, 'base');
  if (!baseIndex) {
    throw new Error(`Missing fileIndex: "${repositoryId}/base"`);
  }

  // If there are no changes, there's nothing to do
  const hasLocalChanges = hasChanges(localIndex);
  if (!hasLocalChanges) {
    return;
  }

  // Prepare common octokit request params
  const user = await userModel.get();
  if (!user) {
    throw new NoteszError('Unauthorized user', {
      code: 'unauthorized'
    });
  }
  const authHeader = `Bearer ${user.token}`;
  const commonParams = {
    headers: {
      authorization: authHeader
    },
    owner: repositoryId.split('/')[0],
    repo: repositoryId.split('/')[1]
  };

  // Transform internal format to tree
  const gitHubTree = await transformToGitHubTree(localIndex);

  // Create tree
  const [treeResponse, treeResponseError] = await trial(() => {
    return octokitRequest('POST /repos/{owner}/{repo}/git/trees', {
      ...commonParams,
      tree: gitHubTree,
      // base_tree may be undefined if the repo doesn't have any commits yet
      base_tree: baseIndex.rootTreeSha
    });
  });
  if (treeResponseError) {
    throw new NoteszError('Could not create the tree on GitHub', {
      cause: treeResponseError
    });
  }

  // Create commit
  const commitMessage = composeCommitMessage(localIndex);
  const [commitResponse, commitError] = await trial(() => {
    return octokitRequest('POST /repos/{owner}/{repo}/git/commits', {
      ...commonParams,
      message: commitMessage,
      tree: treeResponse.data.sha,
      // commitSha may be undefined if the repo doesn't have any commits yet
      parents: baseIndex.commitSha ? [baseIndex.commitSha] : undefined
      // author and commiter are the aurthorized user by default
    });
  });
  if (commitError) {
    throw new NoteszError('Could not create the commit on GitHub', {
      cause: commitError
    });
  }

  // Update default branch ref
  const [defaultBranchResponse, defaultBranchError] = await trial(() => {
    return octokitRequest('GET /repos/{owner}/{repo}', {
      ...commonParams
    });
  });
  if (defaultBranchError) {
    throw new NoteszError('Could not get the default branch ref from GitHub', {
      cause: defaultBranchError
    });
  }
  const defaultBranch = defaultBranchResponse.data.default_branch;
  const [, updateDefaultBranchError] = await trial(() => {
    return octokitRequest('PATCH /repos/{owner}/{repo}/git/refs/heads/{ref}', {
      ...commonParams,
      ref: defaultBranch,
      sha: commitResponse.data.sha
    });
  });
  if (updateDefaultBranchError) {
    if ((updateDefaultBranchError as unknown as RequestError)?.status === 422) {
      throw new NoteszError('Push rejected', {
        code: 'pushRejected'
      });
    }
    throw new NoteszError('Could not update the default branch ref on GitHub', {
      cause: updateDefaultBranchError
    });
  }

  await initTransaction(async (tx) => {
    // Create copies of mutable blobs with their final hash as id.
    // Blobs that don't exist in git have a temporary id-s that need changing after they are
    // commited. The old blobs will be removed by blob garbage collection.
    for (const node of localIndex.index.values()) {
      if (node.type === 'tree') {
        continue;
      }
      const file = node;
      if (file.blobId !== file.blobHash) {
        const blobContents = await blobModel.get(file.blobId, tx);
        if (blobContents === undefined) {
          throw new Error(`Missing blob: "${file.blobId}"`);
        }
        await blobModel.put(file.blobHash, blobContents, tx);
      }
    }

    // Delete remote, base and local fileIndexes to be replaced by the new commited version.
    await fileIndexModel.deleteFileIndex(repositoryId, 'remote', tx);
    await fileIndexModel.deleteFileIndex(repositoryId, 'base', tx);
    await fileIndexModel.deleteFileIndex(repositoryId, 'local', tx);

    // Apply changes and save the new fileIndex.
    fileIndexModel.applyFileChangesInIndex(localIndex);
    await fileIndexModel.addFileIndex(localIndex, tx);

    // Create a new base and remote fileIndex with the same contents as local.
    const newBaseIndex = fileIndexModel.createFileIndex({
      repositoryId,
      indexId: 'base',
      commitSha: commitResponse.data.sha,
      commitTime: commitResponse.data.committer.date,
      rootTreeSha: treeResponse.data.sha,
      index: localIndex.index
    });
    await fileIndexModel.addFileIndex(newBaseIndex, tx);
    const newRemoteIndex = {
      ...newBaseIndex,
      indexId: 'remote' as const
    };
    await fileIndexModel.addFileIndex(newRemoteIndex, tx);

    // Run blob garbage collection
    await blobModel.collectGarbage(tx);
  });
}

function hasChanges(fileIndex: FileIndex) {
  const rootTree = fileIndexModel.getRootTreeNode(fileIndex);
  return rootTree.fileStats?.added > 0 ||
    rootTree.fileStats?.deleted > 0 ||
    rootTree.fileStats?.modified > 0 ||
    rootTree.fileStats?.renamed > 0;
}

async function transformToGitHubTree(fileIndex: FileIndex) {
  const tree: {
    path: string,
    readonly mode: '100644',
    readonly type: 'blob',
    sha?: string | null,
    content?: string
  }[] = [];
  for (const node of fileIndex.index.values()) {
    if (node.type === 'tree') {
      // we don't need to include tree nodes
      continue;
    }
    const file = node;
    if (file.deleted) {
      tree.push({
        path: file.path,
        mode: '100644',
        type: 'blob',
        sha: null
      });
    } else if (file.modified || file.added) {
      const blobContents = await blobModel.get(file.blobId);
      if (blobContents === undefined) {
        throw new Error(`Missing blob: "${file.blobId}"`);
      }
      tree.push({
        path: file.path,
        mode: '100644',
        type: 'blob',
        content: blobContents
      });
      const renamedAndOriginalPathIsNotOccupied = file.renamed
        && !fileIndex.index.has(file.pathInBase!);
      if (renamedAndOriginalPathIsNotOccupied) {
        tree.push({
          path: file.pathInBase!,
          mode: '100644',
          type: 'blob',
          sha: null
        });
      }
    }
  }
  return tree;
}

function composeCommitMessage(fileIndex: FileIndex): string {
  const addedFiles: string[] = [];
  const deletedFiles: string[] = [];
  const renamedFiles: string[] = [];
  const modifiedFiles: string[] = [];

  for (const node of fileIndex.index.values()) {
    const fileName = node.path.split('/').pop()!;
    if (node.type === 'tree') {
      continue;
    }
    const file = node;
    if (file.added) {
      addedFiles.push(fileName);
    } else if (file.deleted) {
      deletedFiles.push(fileName);
    } else if (file.renamed) {
      const oldFileName = file.pathInBase!.split('/').pop();
      renamedFiles.push(`${oldFileName} -> ${fileName}`);
    } else if (file.modified) {
      modifiedFiles.push(fileName);
    }
  }
  const verboseParts: string[] = [];
  if (addedFiles.length > 0) {
    verboseParts.push(`Added: ${addedFiles.join(', ')}`);
  }
  if (deletedFiles.length > 0) {
    verboseParts.push(`Deleted: ${deletedFiles.join(', ')}`);
  }
  if (modifiedFiles.length > 0) {
    verboseParts.push(`Modified: ${modifiedFiles.join(', ')}`);
  }
  if (renamedFiles.length > 0) {
    verboseParts.push(`Renamed: ${renamedFiles.join(', ')}`);
  }
  const verboseMessage = `[Notesz] ${verboseParts.join('; ')}`;
  if (verboseMessage.length <= 72) {
    return verboseMessage;
  }

  const titleParts: string[] = [];
  if (addedFiles.length > 0) {
    titleParts.push(`Added: ${addedFiles.length} files`);
  }
  if (deletedFiles.length > 0) {
    titleParts.push(`Deleted: ${deletedFiles.length} files`);
  }
  if (modifiedFiles.length > 0) {
    titleParts.push(`Modified: ${modifiedFiles.length} files`);
  }
  if (renamedFiles.length > 0) {
    titleParts.push(`Renamed: ${renamedFiles.length} files`);
  }

  const title = `[Notesz] ${titleParts.join(', ')}`;
  const description = verboseParts.join('\n\n');
  return `${title}\n\n${description}`;
}
