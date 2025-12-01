// web-shell/src/pages/Notifications.jsx
import { useState } from "react";
import useNotifications from "../store/notifications";
import { api } from "../api";

function typeLabel(type) {
  switch (type) {
    case "task_created":
      return { label: "Task created", color: "bg-green-100 text-green-800" };
    case "task_updated":
      return { label: "Task updated", color: "bg-blue-100 text-blue-800" };
    case "task_deleted":
      return { label: "Task deleted", color: "bg-red-100 text-red-800" };
    default:
      return { label: type || "event", color: "bg-slate-100 text-slate-800" };
  }
}

function Notifications() {
  const { events, status, clear } = useNotifications();

  // ---- Email form state ----
  const [emailTo, setEmailTo] = useState("");
  const [emailSubject, setEmailSubject] = useState("Live notification");
  const [emailMessage, setEmailMessage] = useState("Hello from task platform!");
  const [emailStatus, setEmailStatus] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);

  function handleClear() {
    clear();
  }

  async function handleSendEmail(e) {
    e.preventDefault();
    setEmailStatus("");
    setEmailLoading(true);

    try {
      await api("/notifications/send-email", {
        method: "POST",
        body: {
          to: emailTo || "frontend@test.com",
          subject: emailSubject,
          message: emailMessage,
        },
      });

      setEmailStatus(
        "Email job queued in RabbitMQ ✅ (check email-worker logs in Docker)."
      );
    } catch (err) {
      console.error(err);
      setEmailStatus("Failed to queue email: " + err.message);
    } finally {
      setEmailLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold">Live Notifications</h1>
          <p className="text-sm text-slate-500 mt-1">
            Server-Sent Events (SSE) from the notification-service +
            Kafka/RabbitMQ events.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={
              "inline-flex items-center gap-1 text-sm px-2 py-1 rounded-full " +
              (status === "connected"
                ? "bg-green-100 text-green-800"
                : status === "connecting"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-red-100 text-red-800")
            }
          >
            <span
              className={
                "w-2 h-2 rounded-full " +
                (status === "connected"
                  ? "bg-green-500"
                  : status === "connecting"
                  ? "bg-yellow-500"
                  : "bg-red-500")
              }
            />
            {status === "connected"
              ? "Connected"
              : status === "connecting"
              ? "Connecting..."
              : "Disconnected"}
          </span>

          <button
            onClick={handleClear}
            className="text-sm px-3 py-1 rounded border border-slate-300 hover:bg-slate-100"
          >
            Clear
          </button>
        </div>
      </div>

      {/* SSE EVENTS LIST */}
      {events.length === 0 ? (
        <p className="text-slate-500 mb-6">
          No events yet. Try creating, updating, or deleting a task on the Tasks
          page. The SSE stream is running in the background.
        </p>
      ) : (
        <ul className="space-y-2 mb-8">
          {events.map((ev) => {
            const { label, color } = typeLabel(ev.type);
            const time = new Date(ev.receivedAt).toLocaleTimeString();

            return (
              <li
                key={ev.id}
                className="border rounded p-3 flex flex-col gap-1 bg-white"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={
                      "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium " +
                      color
                    }
                  >
                    {label}
                  </span>
                  <span className="text-xs text-slate-500">{time}</span>
                </div>

                {ev.task && (
                  <div className="text-sm mt-1">
                    <span className="font-semibold">Task:</span>{" "}
                    #{ev.task.id} – {ev.task.title}{" "}
                    {typeof ev.task.completed === "boolean" && (
                      <span className="text-xs text-slate-500">
                        [
                        {ev.task.completed
                          ? "✅ completed"
                          : "❌ pending"}
                        ]
                      </span>
                    )}
                  </div>
                )}

                {ev.taskId && !ev.task && (
                  <div className="text-sm mt-1">
                    <span className="font-semibold">Task ID:</span> {ev.taskId}
                  </div>
                )}

                <details className="mt-1">
                  <summary className="text-xs text-slate-500 cursor-pointer">
                    Raw event
                  </summary>
                  <pre className="text-xs bg-slate-50 p-2 rounded mt-1 overflow-x-auto">
                    {JSON.stringify(ev, null, 2)}
                  </pre>
                </details>
              </li>
            );
          })}
        </ul>
      )}

      {/* EMAIL QUEUE FORM (RabbitMQ) */}
      <div className="border rounded-lg bg-white p-4">
        <h2 className="text-lg font-semibold mb-1">
          Send test email (RabbitMQ)
        </h2>
        <p className="text-xs text-slate-500 mb-3">
          This calls <code>/api/notifications/send-email</code>. The
          notification-service publishes a message to{" "}
          <code>email_queue</code> in RabbitMQ, and the email-worker consumes it
          and logs the email.
        </p>

        <form onSubmit={handleSendEmail} className="space-y-2 max-w-md">
          <div>
            <label className="text-sm block mb-1">To</label>
            <input
              type="email"
              value={emailTo}
              onChange={(e) => setEmailTo(e.target.value)}
              placeholder="frontend@test.com"
              className="border rounded px-2 py-1 w-full text-sm"
            />
          </div>

          <div>
            <label className="text-sm block mb-1">Subject</label>
            <input
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              className="border rounded px-2 py-1 w-full text-sm"
            />
          </div>

          <div>
            <label className="text-sm block mb-1">Message</label>
            <textarea
              value={emailMessage}
              onChange={(e) => setEmailMessage(e.target.value)}
              className="border rounded px-2 py-1 w-full text-sm"
              rows={3}
            />
          </div>

          <button
            type="submit"
            disabled={emailLoading}
            className="text-sm px-3 py-1.5 rounded bg-slate-900 text-white disabled:opacity-60"
          >
            {emailLoading ? "Sending..." : "Send test email"}
          </button>

          {emailStatus && (
            <p className="text-xs text-slate-600 mt-1">{emailStatus}</p>
          )}
        </form>
      </div>
    </div>
  );
}

export default Notifications;
