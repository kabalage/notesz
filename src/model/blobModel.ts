import NoteszError from '@/utils/NoteszError';
import { initTransaction, type NoteszDbTransaction } from './noteszDb';

export interface BlobRefCount {
  blobId: string,
  refCount: number
}

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
    const garbageBlobIds = blobRefCountsWithZeroRefs.map(blobRefCount => blobRefCount.blobId);
    for (let i = 0; i < garbageBlobIds.length; ++i) {
      await blobStore.delete(garbageBlobIds[i]);
      await blobRefCountStore.delete(garbageBlobIds[i]);
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

export default {
  get,
  exists,
  put,
  incrementRefCount,
  decrementRefCount,
  applyBlobRefCountChanges,
  collectGarbage
};
