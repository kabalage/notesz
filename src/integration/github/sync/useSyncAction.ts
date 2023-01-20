import { ref } from 'vue';
import repositoryModel from '@/model/repositoryModel';
import getNewCommits from './getNewCommits';
import fetchCommit from './fetchCommit';
import rebase from './rebase';
import continueRebase from './continueRebase';
import push from './push';

type SyncStatus = 'inactive' | 'fetching' | 'rebasing' | 'pushing';

export default function useSyncAction() {
  const isSyncing = ref(false);
  const syncStatus = ref<SyncStatus>('inactive');

  async function sync(repositoryId: string) {
    try {
      isSyncing.value = true;
      syncStatus.value = 'fetching';
      const repository = await repositoryModel.get(repositoryId);
      if (!repository) {
        throw new Error(`Missing repository '${repositoryId}'`);
      }
      if (repository.manualRebaseInProgress) {
        syncStatus.value = 'rebasing';
        await continueRebase(repositoryId);
      }
      const commitsToFetch = await getNewCommits(repositoryId);
      while (commitsToFetch.length > 0) {
        syncStatus.value = 'fetching';
        const nextCommit = commitsToFetch.shift()!;
        await fetchCommit(repositoryId, nextCommit);
        syncStatus.value = 'rebasing';
        await rebase(repositoryId);
        await continueRebase(repositoryId); // throws an error if there are conflicts
      }
      syncStatus.value = 'pushing';
      try {
        await push(repositoryId);
      } catch (err) {
        if (err instanceof Error && err.code === 'pushRejected') {
          await sync(repositoryId);
        } else {
          throw err;
        }
      }
    } finally {
      isSyncing.value = false;
      syncStatus.value = 'inactive';
    }
  }

  return {
    isSyncing,
    syncStatus,
    sync
  };
}
