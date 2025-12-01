// task-service/src/db.js
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
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      completed BOOLEAN NOT NULL DEFAULT false
    );
  `);
  console.log("🟢 Postgres ready: tasks table ensured");
}

async function getAllTasks() {
  const result = await pool.query("SELECT id, title, completed FROM tasks ORDER BY id ASC");
  return result.rows;
}

async function createTask(title) {
  const result = await pool.query(
    "INSERT INTO tasks (title, completed) VALUES ($1, false) RETURNING id, title, completed",
    [title]
  );
  return result.rows[0];
}

async function updateTask(id, fields) {
  const { title, completed } = fields;

  const res = await pool.query("SELECT id, title, completed FROM tasks WHERE id = $1", [id]);
  if (res.rowCount === 0) return null;

  const current = res.rows[0];

  const newTitle = title ?? current.title;
  const newCompleted = completed ?? current.completed;

  const result = await pool.query(
    "UPDATE tasks SET title = $1, completed = $2 WHERE id = $3 RETURNING id, title, completed",
    [newTitle, newCompleted, id]
  );

  return result.rows[0];
}

async function deleteTask(id) {
  const result = await pool.query("DELETE FROM tasks WHERE id = $1 RETURNING id", [id]);
  return result.rowCount > 0;
}

module.exports = {
  init,
  getAllTasks,
  createTask,
  updateTask,
  deleteTask,
};
