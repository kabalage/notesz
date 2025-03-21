import { z } from 'zod';
import { NoteszError } from '@/utils/NoteszError';
import { waitForCallback } from '@/utils/waitForCallback';
import { trial } from '@/utils/trial';
import type { InjectResult } from '@/utils/injector';
import { NoteszMessageBus } from '@/services/NoteszMessageBus';

const CallbackParamsSchema = z.object({
  installation_id: z.preprocess((arg: any) => Number(arg), z.number().int()),
  setup_action: z.enum(['update', 'install'])
});

const dependencies = [NoteszMessageBus];
useInstall.dependencies = dependencies;

export type InstallResult = {
  installationId: number,
  setupAction: 'update' | 'install'
}

export function useInstall({ noteszMessageBus }: InjectResult<typeof dependencies>) {

  return async function install(): Promise<{
    canceled: boolean,
    result?: InstallResult
  }> {
    // Redirect to GitHub

    // eslint-disable-next-line max-len
    // https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/about-the-setup-url
    const childWindow = window.open(
      `https://github.com/apps/${import.meta.env.VITE_GITHUB_APP_URL_NAME}/installations/new`,
      '_blank',
      'popup'
    );

    // Handle callback
    const callback = await waitForCallback(
      'githubPostInstall',
      childWindow!,
      noteszMessageBus
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
      result: {
        installationId: callbackParams.installation_id,
        setupAction: callbackParams.setup_action as typeof callbackParams.setup_action
      }
    };
  };
}
