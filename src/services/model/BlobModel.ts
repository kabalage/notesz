import { defineService, type InjectResult } from '@/utils/injector';
import { NoteszError } from '@/utils/NoteszError';
import { NoteszMessageBus } from '@/services/NoteszMessageBus';
import { NoteszDb, type NoteszDbTransaction } from '@/services/model/NoteszDb';

export interface BlobRefCount {
  blobId: string,
  refCount: number
}

const dependencies = [NoteszDb, NoteszMessageBus];

export const BlobModel = defineService({
  name: 'BlobModel',
  dependencies,
  setup
});

function setup({ noteszDb, noteszMessageBus }: InjectResult<typeof dependencies>) {
  const { initTransaction } = noteszDb;

  async function get(id: string, transaction?: NoteszDbTransaction) {
    return initTransaction(transaction, async (tx) => {
      const blobStore = tx.objectStore('blobs');
      return blobStore.get(id);
    });
  }

  async function put(id: string, value: string, transaction?: NoteszDbTransaction) {
    return initTransaction(transaction, async (tx) => {
      const blobStore = tx.objectStore('blobs');
      const blobRefCountStore = tx.objectStore('blobRefCounts');
      const blobRefCount = await blobRefCountStore.get(id);
      if (!blobRefCount) {
        await blobRefCountStore.put({ blobId: id, refCount: 0 });
      }
      await blobStore.put(value, id);
      noteszMessageBus.emit('change:blob', id);
    });
  }

  async function incrementRefCount(
    id: string,
    transaction?: NoteszDbTransaction
  ) {
    return changeRefCount(id, 1, transaction);
  }

  async function decrementRefCount(
    id: string,
    transaction?: NoteszDbTransaction
  ) {
    return changeRefCount(id, -1, transaction);
  }

  async function applyBlobRefCountChanges(
    blobRefChanges: Map<string, number>,
    transaction?: NoteszDbTransaction
  ) {
    return initTransaction(transaction, async (tx) => {
      for (const [id, amount] of blobRefChanges) {
        if (amount !== 0) {
          await changeRefCount(id, amount, tx);
        }
      }
    });
  }

  async function changeRefCount(
    id: string,
    amount: number,
    transaction?: NoteszDbTransaction
  ) {
    return initTransaction(transaction, async (tx) => {
      const blobRefCountStore = tx.objectStore('blobRefCounts');
      const blobRefCount = await blobRefCountStore.get(id);
      if (!blobRefCount) {
        throw new NoteszError(`Missing blobRefCount for blob "${id}"`, {
          code: 'missing'
        });
      }
      const newRefCount = blobRefCount.refCount + amount;
      if (newRefCount < 0) {
        throw new Error(`Attempted to set negative refCount for blob "${id}"`);
      }
      blobRefCount.refCount = newRefCount;
      await blobRefCountStore.put(blobRefCount);
    });
  }

  async function collectGarbage(transaction?: NoteszDbTransaction) {
    return initTransaction(transaction, async (tx) => {
      const blobStore = tx.objectStore('blobs');
      const blobRefCountStore = tx.objectStore('blobRefCounts');
      const byRefCountIndex = blobRefCountStore.index('byRefCount');
      const blobRefCountsWithZeroRefs = await byRefCountIndex.getAll(0);
      const garbageBlobIds = blobRefCountsWithZeroRefs.map((blobRefCount) => blobRefCount.blobId);
      for (let i = 0; i < garbageBlobIds.length; ++i) {
        const blobId = garbageBlobIds[i];
        await blobStore.delete(blobId);
        await blobRefCountStore.delete(blobId);
        noteszMessageBus.emit('change:blob', blobId);
      }
    });
  }

  async function exists(blobId: string, transaction?: NoteszDbTransaction) {
    return initTransaction(transaction, async (tx) => {
      const blobStore = tx.objectStore('blobs');
      const key = await blobStore.getKey(blobId);
      return !!key;
    });
  }

  return{
    get,
    exists,
    put,
    incrementRefCount,
    decrementRefCount,
    applyBlobRefCountChanges,
    collectGarbage
  };
}
