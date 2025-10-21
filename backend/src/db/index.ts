import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';

// ניצור קובץ SQLite מקומי בתיקייה הראשית של הפרויקט
const sqlite = new Database('sqlite.db');

// ניצור את החיבור של Drizzle עם הסכמה ונייצא אותו
export const db = drizzle(sqlite, { schema });

