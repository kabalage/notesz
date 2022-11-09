import { openNoteszDb } from './db';

export interface AppSettings {
  readonly type: 'appSettings',
  selectedRepositoryId: string | null,
  theme: 'system' | 'dark' | 'light',
}

async function get(type: string) {
  const db = await openNoteszDb();
  try {
    return (await db.get('settings', type) as AppSettings);
  } finally {
    db.close();
  }
}

async function put(settings: AppSettings) {
  const db = await openNoteszDb();
  try {
    return await db.put('settings', settings);
  } finally {
    db.close();
  }
}

async function update(type: string, updater: (settings: AppSettings) => AppSettings | undefined) {
  const db = await openNoteszDb();
  try {
    const tx = db.transaction('settings', 'readwrite');
    const settingsStore = tx.objectStore('settings');
    const settings = (await settingsStore.get(type)) as AppSettings;
    const newSettings = updater(settings);
    if (newSettings) {
      await settingsStore.put(newSettings);
    }
    await tx.done;
  } finally {
    db.close();
  }
}

export const settings = {
  get,
  put,
  update
};
