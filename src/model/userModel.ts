import openNoteszDb from './openNoteszDb';

export interface User {
  readonly type: 'user',
  email: string,
  token: string
}

async function get() {
  const db = await openNoteszDb();
  try {
    return (await db.get('app', 'user') as User | undefined);
  } finally {
    db.close();
  }
}

async function put(user: User) {
  const db = await openNoteszDb();
  try {
    return await db.put('app', user);
  } finally {
    db.close();
  }
}

export default {
  get,
  put
};
