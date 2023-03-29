import type { IDBPDatabase } from 'idb';
import type { NoteszDbSchema } from './noteszDbSchema';
import { createSettings } from '../SettingsModel';

export async function initDb(
  db: IDBPDatabase<NoteszDbSchema>,
  // tx: VersionChangeTransaction<NoteszDb>
) {
  db.createObjectStore('repositories', {
    keyPath: 'id'
  });
  db.createObjectStore('fileIndexes', {
    keyPath: ['repositoryId', 'indexId']
  });
  db.createObjectStore('blobs');
  const blobRefCountStore = db.createObjectStore('blobRefCounts', {
    keyPath: 'blobId'
  });
  blobRefCountStore.createIndex('byRefCount', 'refCount');
  const settingsStore = db.createObjectStore('app', {
    keyPath: 'type'
  });
  await settingsStore.put(createSettings());
}
