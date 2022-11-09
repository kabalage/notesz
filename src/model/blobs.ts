import { openNoteszDb } from './db';

async function get(id: string) {
  const db = await openNoteszDb();
  try {
    return await db.get('blobs', id);
  } finally {
    db.close();
  }
}

async function put(id: string, value: string) {
  const db = await openNoteszDb();
  try {
    return await db.put('blobs', value, id);
  } finally {
    db.close();
  }
}

export const blobs = {
  get,
  put
};
