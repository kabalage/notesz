import type { InjectResult } from '@/utils/injector';
import { RepositoryModel } from '@/services/model/RepositoryModel';
import { BlobModel } from '@/services/model/BlobModel';
import { FileIndexModel } from '@/services/model/FileIndexModel';
import { NoteszDb } from '@/services/model/NoteszDb';
import { NoteszError } from '@/utils/NoteszError';

const dependencies = [RepositoryModel, BlobModel, FileIndexModel, NoteszDb];
useContinueRebase.dependencies = dependencies;

export function useContinueRebase({
  repositoryModel,
  blobModel,
  fileIndexModel,
  noteszDb
}: InjectResult<typeof dependencies>) {
  const { initTransaction } = noteszDb;

  /**
   * Sets rebase as **local** and **remote** as **base** if there are no conflicts.
   * Throws an error with code `'rebaseConflicts'` if there are conflicts.
   */
  return async function continueRebase(repositoryId: string) {
    await initTransaction(async (tx) => {
      const remoteIndex = await fileIndexModel.getFileIndex(repositoryId, 'remote', tx);
      if (!remoteIndex) {
        throw new Error('Remote fileIndex not found');
      }
      const rebaseIndex = await fileIndexModel.getFileIndex(repositoryId, 'rebase', tx);
      if (!rebaseIndex) {
        throw new Error('Rebase fileIndex not found');
      }
      const hasConflicts = fileIndexModel.getRootTreeNode(rebaseIndex).fileStats.conflicting > 0;
      if (hasConflicts) {
        throw new NoteszError('Conflicts occured during rebase', {
          code: 'rebaseConflicts'
        });
      }

      // Set rebase as local
      await fileIndexModel.deleteFileIndex(repositoryId, 'local', tx);
      const localIndex = {
        ...rebaseIndex,
        indexId: 'local' as const
      };
      await fileIndexModel.addFileIndex(localIndex, tx);

      // There's no need for the rebase index anymore
      await fileIndexModel.deleteFileIndex(repositoryId, 'rebase', tx);

      // Apply changes in remote
      await fileIndexModel.deleteFileIndex(repositoryId, 'remote', tx);
      fileIndexModel.applyFileChangesInIndex(remoteIndex);
      await fileIndexModel.addFileIndex(remoteIndex, tx);

      // Copy remote to base
      await fileIndexModel.deleteFileIndex(repositoryId, 'base', tx);
      const baseIndex = {
        ...remoteIndex,
        indexId: 'base' as const
      };
      await fileIndexModel.addFileIndex(baseIndex, tx);

      // Remove manual rebasing state from repository
      await repositoryModel.update(repositoryId, (repository) => {
        repository.manualRebaseInProgress = false;
        return repository;
      }, tx);

      // Blob garbage collection
      await blobModel.collectGarbage(tx);
    });
  };
}
