import { initTransaction, type NoteszDbTransaction } from './noteszDb';

export interface User {
  readonly type: 'user',
  email: string,
  token: string
}

async function get(transaction?: NoteszDbTransaction) {
  return initTransaction(transaction, async (tx) => {
    const appStore = tx.objectStore('app');
    return (await appStore.get('user')) as User | undefined;
  });
}

async function put(user: User, transaction?: NoteszDbTransaction) {
  return initTransaction(transaction, async (tx) => {
    const appStore = tx.objectStore('app');
    return await appStore.put(user);
  });
}

export default {
  get,
  put
};
