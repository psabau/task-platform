// task-service/src/index.js
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const axios = require("axios");
const { Kafka } = require("kafkajs");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

// ---------- Postgres ----------
const pool = new Pool({
  host: process.env.DB_HOST || "postgres",
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || "taskuser",
  password: process.env.DB_PASSWORD || "taskpass",
  database: process.env.DB_NAME || "taskdb",
});

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      completed BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log("🟢 task-service: tasks table ready");
}

// ---------- Kafka ----------
const kafka = new Kafka({
  clientId: "task-service",
  brokers: [process.env.KAFKA_BROKER || "kafka:9092"],
});

const producer = kafka.producer();

async function initKafka() {
  await producer.connect();
  console.log("🟢 task-service: Kafka producer connected");
}

async function publishTaskEvent(type, payload) {
  try {
    await producer.send({
      topic: "task-events",
      messages: [
        {
          key: type,
          value: JSON.stringify(payload),
        },
      ],
    });
    console.log(`📤 Kafka event sent: ${type}`);
  } catch (err) {
    console.error("❌ Error publishing Kafka event:", err);
  }
}

// ---------- SSE notify helper ----------
const NOTIFY_URL =
  process.env.NOTIFY_URL ||
  "http://notification-service:7000/internal/task-event";

async function emitSse(event) {
  try {
    await axios.post(NOTIFY_URL, event);
    console.log(
      "📡 SSE event forwarded to notification-service:",
      event.type
    );
  } catch (err) {
    console.log("Notify failed:", err.message);
  }
}

// ---------- Small helper ----------
function getUserId(req, res) {
  const userIdHeader = req.headers["x-user-id"];
  const userId = Number(userIdHeader);
  if (!userId) {
    res.status(400).json({ error: "Missing or invalid x-user-id header" });
    return null;
  }
  return userId;
}

// ---------- Routes ----------

// Health
app.get("/", (_req, res) => {
  res.json({ message: "Task Service is running 🚀" });
});

// GET /api/tasks -> only tasks for that user
app.get("/api/tasks", async (req, res) => {
  const userId = getUserId(req, res);
  if (!userId) return;

  try {
    const result = await pool.query(
      "SELECT id, title, completed FROM tasks WHERE user_id = $1 ORDER BY id ASC",
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("GET /api/tasks error:", err);
    res.status(500).json({ error: "Failed to load tasks" });
  }
});

// POST /api/tasks -> create task for that user
app.post("/api/tasks", async (req, res) => {
  const userId = getUserId(req, res);
  if (!userId) return;

  const { title } = req.body;
  if (!title) {
    return res.status(400).json({ error: "title is required" });
  }

  try {
    const insert = await pool.query(
      "INSERT INTO tasks (user_id, title, completed) VALUES ($1, $2, $3) RETURNING id, title, completed",
      [userId, title, false]
    );

    const task = insert.rows[0];
    console.log("🆕 Created task:", task);

    // SSE event
    emitSse({
      type: "task_created",
      task,
    });

    // Kafka event
    publishTaskEvent("task-created", task);

    res.json(task);
  } catch (err) {
    console.error("POST /api/tasks error:", err);
    res.status(500).json({ error: "Failed to create task" });
  }
});

// PUT /api/tasks/:id -> update one task for that user
app.put("/api/tasks/:id", async (req, res) => {
  const userId = getUserId(req, res);
  if (!userId) return;

  const id = Number(req.params.id);
  const { title, completed } = req.body;

  console.log("✏️ Update request for task id:", id, "user:", userId);

  try {
    // Only update tasks that belong to this user
    const result = await pool.query(
      `
        UPDATE tasks
        SET title = COALESCE($1, title),
            completed = COALESCE($2, completed)
        WHERE id = $3 AND user_id = $4
        RETURNING id, title, completed;
      `,
      [title ?? null, completed ?? null, id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Task not found for this user" });
    }

    const task = result.rows[0];

    emitSse({
      type: "task_updated",
      task,
    });

    publishTaskEvent("task-updated", task);

    res.json(task);
  } catch (err) {
    console.error("PUT /api/tasks/:id error:", err);
    res.status(500).json({ error: "Failed to update task" });
  }
});

// DELETE /api/tasks/:id -> delete one task for that user
app.delete("/api/tasks/:id", async (req, res) => {
  const userId = getUserId(req, res);
  if (!userId) return;

  const id = Number(req.params.id);
  console.log("🗑️ Delete request for task id:", id, "user:", userId);

  try {
    const result = await pool.query(
      "DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id",
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Task not found for this user" });
    }

    emitSse({
      type: "task_deleted",
      taskId: id,
    });

    publishTaskEvent("task-deleted", { taskId: id, userId });

    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("DELETE /api/tasks/:id error:", err);
    res.status(500).json({ error: "Failed to delete task" });
  }
});

// ---------- Startup ----------
async function start() {
  try {
    await initDb();
    await initKafka();
    app.listen(PORT, () =>
      console.log(`Task Service on port ${PORT}`)
    );
  } catch (err) {
    console.error("❌ Failed to start task-service:", err);
    process.exit(1);
  }
}

start();
