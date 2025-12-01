// auth-service/src/db.js
const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST || "postgres",
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || "taskuser",
  password: process.env.DB_PASSWORD || "taskpass",
  database: process.env.DB_NAME || "taskdb",
});

async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL
    );
  `);
  console.log("🟢 Postgres ready: users table ensured");
}

async function createUser(email, passwordHash) {
  const result = await pool.query(
    "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email",
    [email, passwordHash]
  );
  return result.rows[0];
}

async function findUserByEmail(email) {
  const result = await pool.query(
    "SELECT id, email, password_hash FROM users WHERE email = $1",
    [email]
  );
  return result.rows[0] || null;
}

// ⭐ list all users for admin
async function getAllUsers() {
  const result = await pool.query(
    "SELECT id, email FROM users ORDER BY id ASC"
  );
  return result.rows;
}

module.exports = {
  init,
  createUser,
  findUserByEmail,
  getAllUsers,
};
