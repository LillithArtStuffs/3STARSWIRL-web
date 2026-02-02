const express = require("express");
const { v4: uuid } = require("uuid");
const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const { generateKey, hashKey } = require("../utils/crypto");

const router = express.Router();
const db = new sqlite3.Database("./db/database.sqlite");

// --- ENSURE KEYS FOLDER EXISTS ---
const KEYS_FOLDER = path.resolve(__dirname, "..", "keys"); // absolute path
if (!fs.existsSync(KEYS_FOLDER)) fs.mkdirSync(KEYS_FOLDER, { recursive: true });

// --- GENERATE KEY ---
router.post("/generate", (req, res) => {
  if (!req.session || !req.session.userId) return res.status(401).json({ ok: false, msg: "Not logged in" });

  db.get("SELECT * FROM client_keys WHERE user_id = ? AND enabled = 1", [req.session.userId], (err, existing) => {
    if (err) return res.status(500).json({ ok: false, msg: "DB error" });

    if (existing) {
      const fileName = `client-key-${existing.id}.txt`;
      return res.json({
        ok: true,
        file: fileName,
        warning: "Key already generated. Download it here!"
      });
    }

    // --- NEW KEY ---
    const rawKey = generateKey();
    const hashed = hashKey(rawKey);
    const keyId = uuid();
    const createdAt = Date.now();

    db.run(
      "INSERT INTO client_keys VALUES (?, ?, ?, 1, ?, NULL)",
      [keyId, req.session.userId, hashed, createdAt],
      (err) => {
        if (err) return res.status(500).json({ ok: false, msg: "DB error" });

        // --- WRITE FILE ---
        const fileName = `client-key-${keyId}.txt`;
        const filePath = path.join(KEYS_FOLDER, fileName);
        fs.writeFileSync(filePath, rawKey);

        console.log("✅ Key file written to:", filePath);

        res.json({
          ok: true,
          file: fileName,
          warning: "Save this file! It’s your client key and will not be shown again."
        });
      }
    );
  });
});

// --- CHECK KEY STATUS ---
router.get("/status", (req, res) => {
  if (!req.session || !req.session.userId) return res.json({ ok: false });

  db.get("SELECT * FROM client_keys WHERE user_id = ? AND enabled = 1", [req.session.userId], (err, existing) => {
    if (err || !existing) return res.json({ ok: false });

    const fileName = `client-key-${existing.id}.txt`;
    res.json({
      ok: true,
      file: fileName,
      warning: "Key already generated. Download it here!"
    });
  });
});

module.exports = router;
