import { computed, reactive, ref, watch } from 'vue';
import { createInjectionState } from '@/utils/createInjectionState';
import type { provideEditorState } from '@/stores/editorState';
import { default as fileIndexModel, type Tree, type File } from '@/model/fileIndexModel';

const [provideExplorerState, useExplorerState] = createInjectionState((
  editorState: ReturnType<typeof provideEditorState>
) => {
  const path = ref('');

  const items = computed(() => {
    if (!editorState.fileIndex.data) return [];

    const rootTree = fileIndexModel.getRootTreeNode(editorState.fileIndex.data);
    let explorerTree = rootTree;
    try {
      explorerTree = fileIndexModel.getFirstExistingParentTree(
        editorState.fileIndex.data,
        path.value
      );
    } catch (err: any) {
      console.error(err);
    }
    const items = [...explorerTree.children].map((childPath) => {
      return editorState.fileIndex.data!.index.get(childPath);
    }).filter((childNode): childNode is File | Tree => {
      return !!childNode && (childNode.type === 'tree' && childNode.status !== 'deleted'
        || childNode.type === 'file' && !childNode.ignored && !childNode.deleted);
    }).map((childNode) => {
      const childName = childNode.path.split('/').at(-1)!.replace(/\.md$/, '');
      return {
        type: childNode.type,
        path: childNode.path,
        name: childName,
        added: childNode.type === 'file'
          ? childNode.added
          : childNode.status === 'added',
        modified: childNode.type === 'file'
          ? childNode.modified || childNode.renamed
          : childNode.status === 'modified',
        unchanged: childNode.type === 'file'
          ? !childNode.added && !childNode.modified && !childNode.renamed
          : childNode.status === 'unchanged',
      };
    }).sort((a, b) => {
      if (a.type === b.type) {
        return a.name > b.name ? 1 : -1;
      }
      if (a.type === 'tree' && b.type === 'file') {
        return -1;
      } else {
        return 1;
      }
    });
    if (explorerTree.path !== '') {
      return [
        {
          type: 'parentTree' as const,
          path: explorerTree.path.split('/').slice(0, -1).join('/'),
          name: '..'
        },
        ...items
      ];
    }
    return items;
  });

  // Set explorer path to the current file's parent tree when the path in the url changes
  watch(() => editorState.currentTree, (currentTree, prevParentTree) => {
    if (!currentTree || currentTree.path === prevParentTree?.path) return;
    path.value = currentTree.path;
  }, {
    immediate: true
  });

  return reactive({
    path,
    items
  });
});

export { provideExplorerState, useExplorerState };
