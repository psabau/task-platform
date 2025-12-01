// web-admin/src/api.js
const BASE_URL = "/api";

export async function api(path, options = {}) {
  const method = options.method || "GET";
  const body = options.body ? JSON.stringify(options.body) : undefined;

  const token = window.localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(BASE_URL + path, {
    method,
    headers,
    body,
  });

  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }

  if (res.status === 204) return null;
  return await res.json();
}
