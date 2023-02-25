import type { DBSchema } from 'idb';
import type { Settings } from '../settingsModel';
import type { User } from '../userModel';
import type { Repository } from '../repositoryModel';
import type { FileIndex } from '../fileIndexModel';
import type { BlobRefCount } from '../blobModel';

export interface NoteszDb extends DBSchema {
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
    value: Settings | User
  }
}
