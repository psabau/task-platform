// web-shell/src/components/Navbar.jsx
import { Link } from "react-router-dom";
import useAuth from "../store/auth";

function Navbar() {
  const { logout } = useAuth();

  return (
    <nav className="bg-slate-900 text-white px-6 py-3 flex items-center justify-between">
      <div className="flex gap-4 items-center">
        <span className="font-bold text-lg">Task Platform</span>
        <Link to="/" className="hover:underline">
          Dashboard
        </Link>
        <Link to="/tasks" className="hover:underline">
          Tasks
        </Link>
        <Link to="/notifications" className="hover:underline">
          Notifications
        </Link>
      </div>

      <button
        onClick={logout}
        className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-sm"
      >
        Logout
      </button>
    </nav>
  );
}

export default Navbar;
