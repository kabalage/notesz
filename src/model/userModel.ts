import { initTransaction, type NoteszDbTransaction } from './noteszDb';
import useNoteszMessageBus from '@/composables/useNoteszMessageBus';

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
  const messages = useNoteszMessageBus();
  return initTransaction(transaction, async (tx) => {
    const appStore = tx.objectStore('app');
    const result = await appStore.put(user);
    messages.emit('change:user');
    return result;
  });
}

export default {
  get,
  put
};
