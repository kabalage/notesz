import { request as octokitRequest } from '@octokit/request';
import { RequestError } from '@octokit/request-error';
import { NoteszError } from '@/utils/NoteszError';
import { trial } from '@/utils/trial';
import type { Progress } from '@/utils/createProgress';
import type { InjectResult } from '@/utils/injector';
import { NoteszDb } from '@/services/model/NoteszDb';
import { UserModel } from '@/services/model/UserModel';
import { FileIndexModel } from '@/services/model/FileIndexModel';
import { BlobModel } from '@/services/model/BlobModel';

const dependencies = [NoteszDb, UserModel, FileIndexModel, BlobModel];
useInitializeRepository.dependencies = dependencies;

export function useInitializeRepository({
  noteszDb,
  userModel,
  fileIndexModel,
  blobModel
}: InjectResult<typeof dependencies>) {
  const { initTransaction } = noteszDb;

  /**
   * The GitHub API does not allow git database operations unless the repository is initialized.
   * This function uses the repository contents API to create a commit a with a dummy file that's
   * going to be deleted in the first real commit.
   */
  return async function initializeRepository(repositoryId: string, progress: Progress) {
    const user = await userModel.get();
    if (!user) {
      throw new NoteszError('Unauthorized user', {
        code: 'unauthorized'
      });
    }

    const baseIndex = await fileIndexModel.getFileIndex(repositoryId, 'base');
    if (!baseIndex) {
      throw new Error(`Missing fileIndex: "${repositoryId}/base"`);
    }
    if (baseIndex.commitSha) {
      // already initialized
      return;
    }

    progress.setMessage('Initializing repository');

    const localIndex = await fileIndexModel.getFileIndex(repositoryId, 'local');
    if (!localIndex) {
      throw new Error(`Missing fileIndex: "${repositoryId}/local"`);
    }
    const authHeader = `Bearer ${user.token}`;
    const commonRequestParams = {
      headers: {
        authorization: authHeader
      },
      owner: repositoryId.split('/')[0],
      repo: repositoryId.split('/')[1]
    };

    const [commitsResult, commitsError] = await trial(() => {
      return octokitRequest('GET /repos/{owner}/{repo}/commits', {
        ...commonRequestParams,
        per_page: 1
      });
    });
    if (commitsError && commitsError instanceof RequestError && commitsError.status === 409
        && commitsError.message === 'Git Repository is empty.'
    ) {
      // repository is empty, continue
    } else if (commitsError) {
      throw new NoteszError('Failed to fetch the list of commits from GitHub', {
        cause: commitsError
      });
    } else if (commitsResult.data.length > 0) {
      // repository is not empty, skip
      return;
    }

    // Create a dummy file to initialize the repository
    const [createFileResult, createFileError] = await trial(() => {
      return octokitRequest('PUT /repos/{owner}/{repo}/contents/{path}', {
        ...commonRequestParams,
        path: '.notesz-init',
        message: '[Notesz] Initial commit',
        content: ''
      });
    });
    if (createFileError) {
      throw new NoteszError('Could not create initial commit on GitHub', {
        cause: createFileError
      });
    }
    if (!createFileResult.data.commit.tree || !createFileResult.data.commit.committer) {
      throw new Error('Could not create initial commit on GitHub');
    }
    return initTransaction(async (tx) => {
      // put empty blob in the database
      const blobHash = 'e69de29bb2d1d6434b8b29ae775ad8c2e48c5391'; // sha for an empty file
      if (!await blobModel.exists(blobHash, tx)) {
        await blobModel.put(blobHash, '', tx);
      }

      // add .notesz-init file to the base index
      const initFile = fileIndexModel.createFile({
        path: '.notesz-init',
        pathInBase: '.notesz-init',
        blobId: blobHash,
        blobHash,
        blobIdInBase: blobHash,
      });
      await fileIndexModel.deleteFileIndex(repositoryId, 'base', tx);
      baseIndex.commitSha = createFileResult.data.commit.sha;
      baseIndex.rootTreeSha = createFileResult.data.commit.tree!.sha;
      baseIndex.commitTime = createFileResult.data.commit.committer!.date;
      fileIndexModel.putFileInIndex(baseIndex, initFile);
      await fileIndexModel.addFileIndex(baseIndex, tx);

      // add .notesz-init file to the local index deleted
      const deletedInitFile = fileIndexModel.createFile({
        ...initFile,
        deleted: true
      });
      await fileIndexModel.deleteFileIndex(repositoryId, 'local', tx);
      fileIndexModel.putFileInIndex(localIndex, deletedInitFile);
      await fileIndexModel.addFileIndex(localIndex, tx);

      // copy base to remote
      const remoteIndex = fileIndexModel.createFileIndex({
        ...baseIndex,
        indexId: 'remote'
      });
      await fileIndexModel.deleteFileIndex(repositoryId, 'remote', tx);
      await fileIndexModel.addFileIndex(remoteIndex, tx);
    });
  };
}
