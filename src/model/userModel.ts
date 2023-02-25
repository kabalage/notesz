import { defineService } from '@/utils/injector';
import { useNoteszDb, type NoteszDbTransaction } from '@/services/model/noteszDb';
import { useNoteszMessageBus } from '@/services/noteszMessageBus';

export interface User {
  readonly type: 'user',
  email: string,
  token: string
}

export function createUser(
  initialValues: Pick<User, 'email' | 'token'> & Partial<User>
): User {
  return {
    type: 'user',
    ...initialValues
  };
}

export const useUserModel = defineService('UserModel', () => {
  const { initTransaction } = useNoteszDb();
  const messages = useNoteszMessageBus();

  async function get(transaction?: NoteszDbTransaction) {
    return initTransaction(transaction, async (tx) => {
      const appStore = tx.objectStore('app');
      return (await appStore.get('user')) as User | undefined;
    });
  }

  async function put(user: User, transaction?: NoteszDbTransaction) {
    return initTransaction(transaction, async (tx) => {
      const appStore = tx.objectStore('app');
      const result = await appStore.put(user);
      messages.emit('change:user');
      return result;
    });
  }

  return {
    createUser,
    get,
    put
  };
});
