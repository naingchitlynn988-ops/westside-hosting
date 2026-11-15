import Database from "better-sqlite3";

const db = new Database(process.env.DATABASE_PATH || "./westside.sqlite");
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS servers (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    edition TEXT NOT NULL DEFAULT 'java',
    software TEXT NOT NULL DEFAULT 'vanilla',
    memory_mb INTEGER NOT NULL DEFAULT 4096,
    status TEXT NOT NULL DEFAULT 'stopped',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

export default db;
