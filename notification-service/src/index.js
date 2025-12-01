// notification-service/src/index.js
const express = require("express");
const cors = require("cors");
const amqp = require("amqplib");

const app = express();
const PORT = process.env.PORT || 7000;

app.use(cors());
app.use(express.json());

// ----- SSE CLIENT MANAGEMENT -----
let clients = [];

function broadcastEvent(data) {
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  clients.forEach((res) => res.write(payload));
}

// SSE stream for frontend
app.get("/notifications/stream", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  // Initial comment to keep connection open
  res.write(": connected\n\n");

  clients.push(res);
  console.log(`🔌 SSE client connected. Total: ${clients.length}`);

  req.on("close", () => {
    clients = clients.filter((c) => c !== res);
    console.log(`❌ SSE client disconnected. Total: ${clients.length}`);
  });
});

// Internal endpoint used by task-service to push domain events
app.post("/internal/task-event", (req, res) => {
  const event = req.body;

  console.log("📥 Internal task event received:", event);

  // broadcast to all SSE clients
  broadcastEvent(event);

  res.json({ status: "sent" });
});

// ----- RABBITMQ EMAIL QUEUING -----
async function sendEmailNotification(emailData) {
  try {
    const connection = await amqp.connect("amqp://rabbitmq"); // Docker hostname
    const channel = await connection.createChannel();

    const QUEUE = "email_queue";
    await channel.assertQueue(QUEUE);

    channel.sendToQueue(QUEUE, Buffer.from(JSON.stringify(emailData)));
    console.log("📤 Notification-service: Email job queued!");

    // optional SSE event for frontend
    broadcastEvent({
      type: "EMAIL_QUEUED",
      to: emailData.to,
      subject: emailData.subject,
      message: emailData.message,
      timestamp: new Date().toISOString(),
    });

    await channel.close();
    await connection.close();
  } catch (err) {
    console.error("❌ Failed to send email message:", err.message);
  }
}

// Public endpoint (goes through API gateway) to queue an email
app.post("/notifications/send-email", async (req, res) => {
  const { to, subject, message } = req.body;

  if (!to || !subject || !message) {
    return res.status(400).json({ error: "to, subject, message are required" });
  }

  await sendEmailNotification({ to, subject, message });

  res.json({ status: "Email queued" });
});

// Optional health endpoint
app.get("/notifications/hello", (req, res) => {
  res.json({ message: "Notification Service is running 🚀" });
});

app.listen(PORT, () => {
  console.log(`Notification Service running on port ${PORT}`);
});
