/*
  NoteszDb

    A wrapper around the idb instance of the Notesz database.
    All database access is constrained to be done within a transaction provided by
    `NoteszDb.initTransaction`. The limitation of idb's transaction model must be adhered to.
*/

import { openDB, type IDBPDatabase, type IDBPTransaction, type StoreNames } from 'idb';
import { defineService } from '@/utils/injector';
import type { NoteszDbSchema } from './NoteszDb/noteszDbSchema';

export type NoteszDbTransaction = IDBPTransaction<
  NoteszDbSchema,
  ArrayLike<StoreNames<NoteszDbSchema>>,
  Exclude<IDBTransactionMode, 'readonly'>
> & { id?: string };

export const NoteszDb = defineService({
  name: 'NoteszDb',
  setup
});

function setup() {
  let db: IDBPDatabase<NoteszDbSchema> | undefined;
  let dbPromise: Promise<IDBPDatabase<NoteszDbSchema>> | undefined;
  let closeTimeout: ReturnType<typeof setTimeout> | undefined;

  async function openNoteszDb() {
    if (dbPromise) {
      return dbPromise;
    }
    // These must be imported here to avoid circular dependencies.
    // They also cannot be used in the upgrade function to adhere to idb's
    // transaction model.
    const { initDb } = await import('./NoteszDb/initDb');
    const { upgradeDb } = await import('./NoteszDb/upgradeDb');
    // console.log('DB open');
    dbPromise = openDB<NoteszDbSchema>('notesz', 4, {
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
      // console.log('DB close');
      db.close();
      db = undefined;
      dbPromise = undefined;
      closeTimeout = undefined;
    }, 1000);
  }

  type InitTransactionCallback<T> =
    (tx: NoteszDbTransaction, db: IDBPDatabase<NoteszDbSchema>) => Promise<T>;

  /**
   * Ensures that the callback is executed in a transaction.
   *
   * Never await non-db operations in the callback, as this will end the transaction. Check the
   * idb transaction model for more information.
   *
   * For ease of use, the created transaction will be created in `readwrite` mode and all stores
   * will be accessible. While this greedily locks all stores, it should not pose a problem as
   * the database does not receive much traffic.
   *
   * @param [transaction] An existing transaction. If not given, a new transaction is created.
   * @param callback The function to execute in the transaction.
   */
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
}
