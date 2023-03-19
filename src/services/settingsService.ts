import { defineService } from '@/utils/defineService';
import { useNoteszMessageBus } from '@/services/noteszMessageBus';
import { useAsyncState } from '@/composables/useAsyncState';
import { useSettingsModel } from '@/services/model/settingsModel';

export const [provideSettings, useSettings] = defineService('SettingsService', () => {
  const messages = useNoteszMessageBus();
  const settingsModel = useSettingsModel();

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
  messages.on('change:settings', () => {
    // message emitted by the ongoing put is ignored
    if (!settings.isPutting) {
      settings.refetch();
    }
  });
  return settings;
});
