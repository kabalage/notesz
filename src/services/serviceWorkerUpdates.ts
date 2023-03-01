import { defineService } from '@/utils/defineService';
import { registerSW } from 'virtual:pwa-register';
import { useDialogService } from '@/services/dialogService';

export const [
  provideServiceWorkerUpdates,
  useServiceWorkerUpdates
] = defineService('ServiceWorkerUpdates', () => {

  const dialogService = useDialogService();

  const updateSW = registerSW({
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
});
