import db from '../db';

// Team Leader table model and helpers
export function initTeamLeaderTable() {
  db.prepare(`CREATE TABLE IF NOT EXISTS team_leader_table (
    leader_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    department TEXT,
    notes TEXT
  )`).run();
}

export function getTeamLeaderByUserId(userId: number) {
  initTeamLeaderTable();
  return db.prepare('SELECT * FROM team_leader_table WHERE user_id = ?').get(userId);
}

export function createTeamLeaderProfile(userId: number) {
  initTeamLeaderTable();
  // Only create if not exists
  const exists = getTeamLeaderByUserId(userId);
  if (exists) return exists;
  db.prepare(`INSERT INTO team_leader_table (user_id) VALUES (?)`).run(userId);
  return getTeamLeaderByUserId(userId);
}
