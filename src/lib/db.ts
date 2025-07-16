
import { drizzle, NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

let db: NeonHttpDatabase<typeof schema> | null = null;
let sql: ReturnType<typeof neon> | null = null;

function getDb() {
  if (!db) {
    if (!process.env.POSTGRES_URL) {
      throw new Error('POSTGRES_URL is not set');
    }
    if (!sql) {
      sql = neon(process.env.POSTGRES_URL);
    }
    db = drizzle(sql, { schema });
  }
  return db;
}

export { getDb };
