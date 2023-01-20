import repositoryModel from '@/model/repositoryModel';
import blobModel from '@/model/blobModel';
import fileIndexModel from '@/model/fileIndexModel';
import { initTransaction } from '@/model/noteszDb';
import NoteszError from '@/utils/NoteszError';

/**
 * Sets rebase as **local** and **remote** as **base** if there are no conflicts.
 * Throws an error with code `'rebaseConflicts'` if there are conflicts.
 */
export default async function continueRebase(repositoryId: string) {
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
}
