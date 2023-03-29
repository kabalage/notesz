import { defineService, type InjectResult } from '@/utils/injector';
import { useAuthorize } from './github/authorize';
import { useInstall } from './github/install';
import { useListAuthorizedRepositories } from './github/listAuthorizedRepositories';
import { useUseSyncAction } from './github/useSyncAction';

const dependencies = [
  ...useAuthorize.dependencies,
  ...useInstall.dependencies,
  ...useListAuthorizedRepositories.dependencies,
  ...useUseSyncAction.dependencies,
];

export const GitHubIntegration = defineService({
  name: 'GitHubIntegration',
  dependencies,
  setup
});

function setup(deps: InjectResult<typeof dependencies>) {
  const authorize = useAuthorize(deps);
  const install = useInstall(deps);
  const listAuthorizedRepositories = useListAuthorizedRepositories(deps);
  const useSyncAction = useUseSyncAction(deps);

  return {
    authorize,
    install,
    listAuthorizedRepositories,
    useSyncAction
  };
}
