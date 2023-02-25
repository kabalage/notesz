import type { IDBPDatabase, IDBPTransaction, StoreNames } from 'idb';
import type { NoteszDb } from './noteszDbSchema';
import type { NoteszDbV1 } from './noteszDbOldSchema';
import { createSettings } from '../settingsModel';

type VersionChangeTransaction<T> = IDBPTransaction<T, ArrayLike<StoreNames<T>>, 'versionchange'>;

export async function upgradeDb(
  db: IDBPDatabase<NoteszDb>,
  oldVersion: number,
  tx: VersionChangeTransaction<NoteszDb>
) {
  if (oldVersion === 1) {
    const txV1 = tx as unknown as VersionChangeTransaction<NoteszDbV1>;
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
}
