import useFromDb from './useFromDb';
import settingsModel from '@/model/settingsModel';
import { createSharedComposable } from '@vueuse/shared';

export default createSharedComposable(() => useFromDb({
  get() {
    return settingsModel.get();
  },
  put(data) {
    if (data === undefined) {
      return;
    }
    return settingsModel.put(data);
  }
}));
