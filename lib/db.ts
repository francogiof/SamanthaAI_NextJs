import Database from 'better-sqlite3';

// Add type for globalThis.__db
declare global {
  // eslint-disable-next-line no-var
  var __db: Database.Database | undefined;
}

let db: Database.Database;

if (!globalThis.__db) {
  db = new Database('app.db'); // You can change the path if needed
  globalThis.__db = db;
} else {
  db = globalThis.__db;
}

export default db;
