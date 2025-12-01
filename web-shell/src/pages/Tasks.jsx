// web-shell/src/pages/Tasks.jsx
import { useEffect, useState } from "react";
import useAuth from "../store/auth";

const API_BASE = "http://localhost:8080/api";

function Tasks() {
  const { token } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [error, setError] = useState("");

  // Helper to call API with token
  async function api(path, method = "GET", body) {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `Request failed: ${res.status}`);
    }

    return res.json();
  }

  // Load tasks on mount
  async function loadTasks() {
    try {
      setLoading(true);
      setError("");
      const data = await api("/tasks");
      setTasks(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Add new task
  async function handleAddTask(e) {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      setError("");
      const created = await api("/tasks", "POST", { title: newTitle.trim() });
      setTasks((prev) => [...prev, created]);
      setNewTitle("");
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  }

  // Toggle completed
  async function handleToggle(task) {
    try {
      setError("");
      const updated = await api(`/tasks/${task.id}`, "PUT", {
        completed: !task.completed,
      });
      setTasks((prev) =>
        prev.map((t) => (t.id === updated.id ? updated : t))
      );
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  }

  // Start editing
  function startEdit(task) {
    setEditingId(task.id);
    setEditingTitle(task.title);
  }

  // Cancel editing
  function cancelEdit() {
    setEditingId(null);
    setEditingTitle("");
  }

  // Save edited title
  async function saveEdit(task) {
    if (!editingTitle.trim()) return;

    try {
      setError("");
      const updated = await api(`/tasks/${task.id}`, "PUT", {
        title: editingTitle.trim(),
      });
      setTasks((prev) =>
        prev.map((t) => (t.id === updated.id ? updated : t))
      );
      setEditingId(null);
      setEditingTitle("");
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  }

  // Delete task
  async function handleDelete(task) {
    if (!window.confirm(`Delete task "${task.title}"?`)) return;

    try {
      setError("");
      await api(`/tasks/${task.id}`, "DELETE");
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Tasks</h1>

      <form onSubmit={handleAddTask} className="flex gap-2 mb-4">
        <input
          className="flex-1 border p-2 rounded"
          placeholder="New task title"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
        />
        <button className="bg-green-600 text-white px-4 py-2 rounded">
          Add
        </button>
      </form>

      {error && (
        <p className="text-red-600 text-sm mb-3">Error: {error}</p>
      )}

      {loading ? (
        <p>Loading tasks...</p>
      ) : tasks.length === 0 ? (
        <p className="text-slate-500">No tasks yet. Add one above!</p>
      ) : (
        <ul className="space-y-2">
          {tasks.map((task) => (
            <li
              key={task.id}
              className="border rounded p-2 flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => handleToggle(task)}
                />
                {editingId === task.id ? (
                  <input
                    className="border p-1 flex-1 rounded"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                  />
                ) : (
                  <span
                    className={
                      "flex-1 " +
                      (task.completed ? "line-through text-slate-500" : "")
                    }
                  >
                    #{task.id} – {task.title}
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                {editingId === task.id ? (
                  <>
                    <button
                      type="button"
                      className="bg-blue-600 text-white text-sm px-2 py-1 rounded"
                      onClick={() => saveEdit(task)}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      className="bg-slate-400 text-white text-sm px-2 py-1 rounded"
                      onClick={cancelEdit}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="bg-yellow-500 text-white text-sm px-2 py-1 rounded"
                    onClick={() => startEdit(task)}
                  >
                    Edit
                  </button>
                )}

                <button
                  type="button"
                  className="bg-red-600 text-white text-sm px-2 py-1 rounded"
                  onClick={() => handleDelete(task)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Tasks;
