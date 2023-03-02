/* eslint-disable @typescript-eslint/no-empty-interface */
import type { DBSchema } from 'idb';
import type { Settings } from '../settingsModel';
import type { User } from '../userModel';
import type { Repository } from '../repositoryModel';
import type { FileIndex } from '../fileIndexModel';
import type { BlobRefCount } from '../blobModel';

export type NoteszDbVersions = {
  1: NoteszDbV1,
  2: NoteszDbV2,
  3: NoteszDbV3
};

export interface NoteszDbV1 extends DBSchema {
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

export interface NoteszDbV2 {
  repositories: NoteszDbV1['repositories'],
  fileIndexes: NoteszDbV1['fileIndexes'],
  blobs: NoteszDbV1['blobs'],
  blobRefCounts: NoteszDbV1['blobRefCounts'],
  app: {
    key: string,
    value: SettingsV2 | UserV1
  }
}

interface SettingsV2 extends Settings {}

export interface NoteszDbV3 {
  repositories: NoteszDbV1['repositories'],
  fileIndexes: NoteszDbV1['fileIndexes'],
  blobs: NoteszDbV1['blobs'],
  blobRefCounts: NoteszDbV1['blobRefCounts'],
  app: {
    key: string,
    value: SettingsV2 | UserV2
  }
}

interface UserV2 extends User {}
