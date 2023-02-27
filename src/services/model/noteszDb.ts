import { openDB, type IDBPDatabase, type IDBPTransaction, type StoreNames } from 'idb';
import { defineService } from '@/utils/defineService';
import type { NoteszDb } from './noteszDb/noteszDbSchema';
import { initDb } from './noteszDb/initDb';
import { upgradeDb } from './noteszDb/upgradeDb';

export type NoteszDbTransaction = IDBPTransaction<
  NoteszDb, ArrayLike<StoreNames<NoteszDb>>, Exclude<IDBTransactionMode, 'readonly'>> & {
    id?: string
  };

export const [provideNoteszDb, useNoteszDb] = defineService('NoteszDb', () => {
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

  async function initTransaction<T>(
    transaction: NoteszDbTransaction | undefined,
    callback: InitTransactionCallback<T>
  ): Promise<T>;
  async function initTransaction<T>(
    callback: InitTransactionCallback<T>
  ): Promise<T>;
  async function initTransaction<T>(
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
            console.warn('Maybe you forgot to pass the transaction to a method and a new'
              + ' transaction closed the previous one.');
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

  return {
    initTransaction
  };
});
