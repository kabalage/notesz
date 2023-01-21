import { initTransaction, type NoteszDbTransaction } from './noteszDb';
import blobModel from './blobModel';
import gitBlobHash from '@/utils/gitBlobHash';

export interface FileIndex {
  readonly type: 'fileIndex',
  readonly repositoryId: string,
  indexId: 'remote' | 'base' | 'local' | 'rebase',
  // commitSha, commitTime, rootTreeSha only exists for remote and base,
  // because local and rebase don't have commits yet
  commitSha?: string, // The commit that this index represents
  commitTime?: string, // The time of the commit
  rootTreeSha?: string, // The sha of the root tree of the commit
  index: Map<string, Tree | File>
}

function createFileIndex(
  initialValues: Pick<FileIndex, 'repositoryId' | 'indexId'> & Partial<FileIndex>
): FileIndex {
  return {
    type: 'fileIndex',
    ...initialValues,
    index: new Map([
      ['', createTree({ path: '' })],
      ...(initialValues.index ?? [])
    ])
  };
}

export interface Tree {
  readonly type: 'tree',
  path: string,
  status: 'unchanged' | 'deleted' | 'added' | 'modified',
  fileStats: {
    all: number,
    deleted: number,
    added: number,
    renamed: number,
    modified: number,
    conflicting: number
  },
  children: Set<string>
}

function createTree(
  initialValues: Pick<Tree, 'path'> & Partial<Pick<Tree, 'children'>>
): Tree {
  return {
    type: 'tree',
    status: 'unchanged',
    fileStats: {
      all: 0,
      deleted: 0,
      added: 0,
      renamed: 0,
      modified: 0,
      conflicting: 0
    },
    children: new Set(),
    ...initialValues
  };
}

export interface File {
  readonly type: 'file',
  path: string,
  pathInBase?: string,
  blobId: string,
  blobHash: string,
  blobIdInBase?: string,
  ignored: boolean, // only *.md files are downloaded, the rest is ignored
  deleted: boolean,
  conflicting: boolean,
  conflictReason?: string,
  added: boolean, // !pathInBase
  renamed: boolean, // pathInBase && path !== pathInBase
  modified: boolean // blobIdInBase && blobId !== blobIdInBase
}

function createFile(
  initialValues: Pick<File, 'path' | 'blobId' | 'blobHash'> & Partial<File>
): File {
  const file = {
    pathInBase: undefined,
    blobIdInBase: undefined,
    ignored: false,
    deleted: false,
    conflicting: false,
    conflictReason: undefined,
    ...initialValues,
    type: 'file' as const,
    added: false,
    renamed: false,
    modified: false,
  };
  file.modified = !!file.blobIdInBase && file.blobId !== file.blobIdInBase;
  file.renamed = !!file.pathInBase && file.path !== file.pathInBase;
  file.added = !file.pathInBase;
  return file;
}

async function addFileIndex(
  fileIndex: FileIndex,
  transaction?: NoteszDbTransaction
) {
  return initTransaction(transaction, async (tx) => {
    const fileIndexStore = tx.objectStore('fileIndexes');
    for (const node of fileIndex.index.values()) {
      if (node?.type === 'file' && !node.ignored) {
        await blobModel.incrementRefCount(node.blobId, tx);
        if (node.blobIdInBase) {
          await blobModel.incrementRefCount(node.blobIdInBase, tx);
        }
      }
    }
    await fileIndexStore.add(fileIndex);
  });
}

async function deleteFileIndex(
  repositoryId: FileIndex['repositoryId'],
  indexId: FileIndex['indexId'],
  transaction?: NoteszDbTransaction
) {
  return initTransaction(transaction, async (tx) => {
    const fileIndexStore = tx.objectStore('fileIndexes');
    const fileIndex = await fileIndexStore.get([repositoryId, indexId]);
    if (!fileIndex) {
      return;
    }
    for (const node of fileIndex.index.values()) {
      if (node?.type === 'file' && !node.ignored) {
        await blobModel.decrementRefCount(node.blobId, tx);
        if (node.blobIdInBase) {
          await blobModel.decrementRefCount(node.blobIdInBase, tx);
        }
      }
    }
    await fileIndexStore.delete([repositoryId, indexId]);
  });
}

async function getFileIndex(
  repositoryId: string,
  indexId: string,
  transaction?: NoteszDbTransaction
) {
  return initTransaction(transaction, async (tx) => {
    const fileIndexStore = tx.objectStore('fileIndexes');
    return fileIndexStore.get([repositoryId, indexId]);
  });
}

async function addFile(
  repositoryId: string,
  indexId: 'rebase' | 'local',
  filePath: string,
  data: string
) {
  if (filePath === '' || !filePath.match(/\.md$/)) {
    throw new Error('Invalid filePath');
  }
  const blobHash = await gitBlobHash(data);

  return initTransaction(async (tx) => {
    const fileIndexStore = tx.objectStore('fileIndexes');
    const fileIndex = await fileIndexStore.get([repositoryId, indexId]);
    if (!fileIndex) {
      throw new Error(`Missing ${indexId} fileIndex of repository "${repositoryId}"`);
    }
    const node = fileIndex.index.get(filePath);
    const deletedFile = node && node.type === 'file' && node.deleted ? node : undefined;
    if (node && !deletedFile) {
      // Ignored files also occupy the path.
      throw new Error(`Path "${filePath}" is occupied in "${repositoryId}/${indexId}"`);
    }
    const newBlobId = Math.random().toString().slice(2);
    if (!deletedFile) {
      // Add a new file
      const newFile = createFile({
        path: filePath,
        blobId: newBlobId,
        blobHash: blobHash
      });
      putFileInIndex(fileIndex, newFile);
      await blobModel.put(newBlobId, data, tx);
      await blobModel.incrementRefCount(newBlobId, tx);
      await fileIndexStore.put(fileIndex);
    } else if (deletedFile) {
      // Restore deleted file and change contents.
      const modifiedFile = createFile({
        ...deletedFile,
        blobId: newBlobId,
        blobHash,
        deleted: false
      });
      putFileInIndex(fileIndex, modifiedFile);
      await blobModel.put(newBlobId, data, tx);
      await blobModel.decrementRefCount(deletedFile.blobId);
      await blobModel.incrementRefCount(modifiedFile.blobId, tx);
      await blobModel.collectGarbage(tx);
      await fileIndexStore.put(fileIndex);
    }
    return newBlobId;
  });
}

async function deleteFile(
  repositoryId: string,
  indexId: 'rebase' | 'local',
  filePath: string,
  transaction?: NoteszDbTransaction
) {
  return initTransaction(transaction, async (tx) => {
    const fileIndexStore = tx.objectStore('fileIndexes');
    const fileIndex = await fileIndexStore.get([repositoryId, indexId]);
    if (!fileIndex) {
      throw new Error(`Missing ${indexId} fileIndex of repository "${repositoryId}"`);
    }
    const node = fileIndex.index.get(filePath);
    if (!node || node.type !== 'file') {
      throw new Error(`Missing file "${filePath}" in "${repositoryId}/${indexId}"`);
    }
    const file = node;
    if (file.ignored) {
      throw new Error(`File "${filePath}" cannot be deleted in "${repositoryId}/${indexId}" as it is not managed by Notesz`);
    }
    if (file.deleted) {
      throw new Error(`File "${filePath}" is already deleted in "${repositoryId}/${indexId}"`);
    }
    const shouldRemoveFromTree = file.added;
    if (shouldRemoveFromTree) {
      deleteFileFromIndex(fileIndex, filePath);
      await blobModel.decrementRefCount(file.blobId, tx);
      await blobModel.collectGarbage(tx);
      await fileIndexStore.put(fileIndex);
    } else if (!shouldRemoveFromTree) {
      const deletedFile = createFile({
        ...file,
        blobId: file.blobIdInBase!, // revert to base blob
        blobHash: file.blobIdInBase!,
        deleted: true,
        conflicting: false // deletion resolves conflict
      });
      putFileInIndex(fileIndex, deletedFile);
      if (file.blobId !== deletedFile.blobId) {
        await blobModel.decrementRefCount(file.blobId);
        await blobModel.incrementRefCount(deletedFile.blobId);
      }
      await blobModel.collectGarbage(tx);
      await fileIndexStore.put(fileIndex);
    }
  });
}

async function updateFile(
  repositoryId: string,
  indexId: 'rebase' | 'local',
  filePath: string,
  data: string
) {
  const newHash = await gitBlobHash(data);
  return initTransaction(async (tx) => {
    const fileIndexStore = tx.objectStore('fileIndexes');
    const fileIndex = await fileIndexStore.get([repositoryId, indexId]);
    if (!fileIndex) {
      throw new Error(`Missing ${indexId} fileIndex of repository "${repositoryId}"`);
    }
    const node = fileIndex.index.get(filePath);
    if (!node || node.type !== 'file') {
      throw new Error(`Missing file "${filePath}" in "${repositoryId}/${indexId}"`);
    }
    const file = node;
    if (file.deleted) {
      throw new Error(`May not update deleted file ("${filePath}")`);
    }
    if (file.ignored) {
      throw new Error(`May not update ingored file ("${filePath}")`);
    }
    const blobWasOriginal = !!file.blobIdInBase && (file.blobId === file.blobIdInBase);
    const newContentsAreTheOriginal = !!file.blobIdInBase && (newHash === file.blobIdInBase);
    const contentsChanged = newHash !== file.blobHash;
    if (blobWasOriginal && !newContentsAreTheOriginal) {
      const newBlobId = Math.random().toString().slice(2);
      const updatedFile = createFile({
        ...file,
        blobId: newBlobId,
        blobHash: newHash
      });
      putFileInIndex(fileIndex, updatedFile);
      await blobModel.put(newBlobId, data, tx);
      await blobModel.decrementRefCount(file.blobId, tx);
      await blobModel.incrementRefCount(updatedFile.blobId, tx);
      await fileIndexStore.put(fileIndex);
      return newBlobId;
    } else if (blobWasOriginal && newContentsAreTheOriginal) {
      return undefined;
    } else if (!blobWasOriginal && newContentsAreTheOriginal) {
      const updatedFile = createFile({
        ...file,
        blobId: file.blobIdInBase!,
        blobHash: file.blobIdInBase!
      });
      putFileInIndex(fileIndex, updatedFile);
      await blobModel.decrementRefCount(file.blobId, tx);
      await blobModel.incrementRefCount(updatedFile.blobId, tx);
      await blobModel.collectGarbage(tx);
      await fileIndexStore.put(fileIndex);
      return file.blobId;
    } else if (!blobWasOriginal && !newContentsAreTheOriginal && contentsChanged) {
      await blobModel.put(file.blobId, data, tx);
      file.blobHash = newHash;
      await fileIndexStore.put(fileIndex);
      return undefined;
    } else if (!blobWasOriginal && !newContentsAreTheOriginal && !contentsChanged) {
      return undefined;
    }
  });
}

async function resolveConflict(
  repositoryId: string,
  indexId: 'rebase' | 'local',
  filePath: string,
  transaction?: NoteszDbTransaction
) {
  return initTransaction(transaction, async (tx) => {
    const fileIndexStore = tx.objectStore('fileIndexes');
    const fileIndex = await fileIndexStore.get([repositoryId, indexId]);
    if (!fileIndex) {
      throw new Error(`Missing ${indexId} fileIndex of repository "${repositoryId}"`);
    }
    const node = fileIndex.index.get(filePath);
    if (!node || node.type !== 'file') {
      throw new Error(`Missing file "${filePath}" in "${repositoryId}/${indexId}"`);
    }
    const file = node;
    if (!file.conflicting) {
      throw new Error(`File "${filePath}" is not conflicting in "${repositoryId}/${indexId}"`);
    }
    const updatedFile = createFile({
      ...file,
      conflicting: false,
      conflictReason: undefined
    });
    putFileInIndex(fileIndex, updatedFile);
    await fileIndexStore.put(fileIndex);
  });
}

function getTreeNodeForPath(fileIndex: FileIndex, path: string) {
  const node = fileIndex.index.get(path);
  const pathPointsToTree = !!node && node.type === 'tree';
  if (pathPointsToTree) {
    return node;
  }
  const parentNodePath = getParentNodePath(path);
  const parentNode = fileIndex.index.get(parentNodePath);
  if (!parentNode || parentNode.type !== 'tree') {
    throw new Error('Missing parent tree');
  }
  return parentNode;
}

function getParentNodePath(path: string) {
  return path.split('/').slice(0, -1).join('/');
}

function putFileInIndex(fileIndex: FileIndex, file: File) {
  const node = fileIndex.index.get(file.path);
  const changes: Tree['fileStats'] = {
    all: 1,
    deleted: Number(file.deleted),
    added: Number(file.added),
    renamed: Number(file.renamed),
    modified: Number(file.modified),
    conflicting: Number(file.conflicting)
  };
  if (node) {
    if (node.type === 'tree') {
      throw new Error('Path points to a tree');
    }
    changes.all = 0;
    changes.deleted -= Number(node.deleted);
    changes.added -= Number(node.added);
    changes.renamed -= Number(node.renamed);
    changes.modified -= Number(node.modified);
    changes.conflicting -= Number(node.conflicting);
  }
  initParentTrees(fileIndex, file.path);
  fileIndex.index.set(file.path, file);
  updateParentTrees(fileIndex, file.path, changes);
}

function initParentTrees(fileIndex: FileIndex, filePath: string) {
  let parentPath = getParentNodePath(filePath);
  let childPath = filePath;
  let earlyEscape = false;
  while (childPath !== '' && !earlyEscape) {
    const parentNode = fileIndex.index.get(parentPath);
    if (parentNode) {
      if (parentNode.type !== 'tree') {
        throw new Error(`Parent is not a tree: "${parentPath} (child: ${childPath})"`);
      }
      parentNode.children.add(childPath);
      earlyEscape = true;
      continue;
    }
    fileIndex.index.set(parentPath, createTree({
      path: parentPath,
      children: new Set([childPath])
    }));
    childPath = parentPath;
    parentPath = getParentNodePath(parentPath);
  }
}

function updateParentTrees(
  fileIndex: FileIndex,
  filePath: string,
  change: Partial<Tree['fileStats']>
) {
  let childRemoved = false;
  forEachParent(fileIndex, filePath, (parentTree, childPath) => {
    parentTree.fileStats.all += change.all || 0;
    parentTree.fileStats.deleted += change.deleted || 0;
    parentTree.fileStats.conflicting += change.conflicting || 0;
    parentTree.fileStats.added += change.added || 0;
    parentTree.fileStats.renamed += change.renamed || 0;
    parentTree.fileStats.modified += change.modified || 0;
    if (parentTree.fileStats.all === parentTree.fileStats.deleted) {
      parentTree.status = 'deleted';
    } else if (parentTree.fileStats.all === parentTree.fileStats.added
      || parentTree.fileStats.all === parentTree.fileStats.renamed) {
      parentTree.status = 'added';
    } else if (parentTree.fileStats.deleted > 0 || parentTree.fileStats.added > 0
      || parentTree.fileStats.renamed > 0 || parentTree.fileStats.modified > 0
    ) {
      parentTree.status = 'modified';
    } else {
      parentTree.status = 'unchanged';
    }
    // Remove empty trees, but not the root tree
    if (parentTree.fileStats.all === 0 && parentTree.path !== '') {
      fileIndex.index.delete(parentTree.path);
      childRemoved = true;
    } else if (childRemoved) {
      parentTree.children.delete(childPath);
      childRemoved = false;
    }
  });
}

function forEachParent(
  fileIndex: FileIndex,
  filePath: string,
  cb: (parent: Tree, childPath: string) => void
) {
  let parentPath = getParentNodePath(filePath);
  let childPath = filePath;
  while (childPath !== '') {
    const parentNode = fileIndex.index.get(parentPath);
    if (!parentNode) {
      throw new Error(`Missing parent: "${parentPath} (child: ${childPath})"`);
    }
    if (parentNode.type !== 'tree') {
      throw new Error(`Parent is not a tree: "${parentPath} (child: ${childPath})"`);
    }
    cb(parentNode, childPath);
    // Traverse to the parent
    childPath = parentPath;
    parentPath = getParentNodePath(parentPath);
  }
}

function deleteFileFromIndex(fileIndex: FileIndex, filePath: string) {
  const node = fileIndex.index.get(filePath);
  if (!node) {
    return;
  }
  if (node.type === 'tree') {
    throw new Error('Path points to a tree');
  }
  const changes: Tree['fileStats'] = {
    all: -1,
    deleted: -Number(node.deleted),
    added: -Number(node.added),
    renamed: -Number(node.renamed),
    modified: -Number(node.modified),
    conflicting: -Number(node.conflicting)
  };
  fileIndex.index.delete(filePath);
  updateParentTrees(fileIndex, filePath, changes);
}

/**
 * Removes files marked `deleted`. For temporary, mutable blobs, the `blobId` is updated to the
 * final `blobHash`. It also sets `pathInBase` and `blobIdInBase` to their actual path and id
 * values.
 *
 * The blobs must be available with the final `blobHash` as key when the index is saved.
 */
function applyFileChangesInIndex(fileIndex: FileIndex) {
  for (const [filePath, node] of fileIndex.index) {
    if (node.type === 'tree') {
      continue;
    }
    const file = node;
    if (file.deleted) {
      deleteFileFromIndex(fileIndex, filePath);
    } else {
      const updatedFile = createFile({
        ...file,
        blobId: file.blobHash, // Update blobId to the final hash
        pathInBase: file.path,
        blobIdInBase: file.blobHash
      });
      putFileInIndex(fileIndex, updatedFile);
    }
  }
}

function getRootTreeNode(fileIndex: FileIndex) {
  const rootTree = fileIndex.index.get('');
  if (!rootTree || rootTree.type !== 'tree') {
    throw new Error('Missing root tree');
  }
  return rootTree;
}

export default {
  createFileIndex,
  createTree,
  createFile,
  // persistence
  addFileIndex,
  deleteFileIndex,
  getFileIndex,
  addFile,
  deleteFile,
  updateFile,
  resolveConflict,
  // utilities
  getTreeNodeForPath,
  getParentNodePath,
  putFileInIndex,
  deleteFileFromIndex,
  applyFileChangesInIndex,
  getRootTreeNode
};
