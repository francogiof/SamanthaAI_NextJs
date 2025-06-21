import Database from 'better-sqlite3';

// Use a file-based SQLite DB for persistence. You can change the path as needed.
const db = new Database(process.env.SQLITE_DB_PATH || './app.db');

// Initialize the users table if it doesn't exist
export function initUserTable() {
  db.prepare(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    passwordHash TEXT NOT NULL,
    role TEXT CHECK(role IN ('candidate', 'team-leader')) NOT NULL,
    teamLeaderId INTEGER,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  )`).run();
}

export default db;
