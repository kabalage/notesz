import { defineService } from '@/utils/injector';
import { useAuthorize } from './github/authorize';
import { useInstall } from './github/install';
import { useListAuthorizedRepositories } from './github/listAuthorizedRepositories';
import { useUseSyncAction } from './github/useSyncAction';

export const useGitHubIntegration = defineService('GitHubIntegration', () => {
  const authorize = useAuthorize();
  const install = useInstall();
  const listAuthorizedRepositories = useListAuthorizedRepositories();
  const useSyncAction = useUseSyncAction();

  return {
    authorize,
    install,
    listAuthorizedRepositories,
    useSyncAction
  };
});