const express = require("express");
const { v4: uuid } = require("uuid");
const sqlite3 = require("sqlite3").verbose();
const { generateKey, hashKey } = require("../utils/crypto");
const path = require("path");
const fs = require("fs");

const router = express.Router();
const db = new sqlite3.Database("./db/database.sqlite");

router.post("/generate", (req, res) => {
  if (!req.session.userId) return res.sendStatus(401);

  const rawKey = generateKey();
  const hashed = hashKey(rawKey);
  const keyId = uuid();
  const createdAt = Date.now();

  // insert into DB
  db.run(
    `INSERT INTO client_keys VALUES (?, ?, ?, 1, ?, NULL)`,
    [keyId, req.session.userId, hashed, createdAt],
    (err) => {
      if (err) return res.status(500).send("DB error");

      // write key to file
      const fileName = `client-key-${keyId}.txt`;
      const filePath = path.join(__dirname, "..", "views", fileName); // serve via static
      fs.writeFileSync(filePath, rawKey);

      // return download link
      res.json({
        file: fileName,
        warning: "Save this file! It’s your client key and will not be shown again."
      });
    }
  );
});

module.exports = router;
