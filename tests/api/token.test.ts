
import { OAuthApp } from '@octokit/oauth-app';
import type { Mock } from 'vitest';
import { createMockVercelRequest, createMockVercelResponse } from './helpers';

process.env.GITHUB_APP_CLIENT_ID = 'requiredByTheTokenRequest';
process.env.GITHUB_APP_CLIENT_SECRET = 'requiredByTheTokenRequest';

import oauthTokenRequest from '../../api/github/oauth/token';

const MOCK_TOKEN = '123456789';

vi.mock('@octokit/oauth-app', () => {
  const OAuthApp = vi.fn();
  OAuthApp.prototype.createToken = vi.fn(() => ({
    authentication: {
      token: MOCK_TOKEN
    }
  }));
  return { OAuthApp };
});

describe('oauthTokenRequest', () => {

  it('should return a token if token creation succeeds', async () => {
    const req = createMockVercelRequest({
      method: 'POST',
      url: '/api/github/oauth/token',
      body: {
        code: '123'
      }
    });
    const res = createMockVercelResponse();

    await oauthTokenRequest(req, res);

    expect(res.status).toBeCalledTimes(1);
    expect(res.status).toBeCalledWith(200);
    expect(res.json).toBeCalledTimes(1);
    const responseJson = res.json.mock.lastCall?.[0];
    expect(responseJson?.token).toBe(MOCK_TOKEN);
  });

  it('should return 500 if token creation fails', async () => {
    (OAuthApp.prototype.createToken as Mock).mockImplementationOnce(() => {
      throw new Error('Some GitHub error');
    });
    const req = createMockVercelRequest({
      method: 'POST',
      url: '/api/github/oauth/token',
      body: {
        code: '123'
      }
    });
    const res = createMockVercelResponse();

    await oauthTokenRequest(req, res);

    expect(res.status).toBeCalledTimes(1);
    expect(res.status).toBeCalledWith(500);
    expect(res.json).toBeCalledTimes(1);
    const responseJson = res.json.mock.lastCall?.[0];
    expect(responseJson).toHaveProperty('message');
  });

  it('should return 400 if code is missing', async () => {
    const req = createMockVercelRequest({
      method: 'POST',
      url: '/api/github/oauth/token',
      body: {}
    });
    const res = createMockVercelResponse();

    await oauthTokenRequest(req, res);

    expect(res.status).toBeCalledTimes(1);
    expect(res.status).toBeCalledWith(400);
    expect(res.json).toBeCalledTimes(1);
    const responseJson = res.json.mock.lastCall?.[0];
    expect(responseJson).toHaveProperty('message');
  });

  it('should return 404 if method is not POST', async () => {
    const req = createMockVercelRequest({
      method: 'GET',
      url: '/api/github/oauth/token',
      body: {}
    });
    const res = createMockVercelResponse();

    await oauthTokenRequest(req, res);

    expect(res.status).toBeCalledTimes(1);
    expect(res.status).toBeCalledWith(404);
    expect(res.send).toBeCalledTimes(1);
  });

});
