import useFromDb from '@/composables/useFromDb';
import useNoteszMessageBus from '@/composables/useNoteszMessageBus';
import blobModel from '@/model/blobModel';
import fileIndexModel from '@/model/fileIndexModel';
import repositoryModel from '@/model/repositoryModel';
import { createInjectionState } from '@/utils/createInjectionState';
import { useOnline } from '@vueuse/core';
import { computed, reactive, ref, watch, type Ref } from 'vue';
import { useRouter } from 'vue-router';

const [provideEditorState, useEditorState] = createInjectionState((
  repositoryId: Ref<string>,
  currentFilePath: Ref<string>
) => {
  const router = useRouter();
  const sidebarIsOpen = ref(true);

  const messages = useNoteszMessageBus();

  const repository = useFromDb({
    get() {
      return repositoryModel.get(repositoryId.value);
    }
  });
  messages.on('change:repository', (id) => {
    if (id === repositoryId.value) {
      repository.refetch();
    }
  });
  watch(() => !repository.data && repository.isInitialized, (isDisconnected) => {
    if (isDisconnected) {
      router.push('/settings');
    }
  });

  const currentFileIndexId = computed(() => {
    if (!repository.data) return undefined;
    return repository.data.manualRebaseInProgress ? 'rebase' : 'local';
  });

  const fileIndex = useFromDb({
    watchParams() {
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
    watchParams() {
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
      `${path}/untitled`
      : 'untitled';
    // TODO show prompt on UI
    let newFilePath = prompt('Add file (folders along the path will be created):', placeholderPath);
    if (!newFilePath) return;
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
    // TODO show confirm on UI
    const confirmed = confirm(`Are you sure you want to delete "${currentFile.value.path}"?`);
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

export { provideEditorState, useEditorState };
