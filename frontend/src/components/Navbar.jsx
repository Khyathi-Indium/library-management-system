import { NavLink, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

function linkStyle({ isActive }) {
  return {
    color: isActive ? "#111827" : "#4b5563",
    textDecoration: "none",
    fontWeight: isActive ? 700 : 500,
  };
}

export default function Navbar() {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, user, logout } = useAuth();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 20px",
        borderBottom: "1px solid #e5e7eb",
        backgroundColor: "#f9fafb",
      }}
    >
      <strong>Library System</strong>

      <nav style={{ display: "flex", gap: 16, alignItems: "center" }}>
        {isAuthenticated ? (
          <>
            <NavLink to="/dashboard" style={linkStyle}>
              Dashboard
            </NavLink>
            <NavLink to="/books" style={linkStyle}>
              Books
            </NavLink>
            <NavLink to="/borrowed" style={linkStyle}>
              Borrowed
            </NavLink>
            {isAdmin && (
              <NavLink to="/admin/books" style={linkStyle}>
                Admin Books
              </NavLink>
            )}
            <span style={{ color: "#6b7280" }}>
              {user?.name} ({user?.role})
            </span>
            <button type="button" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login" style={linkStyle}>
              Login
            </NavLink>
            <NavLink to="/register" style={linkStyle}>
              Register
            </NavLink>
          </>
        )}
      </nav>
    </header>
  );
}
