// web-admin/src/components/AdminNav.jsx
import { NavLink } from "react-router-dom";

function AdminNav() {
  return (
    <aside className="admin-nav">
      <div className="admin-nav-header">
        <span className="admin-logo">TaskPlatform</span>
        <span className="admin-badge">Admin</span>
      </div>

      <nav className="admin-nav-links">
        <NavLink
          end
          to="/"
          className={({ isActive }) =>
            "admin-nav-link" + (isActive ? " admin-nav-link-active" : "")
          }
        >
          Overview
        </NavLink>
        <NavLink
          to="/users"
          className={({ isActive }) =>
            "admin-nav-link" + (isActive ? " admin-nav-link-active" : "")
          }
        >
          Users & Tasks
        </NavLink>
      </nav>
    </aside>
  );
}

export default AdminNav;
