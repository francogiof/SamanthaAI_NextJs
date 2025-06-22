import Database from 'better-sqlite3';

// Singleton pattern to avoid multiple connections in dev
let db: Database.Database;

if (!globalThis.__db) {
  db = new Database('app.db'); // You can change the path if needed
  globalThis.__db = db;
} else {
  db = globalThis.__db;
}

export default db;
