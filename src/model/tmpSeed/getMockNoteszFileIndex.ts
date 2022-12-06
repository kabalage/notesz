export default function getMockNoteszFileIndex(repositoryId: string, indexId: string) {
  return {
    type: 'fileIndex' as const,
    repositoryId: repositoryId,
    indexId: indexId,
    index: {
      '': {
        type: 'tree' as const,
        path: '',
        pathInBase: '',
        deleted: false,
        changed: false,
        children: ['notebook-1', 'notebook-2', 'note-1.md', 'note-2.md', 'note-3.md',
          'note-4.md']
      },
      'notebook-1': {
        type: 'tree' as const,
        path: 'notebook-1',
        pathInBase: 'notebook-1',
        deleted: false,
        changed: false,
        children: ['notebook-1/note-5.md', 'notebook-1/note-6.md', 'notebook-1/note-7.md',
          'notebook-1/notebook-3']
      },
      'notebook-1/note-5.md': {
        type: 'file' as const,
        path: 'notebook-1/note-5.md',
        pathInBase: 'notebook-1/note-5.md',
        blobId: 'mockNote',
        blobIdInBase: 'mockNote',
        deleted: false,
        changed: false
      },
      'notebook-1/note-6.md': {
        type: 'file' as const,
        path: 'notebook-1/note-6.md',
        pathInBase: 'notebook-1/note-6.md',
        blobId: 'mockNote',
        blobIdInBase: 'mockNote',
        deleted: false,
        changed: false
      },
      'notebook-1/note-7.md': {
        type: 'file' as const,
        path: 'notebook-1/note-7.md',
        pathInBase: 'notebook-1/note-7.md',
        blobId: 'mockNote',
        blobIdInBase: 'mockNote',
        deleted: false,
        changed: false
      },
      'notebook-1/notebook-3': {
        type: 'tree' as const,
        path: 'notebook-1/notebook-3',
        pathInBase: 'notebook-1/notebook-3',
        deleted: false,
        changed: false,
        children: ['notebook-1/notebook-3/note-5.md']
      },
      'notebook-1/notebook-3/note-5.md': {
        type: 'file' as const,
        path: 'notebook-1/notebook-3/note-5.md',
        pathInBase: 'notebook-1/notebook-3/note-5.md',
        blobId: 'mockNote',
        blobIdInBase: 'mockNote',
        deleted: false,
        changed: false
      },
      'notebook-2': {
        type: 'tree' as const,
        path: 'notebook-2',
        pathInBase: 'notebook-2',
        deleted: false,
        changed: false,
        children: ['notebook-2/note-5.md', 'notebook-2/note-6.md', 'notebook-2/note-7.md']
      },
      'notebook-2/note-5.md': {
        type: 'file' as const,
        path: 'notebook-2/note-5.md',
        pathInBase: 'notebook-2/note-5.md',
        blobId: 'mockNote',
        blobIdInBase: 'mockNote',
        deleted: false,
        changed: false
      },
      'notebook-2/note-6.md': {
        type: 'file' as const,
        path: 'notebook-2/note-6.md',
        pathInBase: 'notebook-2/note-6.md',
        blobId: 'mockNote',
        blobIdInBase: 'mockNote',
        deleted: false,
        changed: false
      },
      'notebook-2/note-7.md': {
        type: 'file' as const,
        path: 'notebook-2/note-7.md',
        pathInBase: 'notebook-2/note-7.md',
        blobId: 'mockNote',
        blobIdInBase: 'mockNote',
        deleted: false,
        changed: false
      },
      'note-1.md': {
        type: 'file' as const,
        path: 'note-1.md',
        pathInBase: 'note-1.md',
        blobId: 'mockNote',
        blobIdInBase: 'mockNote',
        deleted: false,
        changed: false
      },
      'note-2.md': {
        type: 'file' as const,
        path: 'note-2.md',
        pathInBase: 'note-2.md',
        blobId: 'mockNote',
        blobIdInBase: 'mockNote',
        deleted: false,
        changed: false
      },
      'note-3.md': {
        type: 'file' as const,
        path: 'note-3.md',
        pathInBase: 'note-3.md',
        blobId: 'mockNote',
        blobIdInBase: 'mockNote',
        deleted: false,
        changed: false
      },
      'note-4.md': {
        type: 'file' as const,
        path: 'note-4.md',
        pathInBase: 'note-4.md',
        blobId: 'mockNote',
        blobIdInBase: 'mockNote',
        deleted: false,
        changed: false
      }
    }
  };
}
