import useFromDb from './useFromDb';
import settingsModel from '@/model/settingsModel';
import { createSharedComposable } from '@vueuse/shared';
import useNoteszMessageBus from '@/composables/useNoteszMessageBus';

export default createSharedComposable(() => {
  const messages = useNoteszMessageBus();
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
