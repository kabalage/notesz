import useFromDb from './useFromDb';
import settingsModel from '@/model/settingsModel';
import { createSharedComposable } from '@vueuse/shared';
import useNoteszMessageBus from '@/composables/useNoteszMessageBus';

import { tryOnScopeDispose } from '@vueuse/core';

export default createSharedComposable(() => {
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
  function onSettingsUpdate() {
    settings.refetch();
  }
  const bus = useNoteszMessageBus();
  bus.on('update:settings', onSettingsUpdate);
  tryOnScopeDispose(() => {
    bus.off('update:settings', onSettingsUpdate);
  });
  return settings;
});
