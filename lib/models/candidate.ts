import db from '../db';

// Candidate table model and helpers
export function initCandidateTable() {
  db.prepare(`CREATE TABLE IF NOT EXISTS candidate_table (
    candidate_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    name TEXT,
    age INTEGER,
    cv_path TEXT,
    linkedin TEXT,
    github TEXT,
    experience_years INTEGER,
    education TEXT,
    personal_projects TEXT,
    introduction TEXT,
    cv_experience TEXT
  )`).run();
}

export function getCandidateByUserId(userId: number) {
  initCandidateTable();
  return db.prepare('SELECT * FROM candidate_table WHERE user_id = ?').get(userId);
}

export function createCandidateProfile(userId: number) {
  initCandidateTable();
  // Only create if not exists
  const exists = getCandidateByUserId(userId);
  if (exists) return exists;
  db.prepare(`INSERT INTO candidate_table (user_id) VALUES (?)`).run(userId);
  return getCandidateByUserId(userId);
}
