const express = require("express");
const User = require("../models/User");
const { signToken } = require("../middleware/auth");

const router = express.Router();

const USERNAME_RE = /^[a-zA-Z0-9_-]{3,32}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }
    if (!USERNAME_RE.test(username)) {
      return res
        .status(400)
        .json({ error: "Username must be 3-32 alphanumeric characters" });
    }
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }
    if (password.length < 8) {
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters" });
    }

    const existing = await User.findOne({
      $or: [
        { username: username.toLowerCase() },
        { email: email.toLowerCase() },
      ],
    });
    if (existing) {
      return res.status(409).json({ error: "Username or email already taken" });
    }

    const user = new User({
      username,
      email,
      passwordHash: password,
    });
    await user.save();

    const token = signToken({ sub: user._id, role: "user" });

    res.status(201).json({
      token,
      user: user.toJSON(),
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "Username or email already taken" });
    }
    res.status(500).json({ error: "Registration failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { login, password } = req.body;

    if (!login || !password) {
      return res.status(400).json({ error: "Login and password are required" });
    }

    const user = await User.findOne({
      $or: [{ username: login }, { email: login.toLowerCase() }],
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const valid = await user.comparePassword(password);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = signToken({ sub: user._id, role: "user" });

    res.json({
      token,
      user: user.toJSON(),
    });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});

router.get("/me", async (req, res) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  try {
    const { verifyToken } = require("../middleware/auth");
    const decoded = verifyToken(header.slice(7));
    const user = await User.findById(decoded.sub).select("-passwordHash");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user: user.toJSON() });
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
});

module.exports = router;
