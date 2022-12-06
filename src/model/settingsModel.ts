import openNoteszDb from './openNoteszDb';

export interface Settings {
  readonly type: 'settings',
  selectedRepositoryId: string | null
}

async function get() {
  const db = await openNoteszDb();
  try {
    return (await db.get('app', 'settings') as Settings | undefined);
  } finally {
    db.close();
  }
}

async function put(settings: Settings) {
  const db = await openNoteszDb();
  try {
    return await db.put('app', settings);
  } finally {
    db.close();
  }
}

async function update(updater: (settings: Settings) => Settings | undefined) {
  const db = await openNoteszDb();
  try {
    const tx = db.transaction('app', 'readwrite');
    const settingsStore = tx.objectStore('app');
    const settings = (await settingsStore.get('settings')) as Settings;
    const newSettings = updater(settings);
    if (newSettings) {
      await settingsStore.put(newSettings);
    }
    await tx.done;
  } finally {
    db.close();
  }
}

export default {
  get,
  put,
  update
};
