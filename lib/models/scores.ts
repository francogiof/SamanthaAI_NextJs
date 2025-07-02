import db from '../db';

// Scores table model and helpers
export function initScoresTable() {
  db.prepare(`CREATE TABLE IF NOT EXISTS scores_table (
    score_id INTEGER PRIMARY KEY AUTOINCREMENT,
    candidate_id INTEGER NOT NULL,
    initial_screening_score INTEGER,
    technical_score INTEGER,
    behavioral_score INTEGER,
    project_score INTEGER,
    matching_percentage INTEGER
  )`).run();
}

export function getScoresForCandidate(candidateId: number) {
  initScoresTable();
  const scores = db.prepare('SELECT * FROM scores_table WHERE candidate_id = ?').get(candidateId);
  console.log(`[Scores] Get scores for candidate ${candidateId}:`, scores);
  return scores;
}

export function updateScoresForCandidate(candidateId: number, updates: Partial<{ initial_screening_score: number; technical_score: number; behavioral_score: number; project_score: number; matching_percentage: number; }>) {
  initScoresTable();
  const setClauses = Object.keys(updates).map(key => `${key} = ?`).join(', ');
  const values = Object.values(updates);
  if (setClauses.length > 0) {
    db.prepare(`UPDATE scores_table SET ${setClauses} WHERE candidate_id = ?`).run(...values, candidateId);
  }
  const updated = db.prepare('SELECT * FROM scores_table WHERE candidate_id = ?').get(candidateId);
  console.log(`[Scores] Updated scores for candidate ${candidateId}:`, updated);
  return updated;
}
