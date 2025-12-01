// web-admin/src/pages/Overview.jsx
import { useEffect, useState } from "react";
import { api } from "../api";

function Overview() {
  const [usersCount, setUsersCount] = useState(0);
  const [tasksCount, setTasksCount] = useState(0);
  const [completedTasks, setCompletedTasks] = useState(0);
  const [mainError, setMainError] = useState("");

  const [faasStats, setFaasStats] = useState(null);
  const [faasError, setFaasError] = useState("");

  async function loadMain() {
    try {
      setMainError("");
      const [users, tasks] = await Promise.all([
        api("/admin/users"),
        api("/tasks"),
      ]);

      setUsersCount(users.length);
      setTasksCount(tasks.length);
      setCompletedTasks(tasks.filter((t) => t.completed).length);
    } catch (err) {
      console.error("Overview main stats error:", err);
      setMainError(err.message || "Failed to load main stats");
    }
  }

  async function loadFaas() {
    try {
      setFaasError("");
      const faas = await api("/faas/overview-stats");
      setFaasStats(faas || null);
    } catch (err) {
      console.warn("FaaS stats error:", err);
      setFaasStats(null);
      setFaasError(err.message || "FaaS stats unavailable");
    }
  }

  function refreshAll() {
    loadMain();
    loadFaas();
  }

  useEffect(() => {
    refreshAll();
  }, []);

  const completionRate =
    tasksCount > 0 ? Math.round((completedTasks / tasksCount) * 100) : 0;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Platform Overview</h1>
          <p className="admin-page-subtitle">
            Mix of DB-based stats and FaaS-computed analytics.
          </p>
        </div>
        <button className="btn btn-primary" onClick={refreshAll}>
          Refresh
        </button>
      </div>

      {mainError && (
        <p className="admin-error">Error loading main statistics: {mainError}</p>
      )}

      <div className="summary-grid">
        <div className="card">
          <h2 className="card-title">Registered users</h2>
          <p className="card-number">{usersCount}</p>
          <p className="card-subtitle">
            Loaded from <code>users</code> table via auth-service.
          </p>
        </div>

        <div className="card">
          <h2 className="card-title">Tasks (current user)</h2>
          <p className="card-number">{tasksCount}</p>
          <p className="card-subtitle">
            Tasks returned by task-service for the logged-in user.
          </p>
        </div>

        <div className="card">
          <h2 className="card-title">Completion rate</h2>
          <p className="card-number">{completionRate}%</p>
          <p className="card-subtitle">
            {completedTasks} / {tasksCount} completed.
          </p>
        </div>

        <div className="card">
          <h2 className="card-title">FaaS task analytics</h2>

          {faasError && <p className="admin-error">{faasError}</p>}

          {faasStats ? (
            <>
              <p className="card-line">
                Total tasks (FaaS):{" "}
                <strong>{faasStats.totalTasks}</strong>
              </p>
              <p className="card-line">
                Completed: <strong>{faasStats.completedTasks}</strong> | Pending:{" "}
                <strong>{faasStats.pendingTasks}</strong>
              </p>
              <p className="card-line">
                FaaS completion rate:{" "}
                <strong>{faasStats.completionRate}%</strong>
              </p>
              {faasStats.sampleUppercaseTitles &&
                faasStats.sampleUppercaseTitles.length > 0 && (
                  <p className="card-subtitle">
                    Uppercase titles computed by{" "}
                    <code>faas-service</code>:
                    <br />
                    <span className="card-small">
                      {faasStats.sampleUppercaseTitles.join(", ")}
                    </span>
                  </p>
                )}
            </>
          ) : !faasError ? (
            <p className="card-subtitle">Loading FaaS analytics…</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default Overview;
