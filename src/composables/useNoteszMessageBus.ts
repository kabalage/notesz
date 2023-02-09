import createMessageBus from '@/utils/createMessageBus';
import { createSharedComposable, tryOnScopeDispose } from '@vueuse/shared';

export interface NoteszMessageTypes {
  'change:user': void;
  'change:settings': void;
  'change:repository': string;
  'change:fileIndex': {
    repositoryId: string;
    indexId: string;
  },
  'change:blob': string;
  'callback': {
    // TODO needs more constraints
    type: string;
    params: any;
  };
}

export default createSharedComposable(() => {
  const messageBus = createMessageBus<NoteszMessageTypes>();
  tryOnScopeDispose(() => {
    messageBus.destroy();
  });
  return messageBus;
});

