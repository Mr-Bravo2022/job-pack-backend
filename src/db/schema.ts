import { Database } from 'sql.js';

export function runMigrations(db: Database): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS drafts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      job_description TEXT NOT NULL,
      candidate_profile TEXT NOT NULL,
      resume_html TEXT,
      cover_letter_html TEXT,
      infographic_svg TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);
}
