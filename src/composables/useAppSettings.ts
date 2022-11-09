import { useFromDb } from './useFromDb';
import { settings } from '@/model/settings';
import { createSharedComposable } from '@vueuse/shared';

export const useAppSettings = createSharedComposable(() => useFromDb({
  get() {
    return settings.get('appSettings');
  },
  put(data) {
    return settings.put(data);
  }
}));
