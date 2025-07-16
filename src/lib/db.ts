
import { drizzle, NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

let db: NeonHttpDatabase<typeof schema> | null = null;
let sql: ReturnType<typeof neon> | null = null;

// NOTE: Hardcoding the connection string is not recommended for production.
// This is a workaround for a persistent issue with environment variable loading in this specific development environment.
// The password has been URI-encoded to handle special characters.
const connectionString = "postgresql://postgres:z3w7v%25Twu%26%28%29@db.ukevxalsfdtrfksdksux.supabase.co:5432/postgres";

function getDb() {
  if (!db) {
    if (!connectionString) {
      throw new Error('POSTGRES_URL is not set');
    }
    if (!sql) {
      sql = neon(connectionString);
    }
    db = drizzle(sql, { schema });
  }
  return db;
}

export { getDb };
