import { z } from 'zod';
import { request as octokitRequest } from '@octokit/request';
import { waitForCallback } from '@/utils/waitForCallback';
import { NoteszError } from '@/utils/NoteszError';
import { trial } from '@/utils/trial';
import { useUserModel } from '@/services/model/userModel';
import { useNoteszMessageBus } from '@/services/noteszMessageBus';

const AuthCallbackParamsSchema = z.object({
  code: z.string(),
  state: z.string()
});

const TokenResponseSchema = z.object({
  token: z.string()
});

export function useAuthorize() {
  const userModel = useUserModel();
  const messageBus = useNoteszMessageBus();

  return async function authorize() {
    // Redirect to GitHub
    const authState = Math.random().toString().slice(2);
    const redirectUri = encodeURIComponent(`${location.origin}/callback/githubAuthorize`);
    const childWindow = window.open(
      `https://github.com/login/oauth/authorize?client_id=${import.meta.env.VITE_GITHUB_APP_CLIENT_ID}&redirect_uri=${redirectUri}&state=${authState}`,
      '_blank',
      'popup'
    );

    // Handle callback
    const callback = await waitForCallback(
      'githubAuthorize',
      childWindow!,
      messageBus
    );
    if (callback.canceled) {
      throw new NoteszError('GitHub authorization was canceled', {
        code: 'canceled'
      });
    }
    if (callback.params?.error) {
      throw new NoteszError('GitHub authorization failed', {
        cause: callback.params?.error_description
      });
    }
    const [callbackParams, callbackParseError] = trial(() => {
      return AuthCallbackParamsSchema.parse(callback.params);
    });
    if (callbackParseError) {
      throw new NoteszError('Callback parameters do not match the expected format', {
        cause: callbackParseError
      });
    }
    if (authState !== callbackParams.state) {
      throw new Error('State mismatch');
    }

    // Fetch token
    const [tokenResponse, tokenFetchError] = await trial(() => {
      return fetch('/api/github/oauth/token', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          code: callbackParams.code
        })
      });
    });
    if (tokenFetchError) {
      throw new NoteszError('Token fetch failed', {
        cause: tokenFetchError
      });
    }
    const [tokenResponseObject, tokenJsonError] = await trial(() => {
      return tokenResponse.json();
    });
    if (tokenJsonError) {
      throw new NoteszError('Token JSON parsing failed', {
        cause: tokenJsonError
      });
    }
    if (!tokenResponse.ok) {
      throw new NoteszError('Obtaining token failed', {
        cause: tokenResponseObject.message
      });
    }
    const [tokenSchemaCheckResult, tokenSchemaError] = trial(() => {
      return TokenResponseSchema.parse(tokenResponseObject);
    });
    if (tokenSchemaError) {
      throw new NoteszError('Token response schema do not match the expected format', {
        cause: tokenSchemaError
      });
    }
    const token = tokenSchemaCheckResult.token;

    // Save token
    const user = userModel.createUser({
      token
    });
    await userModel.put(user);
    return user;
  };
}
