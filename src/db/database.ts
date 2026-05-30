import initSqlJs, { Database } from 'sql.js';
import path from 'path';
import fs from 'fs';
import { runMigrations } from './schema';

const DB_PATH = path.join(__dirname, '../../data/jobpack.db');

let db: Database;

export async function getDb(): Promise<Database> {
  if (db) return db;

  const SQL = await initSqlJs();

  // Load existing DB from disk or create new one
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  runMigrations(db);
  persistDb(); // save initial state
  return db;
}

// Persist the in-memory DB back to disk after every write
export function persistDb(): void {
  if (!db) return;
  const data = db.export();
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}
