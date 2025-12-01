// web-shell/src/api.js
const API_BASE = "http://localhost:8080/api";

export async function api(path, options = {}) {
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${API_BASE}${path}`, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    let data;
    try {
      data = await res.json();
    } catch {
      data = {};
    }
    throw new Error(data.error || `Request failed: ${res.status}`);
  }

  return res.json();
}
