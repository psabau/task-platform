// web-admin/src/pages/Users.jsx
import { useEffect, useState } from "react";
import { api } from "../api";

function UsersPage() {
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadData() {
    try {
      setLoading(true);
      setError("");
      const [usersData, tasksData] = await Promise.all([
        api("/admin/users"),
        api("/tasks"),
      ]);
      setUsers(usersData);
      setTasks(tasksData);
    } catch (err) {
      console.error("Admin load error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const totalUsers = users.length;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Users &amp; Tasks</h1>
          <p className="admin-page-subtitle">
            Live view of persisted users and tasks from Postgres.
          </p>
        </div>
        <button className="btn btn-primary" onClick={loadData}>
          Refresh
        </button>
      </div>

      {/* Summary */}
      <div className="summary-grid">
        <div className="card">
          <h2 className="card-title">Total users</h2>
          <p style={{ fontSize: "1.6rem", fontWeight: 600, margin: "4px 0" }}>
            {totalUsers}
          </p>
        </div>
        <div className="card">
          <h2 className="card-title">Total tasks</h2>
          <p style={{ fontSize: "1.6rem", fontWeight: 600, margin: "4px 0" }}>
            {totalTasks}
          </p>
        </div>
        <div className="card">
          <h2 className="card-title">Completed</h2>
          <p style={{ fontSize: "1.6rem", fontWeight: 600, margin: "4px 0" }}>
            {completedTasks}
            <span className="text-muted">
              {" "}
              / {totalTasks || 0} tasks
            </span>
          </p>
        </div>
      </div>

      {error && (
        <p className="text-muted" style={{ color: "#b91c1c", marginBottom: 12 }}>
          Error loading admin data: {error}
        </p>
      )}

      {loading ? (
        <p>Loading data...</p>
      ) : (
        <>
          {/* Users table */}
          <div style={{ marginBottom: 24 }}>
            <h2 className="card-title" style={{ marginBottom: 8 }}>
              Users (Postgres)
            </h2>
            {users.length === 0 ? (
              <p className="text-muted">
                No users found. Register accounts from the main app.
              </p>
            ) : (
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td>{u.id}</td>
                        <td>{u.email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Tasks table */}
          <div>
            <h2 className="card-title" style={{ marginBottom: 8 }}>
              Tasks (Postgres)
            </h2>
            {tasks.length === 0 ? (
              <p className="text-muted">
                No tasks found. Create tasks in the main app.
              </p>
            ) : (
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Title</th>
                      <th>Completed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((t) => (
                      <tr key={t.id}>
                        <td>{t.id}</td>
                        <td>{t.title}</td>
                        <td>{t.completed ? "✅" : "❌"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default UsersPage;
