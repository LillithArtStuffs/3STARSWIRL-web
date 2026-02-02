const crypto = require("crypto");

exports.generateKey = () => crypto.randomBytes(32).toString("hex");

exports.hashKey = (key) => crypto.createHash("sha256").update(key).digest("hex");
