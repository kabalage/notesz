import type { IDBPDatabase, IDBPTransaction, StoreNames } from 'idb';
import type { NoteszDbSchema } from './noteszDbSchema';
import type { NoteszDbSchemaVersions } from './noteszDbOldSchema';
import { createSettings } from '../SettingsModel';
import { createUser } from '../UserModel';

type VersionChangeTransaction<T> = IDBPTransaction<T, ArrayLike<StoreNames<T>>, 'versionchange'>;

export async function upgradeDb(
  db: IDBPDatabase<NoteszDbSchema>,
  oldVersion: number,
  tx: VersionChangeTransaction<NoteszDbSchema>
) {
  if (oldVersion === 1) {
    const txV1 = tx as unknown as VersionChangeTransaction<NoteszDbSchemaVersions[1]>;
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
    const txV2 = tx as unknown as VersionChangeTransaction<NoteszDbSchemaVersions[2]>;
    const appStoreV2 = txV2.objectStore('app');
    const appStore = tx.objectStore('app');
    const userV1 = await appStoreV2.get('user');
    if (userV1?.type === 'user') {
      await appStore.put(createUser({
        token: userV1.token // omit email
      }));
    }
  }
  if (oldVersion <= 3) {
    const txV3 = tx as unknown as VersionChangeTransaction<NoteszDbSchemaVersions[3]>;
    const appStoreV3 = txV3.objectStore('app');
    const appStore = tx.objectStore('app');
    const settingsV2 = await appStoreV3.get('settings');
    if (settingsV2?.type === 'settings') {
      await appStore.put(createSettings({
        ...settingsV2
      }));
    }
  }
}
