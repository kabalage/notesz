import {
  openDB,
  type DBSchema,
  type IDBPDatabase,
  type IDBPTransaction,
  type StoreNames
} from 'idb';
import { createSettings } from './settingsModel';
import type { Settings } from './settingsModel';
import type { User } from './userModel';
import type { Repository } from './repositoryModel';
import type { FileIndex } from './fileIndexModel';
import type { BlobRefCount } from './blobModel';
import type { NoteszDbV1 } from './noteszDbOldSchema';

export interface NoteszDb extends DBSchema {
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
  blobRefCounts: {
    key: string,
    value: BlobRefCount,
    indexes: {
      byRefCount: number
    }
  },
  app: {
    key: string,
    value: Settings | User
  }
}

export type NoteszDbTransaction = IDBPTransaction<
  NoteszDb, ArrayLike<StoreNames<NoteszDb>>, Exclude<IDBTransactionMode, 'readonly'>> & {
    id?: string
  };

let db: IDBPDatabase<NoteszDb> | undefined;
let dbPromise: Promise<IDBPDatabase<NoteszDb>> | undefined;
let closeTimeout: ReturnType<typeof setTimeout> | undefined;

async function openNoteszDb() {
  if (dbPromise) {
    return dbPromise;
  }
  console.log('DB open');
  dbPromise = openDB<NoteszDb>('notesz', 2, {
    async upgrade(db, oldVersion, newVersion, tx) {
      if (oldVersion === 0) {
        await initDb(db);
      } else {
        await upgradeDb(db, oldVersion, tx);
      }
      if (navigator.storage) {
        navigator.storage.persist();
      }
    }
  });
  db = await dbPromise;
  return db;
}

type VersionChangeTransaction<T> = IDBPTransaction<T, ArrayLike<StoreNames<T>>, 'versionchange'>;

async function initDb(
  db: IDBPDatabase<NoteszDb>,
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
  await settingsStore.put(createSettings({
    selectedTheme: 5
  }));
}

async function upgradeDb(
  db: IDBPDatabase<NoteszDb>,
  oldVersion: number,
  tx: VersionChangeTransaction<NoteszDb>
) {
  if (oldVersion === 1) {
    const txV1 = tx as unknown as VersionChangeTransaction<NoteszDbV1>;
    const appStoreV1 = txV1.objectStore('app');
    const appStore = tx.objectStore('app');
    const settingsV1 = await appStoreV1.get('settings');
    if (settingsV1?.type === 'settings') {
      await appStore.put(createSettings({
        ...settingsV1,
        selectedTheme: 5
      }));
    }
  }
}

function closeNoteszDb() {
  if (closeTimeout) {
    clearTimeout(closeTimeout);
  }
  closeTimeout = setTimeout(() => {
    if (!db) return;
    console.log('DB close');
    db.close();
    db = undefined;
    dbPromise = undefined;
    closeTimeout = undefined;
  }, 1000);
}

type InitTransactionCallback<T> =
  (tx: NoteszDbTransaction, db: IDBPDatabase<NoteszDb>) => Promise<T>;

export async function initTransaction<T>(
  transaction: NoteszDbTransaction | undefined,
  callback: InitTransactionCallback<T>
): Promise<T>;

export async function initTransaction<T>(
  callback: InitTransactionCallback<T>
): Promise<T>;

export async function initTransaction<T>(
  transactionOrCallback: NoteszDbTransaction | InitTransactionCallback<T> | undefined,
  maybeCallback?: InitTransactionCallback<T>
) {
  let transaction: NoteszDbTransaction | undefined;
  let callback: InitTransactionCallback<T>;
  if (maybeCallback) {
    callback = maybeCallback;
    transaction = transactionOrCallback as NoteszDbTransaction;
  } else {
    callback = transactionOrCallback as InitTransactionCallback<T>;
    transaction = undefined;
  }
  if (transaction) {
    return callback(transaction, transaction.db);
  }
  let tx: NoteszDbTransaction | undefined;
  try {
    const db = await openNoteszDb();
    tx = db.transaction(db.objectStoreNames, 'readwrite');
    const result = await callback(tx, db);
    await tx.done;
    return result;
  } catch (error) {
    if (tx) {
      if (!tx.error) {
        try {
          tx.abort();
        } catch (err) {
          // Calling tx.abort() throws if the transaction is already completed.
          // Ignore the error, just log it and throw the causing error at the end.
          console.error(err);
          console.warn('Maybe you forgot to pass the transaction to a method and a new transaction'
            + ' closed the previous one.');
        }
      }
      // Consume tx.done rejection to avoid logging of uncought error.
      // As tx.abort() is not called anywhere else, the error can be ignored.
      try {
        await tx.done;
      } catch (txDoneError) {
        // ignore
      }
    }
    throw error;
  } finally {
    try {
      closeNoteszDb();
    } catch (err) {
      console.error(err);
    }
  }
}
