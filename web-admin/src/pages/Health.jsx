// web-admin/src/pages/Health.jsx
import { useEffect, useState } from "react";

function Health() {
  const [status, setStatus] = useState("checking"); // checking | ok | error
  const [message, setMessage] = useState("");

  async function checkHealth() {
    try {
      setStatus("checking");
      setMessage("");

      const res = await fetch("/health"); // Nginx /health endpoint
      const text = await res.text();

      if (res.ok) {
        setStatus("ok");
        setMessage(text || "OK");
      } else {
        setStatus("error");
        setMessage(text || `HTTP ${res.status}`);
      }
    } catch (err) {
      setStatus("error");
      setMessage(err.message);
    }
  }

  useEffect(() => {
    checkHealth();
  }, []);

  const pillClasses =
    "inline-flex items-center gap-1 text-sm px-3 py-1 rounded-full " +
    (status === "ok"
      ? "bg-green-100 text-green-800"
      : status === "checking"
      ? "bg-yellow-100 text-yellow-800"
      : "bg-red-100 text-red-800");

  const dotClasses =
    "w-2 h-2 rounded-full " +
    (status === "ok"
      ? "bg-green-500"
      : status === "checking"
      ? "bg-yellow-500"
      : "bg-red-500");

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold">System Health</h1>
          <p className="text-sm text-slate-500 mt-1">
            Simple health check endpoint behind Nginx.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className={pillClasses}>
            <span className={dotClasses} />
            {status === "ok"
              ? "All good"
              : status === "checking"
              ? "Checking..."
              : "Error"}
          </span>

          <button
            onClick={checkHealth}
            className="text-sm px-3 py-1 rounded border border-slate-300 hover:bg-slate-100"
          >
            Re-check
          </button>
        </div>
      </div>

      <div className="border rounded-2xl bg-white shadow-sm p-4">
        <h2 className="text-lg font-semibold mb-2">Nginx /health endpoint</h2>
        <p className="text-sm text-slate-600 mb-2">
          This calls <code>/health</code> on the main gateway, which returns a
          plain <code>OK</code> if the reverse proxy is up.
        </p>
        <span className="font-semibold text-sm">Response:</span>
        <pre className="mt-2 text-sm bg-slate-50 p-2 rounded overflow-x-auto">
          {message || "(no body)"}
        </pre>
      </div>
    </div>
  );
}

export default Health;
