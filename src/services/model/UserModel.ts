import { defineService, type InjectResult } from '@/utils/injector';
import { NoteszDb, type NoteszDbTransaction } from '@/services/model/NoteszDb';
import { NoteszMessageBus } from '@/services/NoteszMessageBus';

export interface User {
  readonly type: 'user',
  token: string
}

export function createUser(
  initialValues: Pick<User, 'token'> & Partial<User>
): User {
  return {
    type: 'user',
    ...initialValues
  };
}

const dependencies = [NoteszDb, NoteszMessageBus];

export const UserModel = defineService({
  name: 'UserModel',
  dependencies,
  setup
});

function setup({ noteszDb, noteszMessageBus }: InjectResult<typeof dependencies>) {
  const { initTransaction } = noteszDb;

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
      noteszMessageBus.emit('change:user');
      return result;
    });
  }

  return {
    createUser,
    get,
    put
  };
}
