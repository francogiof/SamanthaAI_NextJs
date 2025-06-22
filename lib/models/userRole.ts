import db from '../db';

// UserRole model and table creation
export type UserRole = {
  id: number;
  stackAuthId: string;
  role: 'candidate' | 'team-leader';
};

// Ensure the table exists
export function initUserRoleTable() {
  db.prepare(`CREATE TABLE IF NOT EXISTS user_roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stackAuthId TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('candidate', 'team-leader'))
  )`).run();
}

// Add or update a user role
export function upsertUserRole(stackAuthId: string, role: 'candidate' | 'team-leader') {
  initUserRoleTable();
  db.prepare(`INSERT INTO user_roles (stackAuthId, role) VALUES (?, ?)
    ON CONFLICT(stackAuthId) DO UPDATE SET role=excluded.role`).run(stackAuthId, role);
}

// Get a user role by stackAuthId
export function getUserRole(stackAuthId: string): UserRole | undefined {
  initUserRoleTable();
  return db.prepare('SELECT * FROM user_roles WHERE stackAuthId = ?').get(stackAuthId);
}
