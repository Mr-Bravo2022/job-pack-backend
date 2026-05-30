import Database from 'better-sqlite3';
import path from 'path';
import { runMigrations } from './schema';

const DB_PATH = path.join(__dirname, '../../data/jobpack.db');

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    runMigrations(db);
  }
  return db;
}
