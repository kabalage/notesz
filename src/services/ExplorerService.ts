import { computed, ref, watch, reactive } from 'vue';
import { defineService, type InjectResult } from '@/utils/injector';
import { EditorService } from '@/services/EditorService';
import { FileIndexModel, type File, type Tree } from '@/services/model/FileIndexModel';

const dependencies = [EditorService, FileIndexModel];

export const ExplorerService = defineService({
  name: 'ExplorerService',
  dependencies,
  setup
});

function setup({ editorService, fileIndexModel }: InjectResult<typeof dependencies>) {
  const path = ref('');
  const browseAllDuringManualRebase = ref(false);
  const stringCompare = new Intl.Collator('en').compare;

  const loading = computed(() => {
    return !editorService.fileIndex.data;
  });

  const explorerTree = computed(() => {
    if (!editorService.fileIndex.data) return null;

    return fileIndexModel.getFirstExistingParentTree(
      editorService.fileIndex.data,
      path.value
    );
  });

  const parentTreePath = computed(() => {
    if (!editorService.fileIndex.data) return '';
    return fileIndexModel.getParentNodePath(explorerTree.value!.path);
  });

  const items = computed(() => {
    if (!editorService.fileIndex.data || !explorerTree.value) {
      return [];
    }

    const items = [...explorerTree.value.children].map((childPath) => {
      return editorService.fileIndex.data!.index.get(childPath);
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
        return stringCompare(a.name, b.name);
      }
      if (a.type === 'tree' && b.type === 'file') {
        return -1;
      } else {
        return 1;
      }
    });
    if (explorerTree.value.path !== '') {
      return [
        {
          type: 'parentTree' as const,
          path: parentTreePath.value,
          name: '..'
        },
        ...items
      ];
    }
    return items;
  });

  const conflictingFiles = computed(() => {
    if (!editorService.fileIndex.data) return [];
    const hasConflicts = fileIndexModel.getRootTreeNode(editorService.fileIndex.data)
      .fileStats.conflicting > 0;
    if (!hasConflicts) return [];
    return [...editorService.fileIndex.data.index.values()].filter((node): node is File => {
      return node.type === 'file' && node.conflicting;
    }).sort((a, b) => {
      return a.path > b.path ? 1 : -1;
    }).map((file) => {
      return {
        path: file.path,
        name: file.path.split('/').at(-1)!.replace(/\.md$/, ''),
        parentPath: file.path.split('/').slice(0, -1).join('/')
      };
    });
  });

  // Set explorer path to the current file's parent tree when the path in the url changes
  watch(() => editorService.currentTree, (currentTree, prevParentTree) => {
    if (!currentTree || currentTree.path === prevParentTree?.path) return;
    path.value = currentTree.path;
  }, {
    immediate: true
  });

  function navigateBack() {
    path.value = parentTreePath.value;
  }

  function toggleBrowseAllDuringManualRebase() {
    browseAllDuringManualRebase.value = !browseAllDuringManualRebase.value;
    if (browseAllDuringManualRebase.value) {
      path.value = '';
    }
  }

  return reactive({
    path,
    explorerTree,
    browseAllDuringManualRebase,
    loading,
    items,
    conflictingFiles,
    navigateBack,
    toggleBrowseAllDuringManualRebase
  });
}
