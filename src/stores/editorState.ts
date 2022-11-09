import { useFromDb } from '@/composables/useFromDb';
import { blobs } from '@/model/blobs';
import { fileIndexes } from '@/model/fileIndexes';
import { createInjectionState } from '@/utils/createInjectionState';
import { computed, reactive, ref, type Ref } from 'vue';

const [provideEditorState, useEditorState] = createInjectionState((
  repositoryId: Ref<string>,
  currentFilePath: Ref<string>
) => {
  const sidebarIsOpen = ref(true);

  const fileIndex = useFromDb({
    get() {
      return fileIndexes.get(repositoryId.value, 'local');
    }
  });

  const currentFile = computed(() => {
    if (!fileIndex.data) return undefined;
    const node = fileIndex.data.index[`${currentFilePath.value}.md`];
    const pathPointsToFile = !!node && node.type === 'file';
    return pathPointsToFile ? node : undefined;
  });

  const currentFileParentTree = computed(() => {
    if (!fileIndex.data) return undefined;
    const rootTree = fileIndex.data.index[''];
    let tree = rootTree;
    try {
      tree = fileIndexes.getTreeForPath(fileIndex.data, currentFilePath.value);
    } catch (err: any) {
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
      return blobs.get(blobId);
    },
    async put(data) {
      if (!currentFile.value || data === undefined) return;
      const blobIdChanged = await fileIndexes.updateLocalFile(
        repositoryId.value,
        currentFile.value.path,
        data
      );
      if (blobIdChanged) {
        fileIndex.refetch();
      }
    },
    putThrottling: 5000
  });

  return reactive({
    sidebarIsOpen,
    repositoryId,
    currentFilePath,
    fileIndex,
    currentFile,
    currentFileParentTree,
    currentFileBlob
  });
});

export { provideEditorState, useEditorState };
