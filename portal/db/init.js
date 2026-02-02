// db/init.js
const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");
const path = require("path");

// Make sure db folder exists
const dbFolder = path.join(__dirname);
if (!fs.existsSync(dbFolder)) {
  fs.mkdirSync(dbFolder);
}

// Path to the database
const dbPath = path.join(dbFolder, "database.sqlite");

// Delete any existing corrupt DB (optional, only if you want fresh)
if (fs.existsSync(dbPath)) {
  console.log("Removing old database.sqlite (if exists)...");
  fs.unlinkSync(dbPath);
}

// Open new database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
  } else {
    console.log("Database file created successfully!");
  }
});

db.serialize(() => {
  // Create users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )
  `, [], (err) => {
    if (err) console.error("Error creating users table:", err.message);
    else console.log("Users table ready.");
  });

  // Create client_keys table
  db.run(`
    CREATE TABLE IF NOT EXISTS client_keys (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      key_hash TEXT NOT NULL,
      enabled INTEGER DEFAULT 1,
      created_at INTEGER NOT NULL,
      last_used INTEGER,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `, [], (err) => {
    if (err) console.error("Error creating client_keys table:", err.message);
    else console.log("Client keys table ready.");
  });
});

// Close DB
db.close((err) => {
  if (err) console.error("Error closing database:", err.message);
  else console.log("Database initialized and closed successfully!");
});
