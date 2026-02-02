const express = require("express");
const fs = require("fs");
const path = require("path");
const { v4: uuid } = require("uuid");
const sqlite3 = require("sqlite3").verbose();
const { generateKey, hashKey } = require("../utils/crypto"); // your existing crypto helpers

const router = express.Router();

// --- absolute folder for key files ---
const KEYS_FOLDER = path.join(__dirname, "..", "keys");
if (!fs.existsSync(KEYS_FOLDER)) fs.mkdirSync(KEYS_FOLDER, { recursive: true });

// --- GENERATE NEW KEY ---
router.post("/generate", (req, res) => {
  if (!req.session || !req.session.userId) return res.status(401).json({ ok: false, msg: "Not logged in" });

  const db = new sqlite3.Database("./db/database.sqlite");

  // check if user already has a key
  db.get("SELECT * FROM client_keys WHERE user_id = ? AND enabled = 1", [req.session.userId], (err, existing) => {
    if (err) return res.status(500).json({ ok: false, msg: "DB error" });

    if (existing) {
      return res.json({
        ok: true,
        file: `client-key-${existing.id}.txt`,
        warning: "Key already generated. Copy it below and save it in a text file!"
      });
    }

    // create new key
    const rawKey = generateKey();
    const hashed = hashKey(rawKey);
    const keyId = uuid();
    const createdAt = Date.now();

    db.run(
      "INSERT INTO client_keys VALUES (?, ?, ?, 1, ?, NULL)",
      [keyId, req.session.userId, hashed, createdAt],
      (err) => {
        if (err) return res.status(500).json({ ok: false, msg: "DB error" });

        // write key file
        const fileName = `client-key-${keyId}.txt`;
        const filePath = path.join(KEYS_FOLDER, fileName);
        fs.writeFileSync(filePath, rawKey);
        console.log("✅ Key file written to:", filePath);

        res.json({
          ok: true,
          file: fileName,
          warning: "Copy this key below and save it in a text file! It will not be shown again."
        });
      }
    );
  });
});

// --- FETCH RAW KEY CONTENT ---
router.get("/get-key", (req, res) => {
  try {
    const fileName = req.query.file;
    if (!fileName) return res.status(400).send("Missing file parameter");

    // prevent path traversal
    if (fileName.includes("..") || fileName.includes("/")) {
      return res.status(400).send("Invalid file name");
    }

    const filePath = path.join(KEYS_FOLDER, fileName);

    if (!fs.existsSync(filePath)) return res.status(404).send("Key not found");

    const keyText = fs.readFileSync(filePath, "utf-8");
    res.type("text/plain").send(keyText);
  } catch (err) {
    console.error("Error fetching key:", err);
    res.status(500).send("Server error fetching key");
  }
});

module.exports = router;
