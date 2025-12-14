import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';

// ============================================
// Database Client Setup
// ============================================

// Create or connect to the SQLite database
const sqlite = new Database('worldrecipe.db');

// Enable WAL mode for better performance
sqlite.pragma('journal_mode = WAL');

// Create the Drizzle client
export const db = drizzle(sqlite, { schema });

// Export schema for use in queries
export { schema };

// Helper function to close the database connection
export function closeDatabase() {
  sqlite.close();
}

// Helper to check if database is connected
export function isDatabaseConnected(): boolean {
  try {
    sqlite.pragma('table_info(worlds)');
    return true;
  } catch {
    return false;
  }
}

