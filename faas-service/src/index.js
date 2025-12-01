// faas-service/src/index.js
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 9000;

app.use(cors());
app.use(express.json());

// Health
app.get("/", (req, res) => {
  res.json({
    message: "FaaS service is running 🚀",
    endpoints: ["/analyze-tasks"],
  });
});

// POST /analyze-tasks
app.post("/analyze-tasks", (req, res) => {
  const tasks = Array.isArray(req.body.tasks) ? req.body.tasks : [];

  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const pending = total - completed;
  const completionRate = total ? Math.round((completed / total) * 100) : 0;

  const titlesUppercase = tasks.map((t) =>
    typeof t.title === "string" ? t.title.toUpperCase() : ""
  );

  res.json({
    totalTasks: total,
    completedTasks: completed,
    pendingTasks: pending,
    completionRate,
    sampleUppercaseTitles: titlesUppercase.slice(0, 5),
    note:
      "Computed by faas-service based on tasks from task-service via API Gateway.",
  });
});

app.listen(PORT, () => {
  console.log(`FaaS service running on port ${PORT}`);
});
