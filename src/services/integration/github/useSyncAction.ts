import { ref } from 'vue';
import { createProgress } from '@/utils/createProgress';
import { clamp } from '@/utils/clamp';
import { trial } from '@/utils/trial';
import { useRepositoryModel } from '@/services/model/repositoryModel';
import { useContinueRebase } from './sync/continueRebase';
import { useGetNewCommits } from './sync/getNewCommits';
import { useInitializeRepository } from './sync/initializeRepository';
import { useFetchCommit } from './sync/fetchCommit';
import { useRebase } from './sync/rebase';
import { usePush } from './sync/push';

export function useUseSyncAction() {
  const repositoryModel = useRepositoryModel();
  const continueRebase = useContinueRebase();
  const getNewCommits = useGetNewCommits();
  const initializeRepository = useInitializeRepository();
  const fetchCommit = useFetchCommit();
  const rebase = useRebase();
  const push = usePush();

  return function useSyncAction() {
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
        progress.set(0);
        isSyncing.value = true;
        const repository = await repositoryModel.get(repositoryId);
        if (!repository) {
          throw new Error(`Missing repository '${repositoryId}'`);
        }
        if (repository.manualRebaseInProgress) {
          progress.set(0.1);
          progress.setMessage('Rebasing');
          await continueRebase(repositoryId);
        }
        progress.set(0.2);
        progress.setMessage('Initializing repository...');
        await initializeRepository(repositoryId, progress.subProgress(0.2, 0.25));
        progress.set(0.25);
        progress.setMessage('Fetching new commits...');
        const commitsToFetch = await getNewCommits(repositoryId);
        progress.set(0.3);
        await progress.subTask(0.3, 0.9, async (progress) => {
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
              // Throws an error with code `'rebaseConflicts'` if there are conflicts.
              await continueRebase(repositoryId);
              progress.set(1);
            });
          }
        });
        progress.set(0.9);
        const [, pushError] = await trial(() => push(repositoryId, progress.subProgress(0.9, 1)));
        if (pushError?.code === 'pushRejected') {
          await sync(repositoryId, progress.subProgress(0.9, 1));
        } else if (pushError) {
          throw pushError;
        }
        progress.set(1);
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
  };
}
