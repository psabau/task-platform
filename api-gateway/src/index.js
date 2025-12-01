// api-gateway/src/index.js
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

// MUST match auth-service
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

app.use(cors());
app.use(express.json());

// -------- JWT middleware (for protected routes) --------
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Malformed token" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    // forward user id to downstream services
    req.headers["x-user-id"] = decoded.userId;
    next();
  } catch (err) {
    console.error("JWT verification failed:", err.message);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// -------- Health check --------
app.get("/", (req, res) => {
  res.json({ message: "API Gateway is running 🚀" });
});

// ==================== AUTH ROUTES (PUBLIC) ====================

// POST /api/auth/register  ->  auth-service /auth/register
app.post("/api/auth/register", async (req, res) => {
  try {
    const response = await axios.post(
      "http://auth-service:5000/auth/register",
      req.body
    );
    res.status(response.status).json(response.data);
  } catch (err) {
    console.error("Error in /api/auth/register:", err.message);
    if (err.response) {
      return res.status(err.response.status).json(err.response.data);
    }
    res.status(500).json({ error: "Auth service unavailable" });
  }
});

// POST /api/auth/login  ->  auth-service /auth/login
app.post("/api/auth/login", async (req, res) => {
  try {
    const response = await axios.post(
      "http://auth-service:5000/auth/login",
      req.body
    );
    res.status(response.status).json(response.data);
  } catch (err) {
    console.error("Error in /api/auth/login:", err.message);
    if (err.response) {
      return res.status(err.response.status).json(err.response.data);
    }
    res.status(500).json({ error: "Auth service unavailable" });
  }
});

// ==================== ADMIN ROUTES (PROTECTED) ====================

// GET /api/admin/users -> auth-service /auth/admin/users
app.get("/api/admin/users", authMiddleware, async (req, res) => {
  try {
    const response = await axios.get(
      "http://auth-service:5000/auth/admin/users",
      {
        headers: { "x-user-id": req.user.userId },
      }
    );
    res.status(response.status).json(response.data);
  } catch (err) {
    console.error("Error in GET /api/admin/users:", err.message);
    if (err.response) {
      return res.status(err.response.status).json(err.response.data);
    }
    res.status(500).json({ error: "Auth service unavailable" });
  }
});

// ==================== TASK ROUTES (PROTECTED) ====================

// GET /api/tasks  ->  task-service /api/tasks
app.get("/api/tasks", authMiddleware, async (req, res) => {
  try {
    const response = await axios.get("http://task-service:4000/api/tasks", {
      headers: {
        "x-user-id": req.user.userId,
      },
    });
    res.status(response.status).json(response.data);
  } catch (err) {
    console.error("Error in GET /api/tasks:", err.message);
    if (err.response) {
      return res.status(err.response.status).json(err.response.data);
    }
    res.status(500).json({ error: "Task service unavailable" });
  }
});

// POST /api/tasks  ->  task-service /api/tasks
app.post("/api/tasks", authMiddleware, async (req, res) => {
  try {
    const response = await axios.post(
      "http://task-service:4000/api/tasks",
      req.body,
      {
        headers: {
          "x-user-id": req.user.userId,
        },
      }
    );
    res.status(response.status).json(response.data);
  } catch (err) {
    console.error("Error in POST /api/tasks:", err.message);
    if (err.response) {
      return res.status(err.response.status).json(err.response.data);
    }
    res.status(500).json({ error: "Task service unavailable" });
  }
});

// PUT /api/tasks/:id  ->  task-service /api/tasks/:id
app.put("/api/tasks/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const response = await axios.put(
      `http://task-service:4000/api/tasks/${id}`,
      req.body,
      {
        headers: {
          "x-user-id": req.user.userId,
        },
      }
    );
    res.status(response.status).json(response.data);
  } catch (err) {
    console.error(`Error in PUT /api/tasks/${id}:`, err.message);
    if (err.response) {
      return res.status(err.response.status).json(err.response.data);
    }
    res.status(500).json({ error: "Task service unavailable" });
  }
});

// DELETE /api/tasks/:id  ->  task-service /api/tasks/:id
app.delete("/api/tasks/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const response = await axios.delete(
      `http://task-service:4000/api/tasks/${id}`,
      {
        headers: {
          "x-user-id": req.user.userId,
        },
      }
    );
    res.status(response.status).json(response.data);
  } catch (err) {
    console.error(`Error in DELETE /api/tasks/${id}:`, err.message);
    if (err.response) {
      return res.status(err.response.status).json(err.response.data);
    }
    res.status(500).json({ error: "Task service unavailable" });
  }
});

// ================= NOTIFICATIONS (PROTECTED) =================

// GET /api/notifications/hello -> notification-service /notifications/hello
app.get("/api/notifications/hello", authMiddleware, async (req, res) => {
  try {
    const response = await axios.get(
      "http://notification-service:7000/notifications/hello",
      {
        headers: {
          "x-user-id": req.user.userId,
        },
      }
    );
    res.status(response.status).json(response.data);
  } catch (err) {
    console.error("Error in /api/notifications/hello:", err.message);
    if (err.response) {
      return res.status(err.response.status).json(err.response.data);
    }
    res.status(500).json({ error: "Notification service unavailable" });
  }
});

// POST /api/notifications/send-email -> notification-service /notifications/send-email
app.post(
  "/api/notifications/send-email",
  authMiddleware,
  async (req, res) => {
    try {
      const response = await axios.post(
        "http://notification-service:7000/notifications/send-email",
        req.body,
        { headers: { "x-user-id": req.user.userId } }
      );
      res.status(response.status).json(response.data);
    } catch (err) {
      console.error(
        "Error in POST /api/notifications/send-email:",
        err.message
      );
      if (err.response) {
        return res.status(err.response.status).json(err.response.data);
      }
      res.status(500).json({ error: "Notification service unavailable" });
    }
  }
);

// ================= FaaS ROUTE (PROTECTED) =================
// GET /api/faas/overview-stats
app.get("/api/faas/overview-stats", authMiddleware, async (req, res) => {
  try {
    // 1) Get tasks for current user
    const tasksResponse = await axios.get(
      "http://task-service:4000/api/tasks",
      {
        headers: { "x-user-id": req.user.userId },
      }
    );

    const tasks = tasksResponse.data || [];

    // 2) Call FaaS service with tasks array
    const faasResponse = await axios.post(
      "http://faas-service:9000/analyze-tasks",
      { tasks }
    );

    // 3) Return the FaaS result
    res.status(faasResponse.status).json(faasResponse.data);
  } catch (err) {
    console.error("Error in GET /api/faas/overview-stats:", err.message);
    if (err.response) {
      return res.status(err.response.status).json(err.response.data);
    }
    res.status(500).json({ error: "FaaS service unavailable" });
  }
});

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});
