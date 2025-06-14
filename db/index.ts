import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql } from 'drizzle-orm';
import * as schema from '../shared/schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

// Create a connection pool with retry logic
const createPool = () => {
  const neonSql = neon(process.env.DATABASE_URL!);
  return drizzle(neonSql, { schema });
};

// Initialize the database connection
let db = createPool();

// Function to check database connection
export const checkDatabaseConnection = async () => {
  try {
    await db.execute(sql`SELECT 1`);
    return true;
  } catch (error) {
    console.error('Database connection error:', error);
    // Attempt to reconnect
    try {
      db = createPool();
      await db.execute(sql`SELECT 1`);
      return true;
    } catch (retryError) {
      console.error('Database reconnection failed:', retryError);
      return false;
    }
  }
};

export { db };