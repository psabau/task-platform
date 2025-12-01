// web-admin/src/pages/KafkaMetrics.jsx
function KafkaMetrics() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Kafka – Task Events</h1>
      <p className="text-sm text-slate-500 mb-6">
        Kafka is used for event streaming of task changes emitted by the Task
        Service.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="border rounded-2xl p-4 bg-white shadow-sm">
          <h2 className="text-lg font-semibold mb-2">Topic</h2>
          <p className="text-sm text-slate-700">
            <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">
              task-events
            </span>
          </p>
          <p className="text-xs text-slate-500 mt-2">
            Produced by <strong>task-service</strong> using kafkajs.
          </p>
        </div>

        <div className="border rounded-2xl p-4 bg-white shadow-sm">
          <h2 className="text-lg font-semibold mb-2">Consumer</h2>
          <p className="text-sm text-slate-700">
            <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">
              task-events-consumer
            </span>
          </p>
          <p className="text-xs text-slate-500 mt-2">
            Logs every event received (created / updated / deleted).
          </p>
        </div>
      </div>

      <div className="border rounded-2xl p-4 bg-white shadow-sm">
        <h2 className="text-lg font-semibold mb-2">Event Types</h2>
        <ul className="text-sm text-slate-700 space-y-1">
          <li>• <code>task_created</code> – when a new task is created</li>
          <li>• <code>task_updated</code> – when a task is edited or completed</li>
          <li>• <code>task_deleted</code> – when a task is removed</li>
        </ul>
        <p className="text-xs text-slate-500 mt-3">
          These events are good to mention in your documentation as an example
          of event streaming between microservices.
        </p>
      </div>
    </div>
  );
}

export default KafkaMetrics;
