const express = require("express");
const session = require("express-session");
const path = require("path");

const auth = require("./routes/auth");
const keys = require("./routes/keys");
const requireAuth = require("./middleware/requireAuth");
const devRoutes = require("./routes/dev");
const KEYS_FOLDER = path.resolve(__dirname, "keys");
const app = express();

// 1️⃣ Body parsing
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// 2️⃣ Session middleware (must come BEFORE routes)
app.use(
  session({
    secret: "dev-secret-change-later",
    resave: false,
    saveUninitialized: false
  })
);

// 3️⃣ Serve static files (optional)
app.use(express.static(path.join(__dirname, "views")));
app.use("/keys-downloads", express.static(KEYS_FOLDER));

// 4️⃣ Routes
app.use("/auth", auth);
app.use("/keys", keys);
app.use("/dev", devRoutes);

// 5️⃣ Protect dashboard
app.get("/dashboard.html", requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "views", "dashboard.html"));
});

app.listen(3000, () => console.log("Portal server running on http://localhost:3000"));
