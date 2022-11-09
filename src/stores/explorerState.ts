import { computed, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { createInjectionState } from '@/utils/createInjectionState';
import type { provideEditorState } from '@/stores/editorState';
import { fileIndexes, type Tree, type File } from '@/model/fileIndexes';

const [provideExplorerState, useExplorerState] = createInjectionState((
  editorState: ReturnType<typeof provideEditorState>
) => {

  const router = useRouter();
  const path = ref('');

  const items = computed(() => {
    if (!editorState.fileIndex.data) return [];
    const rootTree = editorState.fileIndex.data.index[''];
    let explorerTree = rootTree;
    try {
      explorerTree = fileIndexes.getTreeForPath(editorState.fileIndex.data, path.value);
    } catch (err: any) {
      console.error(err);
    }
    const items = explorerTree.children.map((childPath) => {
      return editorState.fileIndex.data!.index[childPath];
    }).filter((childNode): childNode is File | Tree => {
      return !!childNode && (childNode.type === 'tree'
        || childNode.type === 'file' && !!childNode.path.match(/\.md$/));
    }).map((childNode) => {
      if (childNode.type === 'tree') {
        return {
          type: 'notebook',
          path: childNode.path,
          name: childNode.path.split('/').at(-1)!
        };
      } else {
        const pathWithoutExtension = childNode.path.slice(0, -3);
        return {
          type: 'note',
          path: pathWithoutExtension, // slice .md extension
          name: pathWithoutExtension.split('/').at(-1)!
        };
      }
    }).sort((a, b) => {
      if (a.type === b.type) {
        return a.name > b.name ? 1 : -1;
      }
      if (a.type === 'notebook' && b.type === 'note') {
        return -1;
      } else {
        return 1;
      }
    });
    if (explorerTree.path !== '') {
      return [
        {
          type: 'parentNotebook',
          path: explorerTree.path.split('/').slice(0, -1).join('/'),
          name: '..'
        },
        ...items
      ];
    }
    return items;
  });

  // Set explorer path to the current file's parent tree when the path in the url changes
  watch(() => editorState.currentFileParentTree, (currentFileParentTree) => {
    if (!currentFileParentTree) return;
    path.value = currentFileParentTree.path;
  }, {
    immediate: true
  });

  async function openNote(explorerItemPath: string) {
    await editorState.currentFileBlob.flushThrottledPut();
    router.push(`/edit/${editorState.repositoryId}/${explorerItemPath}`);
  }

  return reactive({
    path,
    items,
    openNote
  });
});

export { provideExplorerState, useExplorerState };
