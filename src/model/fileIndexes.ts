import { openNoteszDb } from './db';

export interface FileIndex {
  readonly repositoryId: string,
  readonly indexId: string,
  readonly type: 'fileIndex',
  index: {
    '': Tree,
    [key: string]: Tree | File | undefined
  }
}

export interface Tree {
  readonly type: 'tree',
  path: string,
  pathInBase: string,
  deleted: boolean,
  changed: boolean, // path !== pathInBase || any children changed
  children: string[]
}

export interface File {
  readonly type: 'file',
  path: string,
  pathInBase: string,
  blobId: string,
  blobIdInBase: string,
  deleted: boolean,
  changed: boolean // path !== pathInBase || blobId !== blobIdInBase
}

async function add(fileIndex: FileIndex) {
  const db = await openNoteszDb();
  try {
    return await db.add('fileIndexes', fileIndex);
  } finally {
    db.close();
  }
}

async function get(repositoryId: string, indexId: string) {
  const db = await openNoteszDb();
  try {
    return await db.get('fileIndexes', [repositoryId, indexId]);
  } finally {
    db.close();
  }
}

async function updateLocalFile(repositoryId: string, filePath: string, data: string) {
  const db = await openNoteszDb();
  try {
    const tx = db.transaction(['fileIndexes', 'blobs'], 'readwrite');
    const fileIndexStore = tx.objectStore('fileIndexes');
    const blobStore = tx.objectStore('blobs');
    const localIndex = await fileIndexStore.get([repositoryId, 'local']);
    if (!localIndex) {
      throw new Error(`Local fileIndex in repository "${repositoryId}" is missing`);
    }
    const node = localIndex.index[filePath];
    if (!node || node.type !== 'file') {
      throw new Error(`Path "${filePath}" does not point to a file in the repository "${repositoryId}" local file index`);
    }
    let idChanged = false;
    if (node.blobId === node.blobIdInBase) {
      const newId = String(Math.random()).slice(2);
      await blobStore.add(data, newId);
      node.blobId = newId;
      await fileIndexStore.put(localIndex);
      idChanged = true;
    } else {
      await blobStore.put(data, node.blobId);
    }
    await tx.done;
    return idChanged;
  } finally {
    db.close();
  }
}

function getTreeForPath(fileIndex: FileIndex, path: string) {
  const node = fileIndex.index[path];
  const pathPointsToTree = !!node && node.type === 'tree';
  if (pathPointsToTree) {
    return node;
  }
  const parentNodePath = path.split('/').slice(0, -1).join('/');
  const parentNode = fileIndex.index[parentNodePath];
  if (!parentNode || parentNode.type !== 'tree') {
    throw new Error('Missing parent tree');
  }
  return parentNode;
}

export const fileIndexes = {
  add,
  get,
  updateLocalFile,
  getTreeForPath
};
