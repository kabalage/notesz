import useFromDb from '@/composables/useFromDb';
import useSettings from '@/composables/useSettings';
import userModel from '@/model/userModel';
import NoteszError from '@/utils/NoteszError';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
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
  const authError = ref<NoteszError | undefined>();

  async function connect(fromWelcome = false) {
    if (!settings.data) return;
    const connectRoute = fromWelcome ? '/connect' : '/settings/connect';
    if (!user.data && !user.isFetching) {
      try {
        isAuthorizing.value = true;
        authError.value = undefined;
        await authorize();
        router.push(connectRoute);
      } catch (error) {
        if (error instanceof NoteszError) {
          if (error.code !== 'canceled') {
            authError.value = error;
          }
        } else {
          authError.value = new NoteszError('Authorization failed', {
            cause: error
          });
        }
      } finally {
        isAuthorizing.value = false;
      }
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
