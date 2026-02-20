const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "jdi-viz-secret-change-in-prod";
const JWT_EXPIRES = process.env.JWT_EXPIRES || "7d";

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const decoded = verifyToken(header.slice(7));
    req.userId = decoded.sub;
    req.userRole = decoded.role || "user";
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    }
    return res.status(401).json({ error: "Invalid token" });
  }
}

function optionalAuth(req, _res, next) {
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) {
    try {
      const decoded = verifyToken(header.slice(7));
      req.userId = decoded.sub;
    } catch (_) {}
  }
  next();
}

module.exports = {
  signToken,
  verifyToken,
  requireAuth,
  optionalAuth,
  JWT_SECRET,
};
