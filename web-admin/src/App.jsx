// web-admin/src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import AdminNav from "./components/AdminNav.jsx";
import Overview from "./pages/Overview.jsx";
import UsersTasks from "./pages/UsersTasks.jsx";
import AdminNotifications from "./pages/AdminNotifications.jsx";

function App() {
  return (
    <div className="admin-layout">
      <AdminNav />
      <main className="admin-main">
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/users" element={<UsersTasks />} />
          <Route path="/events" element={<AdminNotifications />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
