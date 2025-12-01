import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import useAuth from "../store/auth";

const API_BASE = "http://localhost:8080/api";

function Login() {
  const [email, setEmail] = useState("user1@test.com");
  const [password, setPassword] = useState("123456");
  const [status, setStatus] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth(); // <- from zustand

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("Logging in...");

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus(data.error || "Login failed");
        return;
      }

      // ✅ Save token in global store + localStorage
      login(data.token);

      setStatus("Login successful!");
      // ✅ Navigate to dashboard, no manual refresh needed
      navigate("/");
    } catch (err) {
      console.error(err);
      setStatus("Network error");
    }
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-3xl font-bold mb-4">Login</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          className="border p-2 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email"
        />
        <input
          className="border p-2 rounded"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="password"
        />
        <button className="bg-blue-600 text-white py-2 rounded">
          Login
        </button>
      </form>

      {status && <p className="mt-3 text-sm">{status}</p>}

      <p className="mt-4 text-sm">
        Don't have an account?{" "}
        <Link to="/register" className="text-blue-600 underline">
          Register
        </Link>
      </p>
    </div>
  );
}

export default Login;
