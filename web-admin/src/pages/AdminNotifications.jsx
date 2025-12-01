// web-admin/src/pages/AdminNotifications.jsx
import { useEffect, useMemo, useState } from "react";

function labelForType(type) {
  switch (type) {
    case "task_created":
      return { label: "Task created", color: "badge-green" };
    case "task_updated":
      return { label: "Task updated", color: "badge-blue" };
    case "task_deleted":
      return { label: "Task deleted", color: "badge-red" };
    case "EMAIL_QUEUED":
      return { label: "Email queued", color: "badge-yellow" };
    default:
      return { label: type || "event", color: "badge-gray" };
  }
}

function AdminNotifications() {
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState("connecting"); // connecting | connected | disconnected

  useEffect(() => {
    // 🔥 build an absolute URL, same host as nginx (e.g. http://localhost:8080/notifications/stream)
    const base = window.location.origin.replace(/\/+$/, "");
    const url = `${base}/notifications/stream`;

    console.log("[AdminEvents] connecting to SSE:", url);

    const es = new EventSource(url);

    es.onopen = () => {
      console.log("[AdminEvents] SSE connected");
      setStatus("connected");
    };

    es.onerror = (err) => {
      console.warn("[AdminEvents] SSE error:", err);
      // SSE often reconnects automatically; treat as soft failure
      setStatus("disconnected");
    };

    es.onmessage = (evt) => {
      if (!evt.data) return;

      try {
        const payload = JSON.parse(evt.data);
        const enriched = {
          id: Date.now() + Math.random(),
          receivedAt: new Date().toISOString(),
          ...payload,
        };

        setEvents((prev) => {
          const next = [enriched, ...prev];
          return next.slice(0, 200); // keep only last 200
        });
      } catch (e) {
        console.warn("[AdminEvents] Failed to parse SSE data:", evt.data);
      }
    };

    return () => {
      console.log("[AdminEvents] closing SSE");
      es.close();
    };
  }, []);

  const stats = useMemo(() => {
    const base = {
      total: events.length,
      task_created: 0,
      task_updated: 0,
      task_deleted: 0,
      EMAIL_QUEUED: 0,
    };

    for (const ev of events) {
      if (ev.type && base.hasOwnProperty(ev.type)) {
        base[ev.type]++;
      }
    }

    return base;
  }, [events]);

  function handleClear() {
    setEvents([]);
  }

  function statusBadge() {
    if (status === "connected") {
      return (
        <span className="badge-pill badge-pill-green">
          <span className="badge-dot badge-dot-green" />
          Connected (global stream)
        </span>
      );
    }
    if (status === "connecting") {
      return (
        <span className="badge-pill badge-pill-yellow">
          <span className="badge-dot badge-dot-yellow" />
          Connecting…
        </span>
      );
    }
    return (
      <span className="badge-pill badge-pill-red">
        <span className="badge-dot badge-dot-red" />
        Disconnected
      </span>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Events / Notifications</h1>
          <p className="admin-page-subtitle">
            Global stream of domain events from task-service and
            notification-service via Server-Sent Events (SSE).
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {statusBadge()}
          <button className="btn btn-secondary" onClick={handleClear}>
            Clear list
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="summary-grid">
        <div className="card">
          <h2 className="card-title">Total events</h2>
          <p className="card-number">{stats.total}</p>
          <p className="card-subtitle">
            Includes all task + email events emitted while this page is open.
          </p>
        </div>

        <div className="card">
          <h2 className="card-title">Task events</h2>
          <p className="card-line">
            Created: <strong>{stats.task_created}</strong>
          </p>
          <p className="card-line">
            Updated: <strong>{stats.task_updated}</strong>
          </p>
          <p className="card-line">
            Deleted: <strong>{stats.task_deleted}</strong>
          </p>
          <p className="card-subtitle">
            Sent by <code>task-service</code> whenever tasks are created,
            updated or deleted.
          </p>
        </div>

        <div className="card">
          <h2 className="card-title">Email jobs</h2>
          <p className="card-number">{stats.EMAIL_QUEUED}</p>
          <p className="card-subtitle">
            Emitted by <code>notification-service</code> whenever a message is
            queued in RabbitMQ and consumed by <code>email-worker</code>.
          </p>
        </div>
      </div>

      {/* Events table */}
      <div className="card" style={{ marginTop: "16px" }}>
        <h2 className="card-title">Live event log</h2>
        <p className="card-subtitle" style={{ marginBottom: "8px" }}>
          Most recent events appear first. This view is global: it shows events
          coming from all users in the system while this admin page is open.
        </p>

        {status === "disconnected" && (
          <p className="card-warning">
            If this stays disconnected, try opening{" "}
            <code>{window.location.origin.replace(/\/+$/, "")}/notifications/stream</code>{" "}
            directly in the browser. You should see a streaming response. If
            that fails, the problem is in nginx/notification-service, not this
            page.
          </p>
        )}

        {events.length === 0 ? (
          <p className="card-empty">
            No events yet. Try creating/updating/deleting tasks in the main app
            or sending a test email from the user Notifications tab.
          </p>
        ) : (
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Received</th>
                  <th>Summary</th>
                  <th>Raw</th>
                </tr>
              </thead>
              <tbody>
                {events.map((ev) => {
                  const { label, color } = labelForType(ev.type);
                  const time = new Date(ev.receivedAt).toLocaleTimeString();

                  return (
                    <tr key={ev.id}>
                      <td>
                        <span className={"badge " + color}>{label}</span>
                      </td>
                      <td className="cell-muted">{time}</td>
                      <td className="cell-small">
                        {ev.type === "task_created" && ev.task && (
                          <>
                            New task #{ev.task.id}:{" "}
                            <strong>{ev.task.title}</strong>
                          </>
                        )}
                        {ev.type === "task_updated" && ev.task && (
                          <>
                            Updated task #{ev.task.id}:{" "}
                            <strong>{ev.task.title}</strong>{" "}
                            {typeof ev.task.completed === "boolean" && (
                              <span className="cell-muted">
                                [
                                {ev.task.completed
                                  ? "✅ completed"
                                  : "❌ pending"}
                                ]
                              </span>
                            )}
                          </>
                        )}
                        {ev.type === "task_deleted" && ev.taskId && (
                          <>Deleted task #{ev.taskId}</>
                        )}
                        {ev.type === "EMAIL_QUEUED" && (
                          <>
                            Email to <strong>{ev.to}</strong> –{" "}
                            <span>{ev.subject}</span>
                          </>
                        )}
                        {!ev.type && <>Event</>}
                      </td>
                      <td className="cell-small">
                        <details>
                          <summary style={{ cursor: "pointer" }}>JSON</summary>
                          <pre className="pre-json">
                            {JSON.stringify(ev, null, 2)}
                          </pre>
                        </details>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminNotifications;
