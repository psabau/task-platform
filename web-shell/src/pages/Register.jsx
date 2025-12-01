// web-shell/src/pages/Register.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:8080/api";

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [status, setStatus] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("");

    if (!email || !password || !password2) {
      setStatus("All fields are required.");
      return;
    }
    if (password !== password2) {
      setStatus("Passwords do not match.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus(data.error || "Registration failed");
        return;
      }

      setStatus("Registration successful! Redirecting to login...");
      setTimeout(() => navigate("/"), 1200);
    } catch (err) {
      console.error(err);
      setStatus("Network error");
    }
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-3xl font-bold mb-4">Register</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          className="border p-2 rounded"
          type="email"
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="border p-2 rounded"
          type="password"
          placeholder="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <input
          className="border p-2 rounded"
          type="password"
          placeholder="confirm password"
          value={password2}
          onChange={(e) => setPassword2(e.target.value)}
        />

        <button className="bg-green-600 text-white py-2 rounded">
          Create account
        </button>
      </form>

      {status && <p className="mt-3 text-sm">{status}</p>}

      <p className="mt-4 text-sm">
        Already have an account?{" "}
        <Link to="/" className="text-blue-600 underline">
          Back to Login
        </Link>
      </p>
    </div>
  );
}

export default Register;
