router.get("/status", (req, res) => {
  if (!req.session || !req.session.userId) return res.json({ ok: false });

  db.get("SELECT * FROM client_keys WHERE user_id = ? AND enabled = 1", [req.session.userId], (err, existing) => {
    if (err) return res.json({ ok: false });
    if (!existing) return res.json({ ok: false });

    const fileName = `client-key-${existing.id}.txt`;
    res.json({
      ok: true,
      file: fileName,
      warning: "Key already generated. Download it here!"
    });
  });
});
