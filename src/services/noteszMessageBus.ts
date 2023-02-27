import { onScopeDispose } from 'vue';
import { defineService } from '@/utils/defineService';
import createMessageBus from '@/utils/createMessageBus';

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

export const [
  provideNoteszMessageBus,
  useNoteszMessageBus
] = defineService('NoteszMessageBus', () => {
  const messageBus = createMessageBus<NoteszMessageTypes>();
  onScopeDispose(() => {
    messageBus.destroy();
  });
  return messageBus;
});
