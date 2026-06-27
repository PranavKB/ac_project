import { useNavigate, useLocation } from "react-router-dom";
import useAuth from "../../context/AuthContext/useAuth";
import "./Navbar.scss";

export default function Navbar() {
  const { user, activeRole, switchRole, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (location.pathname === "/login" || location.pathname === "/register") {
    return null;
  }

  if (!user || !user.data) {
    return null; // Don't show navbar if not logged in
  }

  const { name, totalCarbonSavedKg, reputationProfile, roles } = user.data;
  const rating = reputationProfile?.trustScore || 0;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleRoleChange = (e) => {
    const newRole = e.target.value;
    switchRole(newRole);
    if (newRole === "DRIVER") {
      navigate("/driver");
    } else if (newRole === "PASSENGER") {
      navigate("/passenger");
    } else if (newRole === "ADMIN") {
      navigate("/admin");
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <h1 className="brand">Carpool</h1>
        <div className="role-badge">
          {activeRole
            ? activeRole.charAt(0).toUpperCase() +
              activeRole.slice(1).toLowerCase()
            : "User"}
        </div>
      </div>

      <div className="navbar-center">
        <div className="stat">
          <span className="stat-value">{totalCarbonSavedKg} Kg</span>
          <span className="stat-label">CO2 saved</span>
        </div>
        <div className="stat">
          <span className="stat-value">{rating}/100</span>
          <span className="stat-label">Rating</span>
        </div>
      </div>

      <div className="navbar-right">
        <span className="greeting">Hello, {name}</span>

        {roles && roles.length > 0 && (
          <select
            className="role-dropdown"
            value={activeRole || ""}
            onChange={handleRoleChange}
          >
            {roles.map((role) => (
              <option key={role} value={role}>
                {role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        )}

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}
