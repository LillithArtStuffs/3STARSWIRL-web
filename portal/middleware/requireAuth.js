// middleware/requireAuth.js

module.exports = function requireAuth(req, res, next) {
  // make sure session exists
  if (!req.session || !req.session.userId) {
    return res.redirect("/login.html");
  }

  // if this route is marked dev-only, check dev flag
  if (req.devOnly && !req.session.isDev) {
    return res.status(403).send("Forbidden: Devs only");
  }

  // everything good → continue
  next();
};
