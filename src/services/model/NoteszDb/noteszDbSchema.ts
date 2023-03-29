import type { DBSchema } from 'idb';
import type { Settings } from '../SettingsModel';
import type { User } from '../UserModel';
import type { Repository } from '../RepositoryModel';
import type { FileIndex } from '../FileIndexModel';
import type { BlobRefCount } from '../BlobModel';

export interface NoteszDbSchema extends DBSchema {
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
