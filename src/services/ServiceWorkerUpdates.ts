import { onScopeDispose } from 'vue';
import { defineService, type InjectResult } from '@/utils/injector';
import { registerSW } from 'virtual:pwa-register';
import { DialogService } from '@/services/DialogService';

const dependencies = [DialogService];

export const ServiceWorkerUpdates = defineService({
  name: 'ServiceWorkerUpdates',
  dependencies,
  setup
});

function setup({ dialogService }: InjectResult<typeof dependencies>) {
  let swRegistration: ServiceWorkerRegistration | undefined;
  let swUrl = '';
  const updateInterval = 1000 * 60 * 60;
  const retryInterval = 1000 * 60 * 5;
  let lastUpdateCheck = Date.now();
  let updateTimer: number | undefined;

  const updateSW = registerSW({
    onRegisteredSW(url, registration) {
      if (!registration) return;
      swUrl = url;
      swRegistration = registration;
      setTimeout(checkForUpdates, updateInterval);
    },
    async onNeedRefresh() {
      const shouldUpdate = await dialogService.confirm({
        title: 'Update available',
        description: 'A new version of <em>Notesz</em> is available. Do you want to update now?',
        confirmButtonLabel: 'Update',
        rejectButtonLabel: 'Later'
      });
      if (shouldUpdate) {
        updateSW();
      }
    }
  });

  async function checkForUpdates(force = false) {
    if (!swRegistration) return;
    window.clearTimeout(updateTimer);
    if (force || Date.now() - lastUpdateCheck > updateInterval) {
      lastUpdateCheck = Date.now();
      if (swRegistration.installing && navigator) {
        setTimeout(checkForUpdates, updateInterval);
        return;
      }

      if (('connection' in navigator) && !navigator.onLine) {
        setTimeout(checkForUpdates, retryInterval);
        return;
      }

      const resp = await fetch(swUrl, {
        cache: 'no-store',
        headers: {
          'cache': 'no-store',
          'cache-control': 'no-cache',
        },
      });

      if (resp?.status === 200) {
        swRegistration.update();
        setTimeout(checkForUpdates, updateInterval);
      } else {
        setTimeout(checkForUpdates, retryInterval);
      }
    }
  }

  onScopeDispose(() => {
    window.clearTimeout(updateTimer);
  });

  return {
    checkForUpdates: () => checkForUpdates(true)
  };
}
