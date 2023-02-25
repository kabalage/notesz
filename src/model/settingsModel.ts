import { defineService } from '@/utils/injector';
import { useNoteszDb, type NoteszDbTransaction } from '@/services/model/noteszDb';
import { useNoteszMessageBus } from '@/services/noteszMessageBus';
import { defaultThemes, type ColorName } from './settingsModel/themeData';

export interface Theme {
  mainColor: ColorName,
  accentColor: ColorName,
  backgroundColor: number
}

export interface Settings {
  readonly type: 'settings',
  selectedRepositoryId: string | null,
  selectedTheme: number,
  themes: Theme[]
}

export function createSettings(
  initialValues: Partial<Settings> = {}
): Settings {
  return {
    type: 'settings',
    selectedRepositoryId: null,
    selectedTheme: 0,
    themes: window.structuredClone(defaultThemes),
    ...initialValues,
  };
}

export const useSettingsModel = defineService('SettingsModel', () => {
  const { initTransaction } = useNoteszDb();
  const messages = useNoteszMessageBus();

  async function get(transaction?: NoteszDbTransaction) {
    return initTransaction(transaction, async (tx) => {
      const appStore = tx.objectStore('app');
      return (await appStore.get('settings')) as Settings | undefined;
    });
  }

  async function put(settings: Settings, transaction?: NoteszDbTransaction) {
    return initTransaction(transaction, async (tx) => {
      const appStore = tx.objectStore('app');
      const result = await appStore.put(settings);
      messages.emit('change:settings');
      return result;
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
        messages.emit('change:settings');
      }
    });
  }

  return {
    createSettings,
    get,
    put,
    update
  };
});
