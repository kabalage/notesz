import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { AppSettings } from './settings';
import type { Repository } from './repositories';
import type { FileIndex } from './fileIndexes';

interface NoteszDb extends DBSchema {
  repositories: {
    key: string,
    value: Repository
  },
  fileIndexes: {
    key: [string, string],
    value: FileIndex
  },
  blobs: {
    key: string,
    value: string
  },
  settings: {
    key: string,
    value: AppSettings
  }
}

export async function openNoteszDb() {
  // console.log('DB open');
  if (navigator.storage) {
    navigator.storage.persist();
  }

  async function initDb(
    db: IDBPDatabase<NoteszDb>,
    // tx: IDBPTransaction<NoteszDb, ArrayLike<StoreNames>, 'versionchange'>
  ) {
    db.createObjectStore('repositories', {
      keyPath: 'id'
    });
    db.createObjectStore('fileIndexes', {
      keyPath: ['repositoryId', 'indexId']
    });
    db.createObjectStore('blobs');
    const settingsStore = db.createObjectStore('settings', {
      keyPath: 'type'
    });
    await settingsStore.put({
      type: 'appSettings',
      selectedRepositoryId: null,
      theme: 'system'
    });
  }

  // async function upgradeDb(
  //   db: IDBPDatabase<NoteszDb>,
  //   oldVersion: number,
  //   // tx: IDBPTransaction<NoteszDb, ArrayLike<StoreNames>, 'versionchange'>
  // ) {
  // }

  return openDB<NoteszDb>('notesz', 1, {
    async upgrade(db, oldVersion) {
      if (oldVersion === 0) {
        await initDb(db);
      // } else {
      //   await upgradeDb(db, oldVersion);
      }
    }
  });
}
