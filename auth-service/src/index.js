// auth-service/src/index.js
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

// ---------- REGISTER ----------
app.post("/auth/register", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: "email & password required" });

  try {
    const existing = await db.findUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const newUser = await db.createUser(email, hashed);

    res.status(201).json({
      message: "User created",
      userId: newUser.id,
      email: newUser.email,
    });
  } catch (err) {
    console.error("POST /auth/register error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ---------- LOGIN ----------
app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: "email & password required" });

  try {
    const user = await db.findUserByEmail(email);
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ token });
  } catch (err) {
    console.error("POST /auth/login error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ---------- AUTH CHECK (/auth/me) ----------
app.get("/auth/me", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(401).json({ error: "No token provided" });

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json(decoded);
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
});

// ---------- ADMIN USERS (for admin UI) ----------
// GET /auth/admin/users  -> used by API Gateway /api/admin/users
app.get("/auth/admin/users", async (_req, res) => {
  try {
    const users = await db.getAllUsers();
    res.json(users);
  } catch (err) {
    console.error("GET /auth/admin/users error:", err.message);
    res.status(500).json({ error: "Failed to load users" });
  }
});

// ---------- STARTUP ----------
async function start() {
  try {
    await db.init();
    app.listen(PORT, () =>
      console.log(`Auth Service running on port ${PORT}`)
    );
  } catch (err) {
    console.error("❌ Failed to start auth-service:", err.message);
    process.exit(1);
  }
}

start();
