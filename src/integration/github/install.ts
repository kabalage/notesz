import { z } from 'zod';
import NoteszError from '@/utils/NoteszError';
import waitForCallback from './waitForCallback';

const CallbackParamsSchema = z.object({
  installation_id: z.preprocess((arg: any) => Number(arg), z.number().int()),
  setup_action: z.enum(['update', 'install'])
});

export default async function install() {
  // Redirect to GitHub
  const childWindow = window.open(
    `https://github.com/apps/${import.meta.env.VITE_GITHUB_APP_URL_NAME}/installations/new`,
    '_blank',
    'popup'
  );

  // Handle callback
  const callback = await waitForCallback('githubPostInstall', childWindow!);
  if (callback.canceled) {
    return { canceled: true };
  }
  let callbackParams;
  try {
    callbackParams = CallbackParamsSchema.parse(callback.params);
  } catch (error) {
    throw new NoteszError('Callback parameters do not match the expected format', {
      cause: error
    });
  }
  return {
    canceled: false,
    update: {
      installationId: callbackParams.installation_id,
      setupAction: callbackParams.setup_action as typeof callbackParams.setup_action
    }
  };
}
