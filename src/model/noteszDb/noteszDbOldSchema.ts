import type { DBSchema } from 'idb';
import type { User } from '../userModel';
import type { Repository } from '../repositoryModel';
import type { FileIndex } from '../fileIndexModel';
import type { BlobRefCount } from '../blobModel';

export interface NoteszDbV1 extends DBSchema {
  repositories: {
    key: string,
    value: Repository
  },
  fileIndexes: {
    key: [string, string],
    value: FileIndex
  },
  blobs: {
    key: string,
    value: string
  },
  blobRefCounts: {
    key: string,
    value: BlobRefCount,
    indexes: {
      byRefCount: number
    }
  },
  app: {
    key: string,
    value: SettingsV1 | User
  }
}

interface SettingsV1 {
  readonly type: 'settings',
  selectedRepositoryId: string | null
}
