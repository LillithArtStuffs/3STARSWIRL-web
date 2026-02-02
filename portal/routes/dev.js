const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();
const db = new sqlite3.Database("./db/database.sqlite");

router.get("/db", (req, res, next) => {
  req.devOnly = true;
  requireAuth(req, res, () => {
    db.all("SELECT * FROM users", [], (err, users) => {
      if (err) return res.status(500).send("DB error");

      db.all("SELECT * FROM client_keys", [], (err, keys) => {
        if (err) return res.status(500).send("DB error");

        let html = `
          <html>
            <head><title>Dev DB</title></head>
            <body>
              <h1>Users</h1>
              <pre>${JSON.stringify(users, null, 2)}</pre>
              <h1>Client Keys</h1>
              <pre>${JSON.stringify(keys, null, 2)}</pre>
            </body>
          </html>
        `;
        res.send(html);
      });
    });
  });
});

module.exports = router;
