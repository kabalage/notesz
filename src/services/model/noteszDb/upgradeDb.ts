import type { IDBPDatabase, IDBPTransaction, StoreNames } from 'idb';
import type { NoteszDb } from './noteszDbSchema';
import type { NoteszDbVersions } from './noteszDbOldSchema';
import { createSettings } from '../settingsModel';
import { createUser } from '../userModel';

type VersionChangeTransaction<T> = IDBPTransaction<T, ArrayLike<StoreNames<T>>, 'versionchange'>;

export async function upgradeDb(
  db: IDBPDatabase<NoteszDb>,
  oldVersion: number,
  tx: VersionChangeTransaction<NoteszDb>
) {
  if (oldVersion === 1) {
    const txV1 = tx as unknown as VersionChangeTransaction<NoteszDbVersions[1]>;
    const appStoreV1 = txV1.objectStore('app');
    const appStore = tx.objectStore('app');
    const settingsV1 = await appStoreV1.get('settings');
    if (settingsV1?.type === 'settings') {
      await appStore.put(createSettings({
        ...settingsV1,
        selectedTheme: 5
      }));
    }
  }
  if (oldVersion <= 2) {
    const txV2 = tx as unknown as VersionChangeTransaction<NoteszDbVersions[2]>;
    const appStoreV2 = txV2.objectStore('app');
    const appStore = tx.objectStore('app');
    const userV1 = await appStoreV2.get('user');
    if (userV1?.type === 'user') {
      await appStore.put(createUser({
        token: userV1.token // omit email
      }));
    }
  }
}
