const express = require("express");
const bcrypt = require("bcrypt");
const { v4: uuid } = require("uuid");
const sqlite3 = require("sqlite3").verbose();

const router = express.Router();
const db = new sqlite3.Database("./db/database.sqlite");

// SIGNUP
router.post("/signup", (req, res) => {
  const { username, password } = req.body;

  bcrypt.hash(password, 12, (err, hash) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Server error");
    }

    db.run(
      `INSERT INTO users VALUES (?, ?, ?, ?)`,
      [uuid(), username, hash, Date.now()],
      (err) => {
        if (err) {
          console.error(err);
          return res.status(400).send("Username exists");
        }
        res.redirect("/login.html");
      }
    );
  });
});


// LOGIN
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, user) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Server error");
    }

    if (!user) return res.status(401).send("Invalid login");

    bcrypt.compare(password, user.password_hash, (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Server error");
      }

      if (!result) return res.status(401).send("Invalid login");

      // ✅ session setup
      req.session.userId = user.id;

      // ✅ mark dev users automatically
      if (user.username === "dev") {
        req.session.isDev = true;
      }

      res.redirect("/dashboard.html");
    });
  });
});




module.exports = router;
