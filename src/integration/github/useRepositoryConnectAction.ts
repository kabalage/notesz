import { ref } from 'vue';
import { useRouter } from 'vue-router';
import useFromDb from '@/composables/useFromDb';
import useSettings from '@/composables/useSettings';
import userModel from '@/model/userModel';
import trial from '@/utils/trial';
import authorize from './authorize';

export default function useRepositoryConnectAction() {
  const router = useRouter();
  const settings = useSettings();
  const user = useFromDb({
    get() {
      return userModel.get();
    }
  });
  const isAuthorizing = ref(false);
  const authError = ref<Error | undefined>();

  async function connect(fromWelcome = false) {
    if (!settings.data) return;
    const connectRoute = fromWelcome ? '/connect' : '/settings/connect';
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
