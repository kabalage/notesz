import useFromDb from '@/composables/useFromDb';
import useSyncAction from '@/integration/github/sync/useSyncAction';
import blobModel from '@/model/blobModel';
import fileIndexModel from '@/model/fileIndexModel';
import repositoryModel from '@/model/repositoryModel';
import { createInjectionState } from '@/utils/createInjectionState';
import { useOnline } from '@vueuse/core';
import { computed, reactive, ref, type Ref } from 'vue';
import { useRouter } from 'vue-router';

const [provideEditorState, useEditorState] = createInjectionState((
  repositoryId: Ref<string>,
  currentFilePath: Ref<string>
) => {
  const router = useRouter();
  const sidebarIsOpen = ref(true);

  const repository = useFromDb({
    get() {
      return repositoryModel.get(repositoryId.value);
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
    const rootTree = fileIndexModel.getRootTreeNode(fileIndex.data);
    let tree = rootTree;
    try {
      tree = fileIndexModel.getFirstExistingParentTree(
        fileIndex.data,
        currentFilePath.value
      );
    } catch (err) {
      console.error(err);
    }
    return tree;
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
      const blobIdChanged = await fileIndexModel.updateFile(
        repositoryId.value,
        currentFileIndexId.value,
        currentFile.value.path,
        data
      );
      if (blobIdChanged) {
        fileIndex.refetch();
      }
    },
    putThrottling: 5000
  });

  const isOnline = useOnline();

  const syncDisabled = computed(() => {
    if (!isOnline.value || !fileIndex.data) return true;
    const rootTree = fileIndexModel.getRootTreeNode(fileIndex.data);
    return rootTree.fileStats.conflicting > 0;
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
    let newFilePath = prompt(`Add file ${repositoryId.value}`, placeholderPath);
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
    const confirmed = confirm(`Delete file ${currentFile.value.path}?`);
    if (!confirmed) return;
    const currentFilePath = currentFile.value.path;
    await closeFile();
    await fileIndexModel.deleteFile(
      repositoryId.value,
      currentFileIndexId.value,
      currentFilePath
    );
    await fileIndex.refetch();
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
    await fileIndex.refetch();
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
