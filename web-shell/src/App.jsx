import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Tasks from "./pages/Tasks";
import Notifications from "./pages/Notifications";
import useAuth from "./store/auth";
import Register from "./pages/Register";
import useNotifications from "./store/notifications";
import { useEffect } from "react";


export default function App() {
  const { token } = useAuth();

  const { init: initNotifications } = useNotifications();

  useEffect(() => {
    initNotifications();
  }, [initNotifications]);

  return (
    <BrowserRouter>
      {token && <Navbar />}

      <Routes>
        <Route path="/" element={token ? <Dashboard /> : <Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/tasks"
          element={token ? <Tasks /> : <Navigate to="/" />}
        />

        <Route
          path="/notifications"
          element={token ? <Notifications /> : <Navigate to="/" />}
        />
      </Routes>
    </BrowserRouter>
  );
}
