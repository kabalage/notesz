import { z } from 'zod';
import { NoteszError } from '@/utils/NoteszError';
import { waitForCallback } from '@/utils/waitForCallback';
import { trial } from '@/utils/trial';
import { useNoteszMessageBus } from '@/services/noteszMessageBus';

const CallbackParamsSchema = z.object({
  installation_id: z.preprocess((arg: any) => Number(arg), z.number().int()),
  setup_action: z.enum(['update', 'install'])
});

export function useInstall() {
  const messageBus = useNoteszMessageBus();

  return async function install() {
    // Redirect to GitHub
    const childWindow = window.open(
      `https://github.com/apps/${import.meta.env.VITE_GITHUB_APP_URL_NAME}/installations/new`,
      '_blank',
      'popup'
    );

    // Handle callback
    const callback = await waitForCallback(
      'githubPostInstall',
      childWindow!,
      messageBus
    );
    if (callback.canceled) {
      return { canceled: true };
    }
    const [callbackParams, callbackParseError] = await trial(() => {
      return CallbackParamsSchema.parse(callback.params);
    });
    if (callbackParseError) {
      throw new NoteszError('Callback parameters do not match the expected format', {
        cause: callbackParseError
      });
    }
    return {
      canceled: false,
      update: {
        installationId: callbackParams.installation_id,
        setupAction: callbackParams.setup_action as typeof callbackParams.setup_action
      }
    };
  };
}
