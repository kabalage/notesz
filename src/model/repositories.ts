import { openNoteszDb } from './db';
// import { getMockNoteszFileIndex } from './seedData';
// import mdExample from './mdExample.md?raw';

export interface Repository {
  readonly id: string,
  readonly type: 'repository',
  // token: string
}

async function add(repository: Repository) {
  const mdExample = (await import('./tmpSeed/mdExample.md?raw')).default;
  const { getMockNoteszFileIndex } = await import('./tmpSeed/getMockNoteszFileIndex');
  const db = await openNoteszDb();
  try {
    const tx = db.transaction(['repositories', 'fileIndexes', 'blobs'], 'readwrite');
    const repositoriesStore = tx.objectStore('repositories');
    const fileIndexesStore = tx.objectStore('fileIndexes');
    const blobsStore = tx.objectStore('blobs');
    await repositoriesStore.add(repository);
    await fileIndexesStore.add(getMockNoteszFileIndex(repository.id, 'local'));
    await blobsStore.put(mdExample, 'mockNote');
    await tx.done;
  } finally {
    db.close();
  }
}

async function deleteRepo(id: string) {
  const db = await openNoteszDb();
  try {
    const tx = db.transaction(['repositories', 'fileIndexes', 'blobs'], 'readwrite');
    const repositoriesStore = tx.objectStore('repositories');
    const fileIndexesStore = tx.objectStore('fileIndexes');
    // const blobsStore = tx.objectStore('blobs');
    await fileIndexesStore.delete([id, 'local']);
    await repositoriesStore.delete(id);
    // TODO dereference blobs
    // fileIndex api should handle dereferencing
    // apis should accept a tx object
    return await db.delete('repositories', id);
  } finally {
    db.close();
  }
}

async function list() {
  const db = await openNoteszDb();
  try {
    return db.getAll('repositories');
  } finally {
    db.close();
  }
}

export const repositories = {
  add,
  delete: deleteRepo,
  list
};
