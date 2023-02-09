import { ref } from 'vue';
import { useRouter } from 'vue-router';
import useFromDb from '@/composables/useFromDb';
import useSettings from '@/composables/useSettings';
import userModel from '@/model/userModel';
import trial from '@/utils/trial';
import authorize from './authorize';
import useNoteszMessageBus from '@/composables/useNoteszMessageBus';

export default function useRepositoryConnectAction() {
  const messages = useNoteszMessageBus();
  const router = useRouter();
  const settings = useSettings();
  const user = useFromDb({
    get() {
      return userModel.get();
    }
  });
  messages.on('change:user', () => {
    user.refetch();
  });
  const isAuthorizing = ref(false);
  const authError = ref<Error | undefined>();

  async function connect(options = { redirect: '/' }) {
    if (!settings.data) return;
    const connectRoute = `/connect?redirect=${options.redirect}`;
    if (!user.data && !user.isFetching) {
      isAuthorizing.value = true;
      authError.value = undefined;
      const [user, error] = await trial(() => authorize());
      if (user) {
        router.push(connectRoute);
      } else if (error.code === 'canceled') {
        // do nothing when canceled
      } else {
        authError.value = error;
      }
      isAuthorizing.value = false;
    } else {
      router.push(connectRoute);
    }
  }

  return {
    isAuthorizing,
    authError,
    connect
  };
}
