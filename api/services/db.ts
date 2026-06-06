
import { initDatabase } from '../db/init.js';

let dbInstance: any = null;

export async function getDb() {
  if (!dbInstance) {
    dbInstance = await initDatabase();
  }
  return dbInstance;
}

export default getDb;
