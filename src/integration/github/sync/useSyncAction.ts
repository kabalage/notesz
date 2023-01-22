import { ref } from 'vue';
import repositoryModel from '@/model/repositoryModel';
import getNewCommits from './getNewCommits';
import fetchCommit from './fetchCommit';
import rebase from './rebase';
import continueRebase from './continueRebase';
import push from './push';
import createProgress from '@/utils/createProgress';
import clamp from '@/utils/clamp';

export default function useSyncAction() {
  const isSyncing = ref(false);
  const syncProgress = ref(0);
  const syncProgressMessage = ref('');

  const rootProgress = createProgress({
    from: 0,
    to: 1,
    setProgress(value: number) {
      syncProgress.value = clamp(value, 0, 1);
    },
    setMessage(message: string) {
      syncProgressMessage.value = message;
    }
  });

  async function sync(repositoryId: string, progress = rootProgress) {
    try {
      progress.set(0.1);
      isSyncing.value = true;
      const repository = await repositoryModel.get(repositoryId);
      if (!repository) {
        throw new Error(`Missing repository '${repositoryId}'`);
      }
      if (repository.manualRebaseInProgress) {
        progress.set(0.2);
        progress.setMessage('Rebasing');
        await continueRebase(repositoryId);
      }
      progress.set(0.3);
      progress.setMessage('Fetching new commits...');
      const commitsToFetch = await getNewCommits(repositoryId);
      progress.set(0.4);
      await progress.subTask(0.4, 0.9, async (progress) => {
        for (let i = 0; i < commitsToFetch.length; i++) {
          const len = commitsToFetch.length;
          await progress.subTask(i / len, (i + 1) / len, async (progress) => {
            const nextCommit = commitsToFetch[i];
            progress.setMessage(`Fetching commit: ${nextCommit.sha.slice(0, 7)}`);
            await fetchCommit(repositoryId, nextCommit, progress.subProgress(0, 0.8));
            progress.setMessage('Rebasing');
            progress.set(0.8);
            await rebase(repositoryId);
            progress.set(0.9);
            await continueRebase(repositoryId); // throws an error if there are conflicts
            progress.set(1);
          });
        }
      });
      progress.set(0.9);
      try {
        await push(repositoryId, progress.subProgress(0.9, 1));
        progress.set(1);
      } catch (err) {
        if (err instanceof Error && err.code === 'pushRejected') {
          await sync(repositoryId, progress.subProgress(0.9, 1));
        } else {
          throw err;
        }
      }
      progress.setMessage('Completed');
      await new Promise((resolve) => setTimeout(resolve, 600));
    } finally {
      isSyncing.value = false;
      progress.setMessage('');
    }
  }

  return {
    isSyncing,
    sync,
    syncProgress,
    syncProgressMessage
  };
}
