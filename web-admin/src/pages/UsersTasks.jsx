// web-admin/src/pages/UsersTasks.jsx
import { useEffect, useState } from "react";
import { api } from "../api";

function UsersTasks() {
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState("");

  async function loadData() {
    try {
      setError("");
      const [usersRes, tasksRes] = await Promise.all([
        api("/admin/users"),
        api("/tasks"),
      ]);
      setUsers(usersRes);
      setTasks(tasksRes);
    } catch (err) {
      console.error("Admin load error:", err);
      setError(err.message || "Failed to load admin data");
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Users & Tasks</h1>
          <p className="admin-page-subtitle">
            Live view of persisted users and tasks from Postgres.
          </p>
        </div>
        <button className="btn btn-secondary" onClick={loadData}>
          Refresh
        </button>
      </div>

      {error && <p className="admin-error">Error loading admin data: {error}</p>}

      <div className="summary-grid">
        <div className="card">
          <h2 className="card-title">Users</h2>
          <p className="card-subtitle">
            Total users: <strong>{users.length}</strong>
          </p>
          <div className="table-wrapper">
            <table className="admin-table">
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
                {users.length === 0 && (
                  <tr>
                    <td colSpan={2} className="empty-cell">
                      No users yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h2 className="card-title">Tasks (current user)</h2>
          <p className="card-subtitle">
            Total tasks: <strong>{tasks.length}</strong>
          </p>
          <div className="table-wrapper">
            <table className="admin-table">
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
                {tasks.length === 0 && (
                  <tr>
                    <td colSpan={3} className="empty-cell">
                      No tasks yet for this user.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="card-subtitle">
            For simplicity, task-service exposes tasks only for the currently
            authenticated user.
          </p>
        </div>
      </div>
    </div>
  );
}

export default UsersTasks;
