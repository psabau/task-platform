const router = require("express").Router();
const axios = require("axios");

const TASK_SERVICE = "http://task-service:4000";

router.get("/", async (req, res) => {
  const r = await axios.get(`${TASK_SERVICE}/tasks`);
  res.json(r.data);
});

router.post("/", async (req, res) => {
  const r = await axios.post(`${TASK_SERVICE}/tasks`, req.body);
  res.json(r.data);
});

router.put("/:id", async (req, res) => {
  const r = await axios.put(`${TASK_SERVICE}/tasks/${req.params.id}`, req.body);
  res.json(r.data);
});

router.delete("/:id", async (req, res) => {
  const r = await axios.delete(`${TASK_SERVICE}/tasks/${req.params.id}`);
  res.json({ ok: true });
});

module.exports = router;
