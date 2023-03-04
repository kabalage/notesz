import { computed, ref, watch, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useOnline } from '@vueuse/core';
import { defineService } from '@/utils/defineService';
import { validatePath } from '@/utils/validatePath';
import { useFromDb } from '@/composables/useFromDb';
import { useNoteszMessageBus } from '@/services/noteszMessageBus';
import { useBlobModel } from '@/services/model/blobModel';
import { useFileIndexModel } from '@/services/model/fileIndexModel';
import { useRepositoryModel } from '@/services/model/repositoryModel';
import { useDialogService } from '@/services/dialogService';

export const [provideEditorService, useEditorService] = defineService('EditorService', () => {
  const router = useRouter();
  const dialogService = useDialogService();
  const messages = useNoteszMessageBus();
  const blobModel = useBlobModel();
  const fileIndexModel = useFileIndexModel();
  const repositoryModel = useRepositoryModel();

  const sidebarIsOpen = ref(true);
  const repositoryId = ref('');
  const currentFilePath = ref('');
  const repoIsDisconnected = ref(false);

  const repository = useFromDb({
    watch() {
      return repositoryId.value;
    },
    async get(repositoryId) {
      if (!repositoryId) return undefined;
      const repo = await repositoryModel.get(repositoryId);
      if (!repo) {
        repoIsDisconnected.value = true;
      }
      return repo;
    }
  });
  messages.on('change:repository', (id) => {
    if (id === repositoryId.value) {
      repository.refetch();
    }
  });
  watch(() => repoIsDisconnected.value, (isDisconnected) => {
    if (isDisconnected) {
      router.push('/settings');
    }
  });

  const currentFileIndexId = computed(() => {
    if (!repository.data) return undefined;
    return repository.data.manualRebaseInProgress ? 'rebase' : 'local';
  });

  const fileIndex = useFromDb({
    watch() {
      return currentFileIndexId.value;
    },
    get() {
      if (!currentFileIndexId.value) return undefined;
      return fileIndexModel.getFileIndex(repositoryId.value, currentFileIndexId.value);
    }
  });
  messages.on('change:fileIndex', (change) => {
    if (change.repositoryId === repositoryId.value && change.indexId === currentFileIndexId.value) {
      fileIndex.refetch();
    }
  });

  const currentFile = computed(() => {
    if (!fileIndex.data) return undefined;
    const node = fileIndex.data.index.get(currentFilePath.value);
    const pathPointsToFile = !!node && node.type === 'file';
    return pathPointsToFile ? node : undefined;
  });

  const currentFileName = computed(() => {
    if (!currentFile.value) return undefined;
    return currentFile.value.path.split('/').pop()!.split('.').slice(0, -1).join('.');
  });

  const currentTree = computed(() => {
    if (!fileIndex.data) return undefined;
    return fileIndexModel.getFirstExistingParentTree(
      fileIndex.data,
      currentFilePath.value
    );
  });

  const currentFileBlob = useFromDb({
    watch() {
      return currentFile.value?.blobId;
    },
    get(blobId) {
      if (!blobId) return undefined;
      return blobModel.get(blobId);
    },
    async put(data) {
      if (!currentFile.value || !currentFileIndexId.value || data === undefined) return;
      await fileIndexModel.updateFile(
        repositoryId.value,
        currentFileIndexId.value,
        currentFile.value.path,
        data
      );
    },
    putThrottling: 5000
  });
  messages.on('change:blob', (blobId) => {
    // message emitted by the ongoing put is ignored
    if (!currentFileBlob.isPutting && blobId === currentFile.value?.blobId) {
      currentFileBlob.refetch(blobId);
    }
  });

  const isOnline = useOnline();

  const syncDisabled = computed(() => {
    if (!isOnline.value || !fileIndex.data) return true;
    const rootTree = fileIndexModel.getRootTreeNode(fileIndex.data);
    return rootTree.fileStats.conflicting > 0
      || rootTree.fileStats.all === rootTree.fileStats.deleted;
    // Don't allow deleting all files, because GitHub throws an error
  });

  async function startSync() {
    await currentFileBlob.flushThrottledPut();
    router.push(`/sync/${repositoryId.value}?redirect=${router.currentRoute.value.fullPath}`);
  }

  async function openFile(filePath: string) {
    await currentFileBlob.flushThrottledPut();
    router.push(`/edit/${repositoryId.value}/${filePath}`);
  }

  async function closeFile() {
    if (!currentTree.value) return;
    await currentFileBlob.flushThrottledPut();
    sidebarIsOpen.value = true;
    router.push(`/edit/${repositoryId.value}/${currentTree.value.path}`);
  }

  async function addFile(path: string) {
    if (!currentFileIndexId.value) return;
    const placeholderPath = path ?
      `${path}/`
      : '';

    let newFilePath = await dialogService.prompt({
      title: 'New file',
      initialValue: placeholderPath,
      description: 'Any valid path is allowed.'
        + ' Folders along the path will be created automatically.'
        + ' The <em>.md</em> extension is added automatically if'
        + ' missing.',
      placeholder: 'path/to/file[.md]',
      confirmButtonLabel: 'Create',
      cancelButtonLabel: 'Cancel',
      validate(path: string) {
        path = path.trim();
        if (path && !path.endsWith('/') && !path.endsWith('.md')) {
          path += '.md'; // extension should be included in length validation
        }
        const validationError = validatePath(path);
        if (validationError) {
          return validationError;
        }
        if (fileIndex.data?.index.get(path)) {
          return 'A file or folder with this path already exists.';
        }
      }
    });
    if (!newFilePath) return;
    newFilePath = newFilePath.trim();
    if (!newFilePath.endsWith('.md')) {
      newFilePath += '.md';
    }
    await fileIndexModel.addFile(
      repositoryId.value,
      currentFileIndexId.value,
      newFilePath,
      ''
    );
    await fileIndex.refetch();
    await openFile(newFilePath);
  }

  async function deleteCurrentFile() {
    if (!currentFile.value || !currentFileIndexId.value) return;
    await currentFileBlob.flushThrottledPut();
    const confirmed = await dialogService.confirm({
      title: 'Delete file?',
      description: `Are you sure you want to delete <em class="break-words">${currentFile.value.path}</em>?`,
      confirmButtonLabel: 'Delete',
      rejectButtonLabel: 'Cancel'
    });
    if (!confirmed) return;
    const currentFilePath = currentFile.value.path;
    await closeFile();
    await fileIndexModel.deleteFile(
      repositoryId.value,
      currentFileIndexId.value,
      currentFilePath
    );
  }

  async function resolveConflict() {
    if (!currentFile.value || !currentFileIndexId.value) return;
    const currentFilePath = currentFile.value.path;
    await currentFileBlob.flushThrottledPut();
    await fileIndexModel.resolveConflict(
      repositoryId.value,
      currentFileIndexId.value,
      currentFilePath
    );
  }

  return reactive({
    sidebarIsOpen,
    repositoryId,
    currentFilePath,
    currentFileIndexId,
    fileIndex,
    currentFile,
    currentFileName,
    currentTree,
    currentFileBlob,
    syncDisabled,
    startSync,
    openFile,
    closeFile,
    addFile,
    deleteCurrentFile,
    resolveConflict
  });
});
