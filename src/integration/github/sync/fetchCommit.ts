import { request as octokitRequest } from '@octokit/request';
import { stringSimilarity } from 'string-similarity-js';
import { initTransaction } from '@/model/noteszDb';

import fileIndexModel, { type File, type FileIndex } from '@/model/fileIndexModel';
import NoteszError from '@/utils/NoteszError';
import userModel from '@/model/userModel';
import blobModel from '@/model/blobModel';
import { filterMap, keyByMap } from '@/utils/mapUtils';
import trial from '@/utils/trial';
import type { Progress } from '@/utils/createProgress';

/**
 * Fetches the commit from GitHub and creates the **remote** fileIndex from it.
 * If remote already exists, it will be overwritten.
 */
export default async function fetchCommit(
  repositoryId: string,
  commit: {
    sha: string,
    treeSha: string,
    commitTime: string
  },
  progress: Progress
) {
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

  // Fetch tree and transform it to fileIndex
  const [tree, treeFetchError] = await trial(async () => {
    // Special case for empty tree, GitHub returns 404
    if (commit.treeSha === '4b825dc642cb6eb9a060e54bf8d69288fbee4904') {
      return { data: { sha: commit.treeSha, tree: [], url: '' }};
    }
    return octokitRequest('GET /repos/{owner}/{repo}/git/trees/{tree_sha}', {
      ...commonParams,
      tree_sha: commit.treeSha,
      recursive: '1'
    });
  });
  if (treeFetchError) {
    throw new NoteszError(`Could not get the commit "${commit.sha.slice(0,7)}" from GitHub`, {
      cause: treeFetchError
    });
  }
  const newFileIndex = fileIndexModel.createFileIndex({
    repositoryId,
    indexId: 'remote',
    commitSha: commit.sha,
    commitTime: commit.commitTime,
    rootTreeSha: commit.treeSha
  });
  tree.data.tree.forEach((entry) => {
    if (entry.type === 'blob' && entry.sha && entry.path) { // lazy octokit response typing...
      fileIndexModel.putFileInIndex(newFileIndex, fileIndexModel.createFile({
        path: entry.path,
        blobId: entry.sha,
        blobHash: entry.sha,
        ignored: !entry.path.match(/\.md$/)
      }));
    }
  });
  progress.set(0.1);

  // Download new blobs
  const filesToDownload: File[] = [];
  for (const node of newFileIndex.index.values()) {
    if (node.type !== 'file' || node.ignored) {
      continue;
    }
    const file = node;
    const blobExists = await blobModel.exists(file.blobId);
    if (!blobExists) {
      filesToDownload.push(file);
    }
  }
  await progress.subTask(0.1, 0.8, async (progress) => {
    for (let i = 0; i < filesToDownload.length; i++) {
      progress.setMessage(`Downloading file ${i + 1}/${filesToDownload.length}`);
      const file = filesToDownload[i];
      const [blob, blobFetchError] = await trial(() => {
        return octokitRequest('GET /repos/{owner}/{repo}/git/blobs/{file_sha}', {
          ...commonParams,
          file_sha: file.blobId
        });
      });
      if (blobFetchError) {
        throw new NoteszError(`Could not get the file "${file.path}" in commit "${commit.sha.slice(0,7)}" from GitHub`, {
          cause: blobFetchError
        });
      }
      await blobModel.put(file.blobId, decodeBase64Utf8(blob.data.content));
      progress.set((i + 1) / filesToDownload.length);
    }
  });

  // Diff with base
  const baseFileIndex = await fileIndexModel.getFileIndex(repositoryId, 'base');
  if (!baseFileIndex) {
    throw new Error(`Missing fileIndex: "${repositoryId}/base"`);
  }
  const diffFileIndex = await diffFileIndexes(newFileIndex, baseFileIndex);
  progress.set(0.9);

  // Save new remote fileIndex
  await initTransaction(async (tx) => {
    await fileIndexModel.deleteFileIndex(repositoryId, 'remote', tx);
    await fileIndexModel.addFileIndex(diffFileIndex, tx);
    await blobModel.collectGarbage(tx);
    progress.set(1);
  });
}

function decodeBase64Utf8(encoded: string) {
  return new TextDecoder().decode(
    Uint8Array.from(window.atob(encoded), c => c.charCodeAt(0))
  );
}

async function diffFileIndexes(newIndex: FileIndex, baseIndex: FileIndex) {
  const filesUnchanged: File[] = [];
  let filesAdded: File[] = [];
  let filesDeleted: File[] = [];
  const filesModified: File[] = [];

  const newFiles = filterMap(newIndex.index, (node): node is File => node!.type === 'file');
  const baseFiles = filterMap(baseIndex.index, (node): node is File => node!.type === 'file');

  // Collect filesAdded, filesModified and filesUnchanged
  for (const newFile of newFiles.values()) {
    const baseNode = baseIndex.index.get(newFile.path);
    if (!baseNode || baseNode.type === 'tree') {
      filesAdded.push(fileIndexModel.createFile({
        ...newFile,
        pathInBase: undefined,
        blobIdInBase: undefined
      }));
      continue;
    } else if (newFile.blobId !== baseNode.blobId) {
      filesModified.push(fileIndexModel.createFile({
        ...newFile,
        pathInBase: baseNode.path,
        blobIdInBase: baseNode.blobId
      }));
    } else if (newFile.blobId === baseNode.blobId) {
      filesUnchanged.push(newFile);
    }
  }

  // Collect filesDeleted
  for (const baseFile of baseFiles.values()) {
    const newNode = newIndex.index.get(baseFile.path);
    if (!newNode || newNode.type !== 'file') {
      filesDeleted.push(fileIndexModel.createFile({
        ...baseFile,
        deleted: true
      }));
    }
  }

  // Find exact renames/moves
  const filesAddedByBlobId = keyByMap(filesAdded, (file) => file.blobId);
  const filesExactRenamed = filesDeleted.filter((file) => {
    return filesAddedByBlobId.has(file.blobId);
  }).map((file) => {
    const baseFile = file;
    const newFile = filesAddedByBlobId.get(file.blobId)!;
    return fileIndexModel.createFile({
      ...newFile,
      pathInBase: baseFile.path,
      blobIdInBase: baseFile.blobId
    });
  });
  const filesExactRenamedByBlobId = keyByMap(filesExactRenamed, (file) => file.blobId);
  filesAdded = filesAdded.filter((file) => {
    return !filesExactRenamedByBlobId.has(file.blobId);
  });
  filesDeleted = filesDeleted.filter((file) => {
    return !filesExactRenamedByBlobId.has(file.blobId);
  });

  // Find edit renames
  const renameLimit = 1000;
  let filesEditRenamed: File[] = [];
  if (renameLimit > filesAdded.length + filesDeleted.length) {
    const editRenameMatchesByDeletedPath: Map<string, {
      fileAdded: File,
      fileDeleted: File,
      similarity: number
    }> = new Map();
    for (const fileDeleted of filesDeleted) {
      if (fileDeleted.ignored) {
        continue;
      }
      const fileDeletedBlobContents = await blobModel.get(fileDeleted.blobId);
      if (fileDeletedBlobContents === undefined) {
        throw new Error(`Missing blob "${fileDeleted.blobId}"`);
      }
      for (const fileAdded of filesAdded) {
        if (fileAdded.ignored) {
          continue;
        }
        const fileAddedBlobContents = await blobModel.get(fileAdded.blobId);
        if (fileAddedBlobContents === undefined) {
          throw new Error(`Missing blob "${fileAdded.blobId}"`);
        }
        const similarity = stringSimilarity(fileAddedBlobContents, fileDeletedBlobContents);
        if (similarity > 0.5) {
          const existingMatch = editRenameMatchesByDeletedPath.get(fileDeleted.path);
          if (!existingMatch || existingMatch.similarity < similarity) {
            editRenameMatchesByDeletedPath.set(fileDeleted.path, {
              fileAdded,
              fileDeleted,
              similarity
            });
          }
        }
      }
    }
    const editRenameMatchesByAddedBlobId = keyByMap(editRenameMatchesByDeletedPath.values(),
      (match) => match.fileAdded.blobId);
    filesAdded = filesAdded.filter((file) => {
      return !editRenameMatchesByAddedBlobId.has(file.blobId);
    });
    const editRenameMatchesByDeletedBlobId = keyByMap(editRenameMatchesByDeletedPath.values(),
      (match) => match.fileDeleted.blobId);
    filesDeleted = filesDeleted.filter((file) => {
      return !editRenameMatchesByDeletedBlobId.has(file.blobId);
    });
    filesEditRenamed = [...editRenameMatchesByDeletedPath.values()].map((match) => {
      return fileIndexModel.createFile({
        ...match.fileAdded,
        blobIdInBase: match.fileDeleted.blobId,
        pathInBase: match.fileDeleted.path
      });
    });
  }

  // Assemble FileIndex
  const files = [
    ...filesUnchanged,
    ...filesAdded,
    ...filesDeleted,
    ...filesModified,
    ...filesExactRenamed,
    ...filesEditRenamed
  ].sort((a: File, b: File) => {
    if (a.path < b.path) return -1;
    else if (a.path > b.path) return 1;
    else return 0;
  });

  const diffFileIndex = fileIndexModel.createFileIndex({
    repositoryId: newIndex.repositoryId,
    indexId: newIndex.indexId,
    commitSha: newIndex.commitSha,
    commitTime: newIndex.commitTime,
    rootTreeSha: newIndex.rootTreeSha
  });
  for (const file of files) {
    fileIndexModel.putFileInIndex(diffFileIndex, file);
  }

  return diffFileIndex;
}
