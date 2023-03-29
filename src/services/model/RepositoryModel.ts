import { defineService, type InjectResult } from '@/utils/injector';
import { NoteszDb, type NoteszDbTransaction } from '@/services/model/NoteszDb';
import { NoteszMessageBus } from '@/services/NoteszMessageBus';
import { BlobModel } from './BlobModel';
import { FileIndexModel } from './FileIndexModel';

export interface Repository {
  readonly id: string,
  readonly type: 'repository',
  manualRebaseInProgress: boolean
}

export function createRepository(
  initialValues: Pick<Repository, 'id'> & Partial<Repository>
): Repository {
  return {
    type: 'repository',
    manualRebaseInProgress: false,
    ...initialValues
  };
}

const dependencies = [NoteszDb, NoteszMessageBus, BlobModel, FileIndexModel];

export const RepositoryModel = defineService({
  name: 'RepositoryModel',
  dependencies,
  setup
});

function setup({
  noteszDb,
  noteszMessageBus,
  blobModel,
  fileIndexModel
}: InjectResult<typeof dependencies>) {
  const { initTransaction } = noteszDb;

  async function add(repository: Repository, transaction?: NoteszDbTransaction) {
    return initTransaction(transaction, async (tx) => {
      const repositoriesStore = tx.objectStore('repositories');
      await repositoriesStore.add(repository);
      await fileIndexModel.addFileIndex(fileIndexModel.createFileIndex({
        repositoryId: repository.id,
        indexId: 'remote'
      }), tx);
      await fileIndexModel.addFileIndex(fileIndexModel.createFileIndex({
        repositoryId: repository.id,
        indexId: 'base'
      }), tx);
      await fileIndexModel.addFileIndex(fileIndexModel.createFileIndex({
        repositoryId: repository.id,
        indexId: 'local'
      }), tx);
      noteszMessageBus.emit('change:repository', repository.id);
    });
  }

  async function deleteRepo(id: string, transaction?: NoteszDbTransaction) {
    return initTransaction(transaction, async (tx) => {
      const repositoriesStore = tx.objectStore('repositories');
      await repositoriesStore.delete(id);
      await fileIndexModel.deleteFileIndex(id, 'remote');
      await fileIndexModel.deleteFileIndex(id, 'base');
      await fileIndexModel.deleteFileIndex(id, 'local');
      await fileIndexModel.deleteFileIndex(id, 'rebase');
      await blobModel.collectGarbage();
      noteszMessageBus.emit('change:repository', id);
    });
  }

  async function get(repositoryId: string, transaction?: NoteszDbTransaction) {
    return initTransaction(transaction, async (tx) => {
      const repositoriesStore = tx.objectStore('repositories');
      return repositoriesStore.get(repositoryId);
    });
  }

  async function list(transaction?: NoteszDbTransaction) {
    return initTransaction(transaction, async (tx) => {
      const repositoriesStore = tx.objectStore('repositories');
      return repositoriesStore.getAll();
    });
  }

  async function update(
    repositoryId: string,
    updater: (settings: Repository) => Repository | undefined,
    transaction?: NoteszDbTransaction
  ) {
    return initTransaction(transaction, async (tx) => {
      const repositoriesStore = tx.objectStore('repositories');
      const repository = await repositoriesStore.get(repositoryId);
      if (!repository) {
        throw new Error(`Repository ${repositoryId} not found`);
      }
      const newRepository = updater(repository);
      if (newRepository) {
        await repositoriesStore.put(newRepository);
        noteszMessageBus.emit('change:repository', newRepository.id);
      }
    });
  }

  return {
    createRepository,
    add,
    delete: deleteRepo,
    get,
    list,
    update
  };
}
