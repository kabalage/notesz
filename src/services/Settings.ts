/*
  Settings

    Loads and saves the settings data.
    Changes to the settings are automatically persisted to the database.
*/

import { defineService, type InjectResult } from '@/utils/injector';
import { NoteszMessageBus } from '@/services/NoteszMessageBus';
import { useAsyncState } from '@/composables/useAsyncState';
import { SettingsModel } from '@/services/model/SettingsModel';

const dependencies = [NoteszMessageBus, SettingsModel];

export const Settings = defineService({
  name: 'Settings',
  dependencies,
  setup
});

function setup({ noteszMessageBus, settingsModel }: InjectResult<typeof dependencies>) {
  const settings = useAsyncState({
    get() {
      return settingsModel.get();
    },
    put(data) {
      if (data === undefined) {
        return;
      }
      return settingsModel.put(data);
    }
  });
  noteszMessageBus.on('change:settings', () => {
    // message emitted by the ongoing put is ignored
    if (!settings.isPutting) {
      settings.refetch();
    }
  });
  return settings;
}
