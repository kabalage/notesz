import type { VercelRequest, VercelResponse } from '@vercel/node';
import { OAuthApp } from '@octokit/oauth-app';

let app: InstanceType<typeof OAuthApp>;
if (process.env.GITHUB_APP_CLIENT_ID && process.env.GITHUB_APP_CLIENT_SECRET) {
  app = new OAuthApp({
    clientType: 'github-app',
    clientId: process.env.GITHUB_APP_CLIENT_ID!,
    clientSecret: process.env.GITHUB_APP_CLIENT_SECRET!
  });
}

export default async (req: VercelRequest, res: VercelResponse ) => {
  const { method, body } = req;
  // console.log(method, body);
  if (method === 'POST') {
    if (!app) {
      return res.status(500).json({
        message: 'GitHub App configuration missing'
      });
    }
    if (!body.code) {
      return res.status(400).json({
        message: 'Missing paramerter: code'
      });
    }
    try {
      // console.log('before create');
      const tokenResponse = await app.createToken({
        code: body.code
      });
      // console.log(tokenResponse.authentication.token);
      return res.status(200).json({
        token: tokenResponse.authentication.token
      });
    } catch {
      // console.error(err);
      return res.status(500).json({
        message: 'Token creation failed'
      });
    }
  }
  return res.status(404).send('');
};
