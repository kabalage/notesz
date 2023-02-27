import { defineService } from '@/utils/defineService';
import { useNoteszMessageBus } from '@/services/noteszMessageBus';
import { useFromDb } from '@/composables/useFromDb';
import { useSettingsModel } from '@/services/model/settingsModel';

export const [provideSettings, useSettings] = defineService('SettingsService', () => {
  const messages = useNoteszMessageBus();
  const settingsModel = useSettingsModel();

  const settings = useFromDb({
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
