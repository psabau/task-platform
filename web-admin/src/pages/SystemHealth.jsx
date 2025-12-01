import { useEffect, useState } from "react";

function SystemHealth() {
  const [status, setStatus] = useState("Loading...");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("http://localhost:8080/health");
        if (!res.ok) throw new Error("Failed");
        const text = await res.text();
        setStatus(text);
      } catch (err) {
        setStatus("Error contacting health endpoint");
      }
    }
    load();
  }, []);

  return (
    <div>
      <h1 style={{ fontSize: "1.75rem", fontWeight: "bold", marginBottom: "0.75rem" }}>
        System Health
      </h1>
      <p>Health endpoint response:</p>
      <pre
        style={{
          marginTop: "0.75rem",
          background: "#f3f4f6",
          padding: "0.75rem",
          borderRadius: "0.5rem",
        }}
      >
        {status}
      </pre>
    </div>
  );
}

export default SystemHealth;
