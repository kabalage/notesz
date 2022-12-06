// import requestWithAuth from './requestWithAuth';
import userModel from '@/model/userModel';
import NoteszError from '@/utils/NoteszError';
import { request } from '@octokit/request';
import { RequestError } from '@octokit/request-error';
import type { Endpoints } from '@octokit/types';

export default async function listAuthorizedRepositories(update?: {
  installationId: number,
  setupAction: 'update' | 'install'
}) {
  const user = await userModel.get();
  if (!user) {
    throw new NoteszError('Unauthorized user', {
      code: 'unauthorized'
    });
  }

  // Get installations
  const authHeader = `Bearer ${user.token}`;
  let installationsResponse;
  try {
    const bypassCache = !update || update?.setupAction === 'install';
    installationsResponse = await request('GET /user/installations', {
      headers: {
        authorization: authHeader
      },
      request: {
        cache: bypassCache ? 'reload' : 'default'
      }
    });
  } catch (error) {
    if (error instanceof RequestError) {
      if (error.status === 401) {
        throw new NoteszError('Unauthorized user', {
          code: 'unauthorized',
          cause: error
        });
      }
      throw new NoteszError('Getting installations failed', {
        cause: error
      });
    }
    throw error;
  }
  // console.log(installationsResponse);
  const installations = installationsResponse.data.installations;
  if (installations.length === 0) {
    return [];
  }

  // Get repositories
  const repositoriesRoute = 'GET /user/installations/{installation_id}/repositories';
  const repositories: Endpoints[typeof repositoriesRoute]['response']['data']['repositories'] = [];
  for (const i in installations) {
    const installation = installations[i];
    let repositoriesResponse;
    try {
      const bypassCache = !update || update?.setupAction === 'update'
        && update?.installationId === installation.id;
      repositoriesResponse = await request(repositoriesRoute, {
        headers: {
          authorization: authHeader
        },
        request: {
          cache: bypassCache ? 'reload' : 'default'
        },
        installation_id: installation.id
      });
    } catch (error) {
      if (error instanceof RequestError) {
        if (error.status === 401) {
          throw new NoteszError('Unauthorized user', {
            code: 'unauthorized',
            cause: error
          });
        }
        throw new NoteszError('Getting repositories failed', {
          cause: error
        });
      }
      throw error;
    }
    repositories.push(...repositoriesResponse.data.repositories);
  }
  return repositories;
}
