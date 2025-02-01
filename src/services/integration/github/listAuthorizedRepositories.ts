import { request as octokitRequest } from '@octokit/request';
import { RequestError } from '@octokit/request-error';
import type { Endpoints } from '@octokit/types';
import { NoteszError } from '@/utils/NoteszError';
import { trial } from '@/utils/trial';
import type { InjectResult } from '@/utils/injector';
import { UserModel } from '@/services/model/UserModel';
import type { InstallResult } from './install';

const dependencies = [UserModel];
useListAuthorizedRepositories.dependencies = dependencies;

export function useListAuthorizedRepositories({ userModel }: InjectResult<typeof dependencies>) {

  return async function listAuthorizedRepositories(installResult?: InstallResult) {
    const user = await userModel.get();
    if (!user) {
      throw new NoteszError('Unauthorized user', {
        code: 'unauthorized'
      });
    }

    // Get installations
    const authHeader = `Bearer ${user.token}`;
    const [installationsResponse, installationsError] = await trial(() => {
      const bypassCache = !installResult || installResult?.setupAction === 'install';
      return octokitRequest('GET /user/installations', {
        headers: {
          authorization: authHeader
        },
        request: {
          fetch: bypassCache ? fetchThatBypassesCache : undefined
        },
      });
    });
    if (installationsError) {
      if (installationsError instanceof RequestError && installationsError.status === 401) {
        throw new NoteszError('Unauthorized user', {
          code: 'unauthorized',
          cause: installationsError
        });
      }
      throw new NoteszError('Getting installations failed', {
        cause: installationsError
      });
    }
    const installations = installationsResponse.data.installations;
    if (installations.length === 0) {
      return [];
    }

    // Get repositories
    const repositoriesRoute = 'GET /user/installations/{installation_id}/repositories';
    const repositories: Endpoints[typeof repositoriesRoute]['response']['data']['repositories']
      = [];
    for (const i in installations) {
      const installation = installations[i];
      const [repositoriesResponse, repositoriesError] = await trial(() => {
        const bypassCache = !installResult || installResult?.setupAction === 'update'
          && installResult?.installationId === installation.id;
        console.log('bypassCache', bypassCache, installResult, installation.id);
        return octokitRequest(repositoriesRoute, {
          headers: {
            authorization: authHeader
          },
          request: {
            fetch: bypassCache ? fetchThatBypassesCache : undefined
          },
          installation_id: installation.id
        });
      });
      if (repositoriesError) {
        if (repositoriesError instanceof RequestError && repositoriesError.status === 401) {
          throw new NoteszError('Unauthorized user', {
            code: 'unauthorized',
            cause: repositoriesError
          });
        }
        throw new NoteszError('Getting repositories failed', {
          cause: repositoriesError
        });
      }
      repositories.push(...repositoriesResponse.data.repositories);
    }
    return repositories;
  };
}

function fetchThatBypassesCache(url: RequestInfo | URL, requestInit?: RequestInit) {
  return fetch(url, {
    ...requestInit,
    cache: 'reload'
  });
}
