import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';

// Connect to SQLite database and initialize DrizzleORM with the schema.
const sqlite = new Database('sqlite.db');

// Initialize DrizzleORM with the schema.
export const db = drizzle(sqlite, { schema });

