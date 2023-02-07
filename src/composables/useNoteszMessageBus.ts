import createMessageBus from '@/utils/createMessageBus';
import { createSharedComposable, tryOnScopeDispose } from '@vueuse/shared';

interface NoteszMessageTypes {
  'update:settings': void;
}

export default createSharedComposable(() => {
  const bus = createMessageBus<NoteszMessageTypes>();
  tryOnScopeDispose(() => {
    bus.destroy();
  });
  return bus;
});

