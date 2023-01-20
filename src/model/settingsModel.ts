import { initTransaction, type NoteszDbTransaction } from './noteszDb';

export interface Settings {
  readonly type: 'settings',
  selectedRepositoryId: string | null
}

async function get(transaction?: NoteszDbTransaction) {
  return initTransaction(transaction, async (tx) => {
    const appStore = tx.objectStore('app');
    return (await appStore.get('settings')) as Settings | undefined;
  });
}

async function put(settings: Settings, transaction?: NoteszDbTransaction) {
  return initTransaction(transaction, async (tx) => {
    const appStore = tx.objectStore('app');
    return await appStore.put(settings);
  });
}

async function update(
  updater: (settings: Settings) => Settings | undefined,
  transaction?: NoteszDbTransaction
) {
  return initTransaction(transaction, async (tx) => {
    const appStore = tx.objectStore('app');
    const settings = (await appStore.get('settings')) as Settings | undefined;
    if (!settings) {
      throw new Error('Settings not found');
    }
    const newSettings = updater(settings);
    if (newSettings) {
      await appStore.put(newSettings);
    }
  });
}

export default {
  get,
  put,
  update
};
