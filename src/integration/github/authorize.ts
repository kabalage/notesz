import { z } from 'zod';
import userModel from '@/model/userModel';
import waitForCallback from './waitForCallback';
import { request } from '@octokit/request';
import NoteszError from '@/utils/NoteszError';

const AuthCallbackParamsSchema = z.object({
  code: z.string(),
  state: z.string()
});

const TokenResponseSchema = z.object({
  token: z.string()
});

export default async function authorize() {
  // Redirect to github
  const authState = Math.random().toString().slice(2);
  const redirectUri = encodeURIComponent(`${location.origin}/callback/githubAuthorize`);
  const childWindow = window.open(
    `https://github.com/login/oauth/authorize?client_id=${import.meta.env.VITE_GITHUB_APP_CLIENT_ID}&redirect_uri=${redirectUri}&state=${authState}`,
    '_blank',
    'popup'
  );

  // Handle callback
  const callback = await waitForCallback('githubAuthorize', childWindow!);
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
  let callbackParams;
  try {
    callbackParams = AuthCallbackParamsSchema.parse(callback.params);
  } catch (error) {
    throw new NoteszError('Callback parameters do not match the expected format', {
      cause: error
    });
  }
  if (authState !== callbackParams.state) {
    throw new NoteszError('State mismatch');
  }

  // Fetch token
  let tokenResponse;
  try {
    tokenResponse = await fetch('/api/github/oauth/token', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        code: callbackParams.code
      })
    });
  } catch (error) {
    throw new NoteszError('Token fetch failed', {
      cause: error
    });
  }
  let tokenResponseObject;
  try {
    tokenResponseObject = await tokenResponse.json();
  } catch (error) {
    throw new NoteszError('Token parsing failed', {
      cause: error
    });
  }
  if (!tokenResponse.ok) {
    throw new NoteszError('Obtaining token failed', {
      cause: tokenResponseObject.message
    });
  }
  let token: string | undefined;
  try {
    ({ token } = TokenResponseSchema.parse(tokenResponseObject));
  } catch (error) {
    throw new NoteszError('Token response parameters do not match the expected format', {
      cause: error
    });
  }

  // Fetch user's primary email
  let email: string | undefined;
  try {
    const response = await request('GET /user/emails', {
      headers: {
        authorization: `Bearer ${token}`
      }
    });
    email = response.data.find((email) => {
      return email.primary;
    })?.email;
  } catch (error) {
    throw new NoteszError('Getting primary email failed', {
      cause: error
    });
  }
  if (!email) {
    throw new NoteszError('Missing primary email');
  }

  // Save email and token
  const user = {
    type: 'user' as const,
    email,
    token
  };
  await userModel.put(user);
  return user;
}
