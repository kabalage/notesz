/* eslint-disable @typescript-eslint/no-empty-interface */
import type { DBSchema } from 'idb';
import type { Settings } from '../SettingsModel';
import type { User } from '../UserModel';
import type { Repository } from '../RepositoryModel';
import type { FileIndex } from '../FileIndexModel';
import type { BlobRefCount } from '../BlobModel';

export type NoteszDbSchemaVersions = {
  1: NoteszDbSchemaV1,
  2: NoteszDbSchemaV2,
  3: NoteszDbSchemaV3,
  4: NoteszDbSchemaV4
};

export interface NoteszDbSchemaV1 extends DBSchema {
  repositories: {
    key: string,
    value: RepositoryV1
  },
  fileIndexes: {
    key: [string, string],
    value: FileIndexV1
  },
  blobs: {
    key: string,
    value: string
  },
  blobRefCounts: {
    key: string,
    value: BlobRefCountV1,
    indexes: {
      byRefCount: number
    }
  },
  app: {
    key: string,
    value: SettingsV1 | UserV1
  }
}

interface RepositoryV1 extends Repository {}
interface FileIndexV1 extends FileIndex {}
interface BlobRefCountV1 extends BlobRefCount {}

interface UserV1 {
  readonly type: 'user',
  email: string,
  token: string
}

interface SettingsV1 {
  readonly type: 'settings',
  selectedRepositoryId: string | null
}

export interface NoteszDbSchemaV2 extends DBSchema {
  repositories: NoteszDbSchemaV1['repositories'],
  fileIndexes: NoteszDbSchemaV1['fileIndexes'],
  blobs: NoteszDbSchemaV1['blobs'],
  blobRefCounts: NoteszDbSchemaV1['blobRefCounts'],
  app: {
    key: string,
    value: SettingsV2 | UserV1
  }
}

interface SettingsV2 {
  readonly type: 'settings',
  selectedRepositoryId: string | null,
  selectedTheme: number
}

export interface NoteszDbSchemaV3 extends DBSchema {
  repositories: NoteszDbSchemaV1['repositories'],
  fileIndexes: NoteszDbSchemaV1['fileIndexes'],
  blobs: NoteszDbSchemaV1['blobs'],
  blobRefCounts: NoteszDbSchemaV1['blobRefCounts'],
  app: {
    key: string,
    value: SettingsV2 | UserV2
  }
}

interface UserV2 extends User {}

export interface NoteszDbSchemaV4 extends DBSchema {
  repositories: NoteszDbSchemaV1['repositories'],
  fileIndexes: NoteszDbSchemaV1['fileIndexes'],
  blobs: NoteszDbSchemaV1['blobs'],
  blobRefCounts: NoteszDbSchemaV1['blobRefCounts'],
  app: {
    key: string,
    value: SettingsV3 | UserV2
  }
}

interface SettingsV3 extends Settings {}
