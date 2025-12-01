// web-admin/src/pages/RabbitMetrics.jsx
function RabbitMetrics() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">RabbitMQ – Email Queue</h1>
      <p className="text-sm text-slate-500 mb-6">
        RabbitMQ is used as a message broker for asynchronous email sending.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="border rounded-2xl p-4 bg-white shadow-sm">
          <h2 className="text-lg font-semibold mb-2">Queue</h2>
          <p className="text-sm text-slate-700">
            <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">
              email_queue
            </span>
          </p>
          <p className="text-xs text-slate-500 mt-2">
            Jobs are enqueued by the <strong>notification-service</strong>.
          </p>
        </div>

        <div className="border rounded-2xl p-4 bg-white shadow-sm">
          <h2 className="text-lg font-semibold mb-2">Worker</h2>
          <p className="text-sm text-slate-700">
            <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">
              email-worker
            </span>
          </p>
          <p className="text-xs text-slate-500 mt-2">
            Consumes email jobs and simulates sending emails (logged to console).
          </p>
        </div>
      </div>

      <div className="border rounded-2xl p-4 bg-white shadow-sm">
        <h2 className="text-lg font-semibold mb-2">Flow</h2>
        <ol className="text-sm text-slate-700 list-decimal list-inside space-y-1">
          <li>Frontend calls <code>/api/notifications/send-email</code>.</li>
          <li>API Gateway forwards to <code>notification-service</code>.</li>
          <li>
            Notification service publishes a message to{" "}
            <code>email_queue</code> in RabbitMQ.
          </li>
          <li>
            <code>email-worker</code> consumes messages and logs them as
            &quot;sent&quot; emails.
          </li>
        </ol>
      </div>
    </div>
  );
}

export default RabbitMetrics;
