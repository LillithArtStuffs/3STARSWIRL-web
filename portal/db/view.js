const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./database.sqlite");

console.log("Users table:");
db.all("SELECT * FROM users", [], (err, rows) => {
  if (err) throw err;
  console.table(rows);
});

console.log("\nClient Keys table:");
db.all("SELECT * FROM client_keys", [], (err, rows) => {
  if (err) throw err;
  console.table(rows);
  db.close();
});
