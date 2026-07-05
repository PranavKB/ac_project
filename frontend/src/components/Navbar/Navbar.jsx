import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import useAuth from "../../context/AuthContext/useAuth";
import "./Navbar.scss";
import { LeafIcon, StarIcon, SwitchIcon, SunIcon, MoonIcon } from "../icons";

export default function Navbar() {
  const { user, activeRole, switchRole, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "dark";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  if (location.pathname === "/login" || location.pathname === "/register") {
    return null;
  }

  if (!user || !user.data) {
    return null; // Don't show navbar if not logged in
  }

  const { name, totalCarbonSavedKg, reputationProfile, roles } = user.data;
  const rating = reputationProfile?.trustScore || 0;

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

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

  const isPassenger = activeRole === "PASSENGER";
  const isDriver = activeRole === "DRIVER";
  const isDarkTheme = isPassenger || isDriver;

  const handleRoleToggle = () => {
    const nextRole = activeRole === "PASSENGER" ? "DRIVER" : "PASSENGER";
    switchRole(nextRole);
    if (nextRole === "DRIVER") {
      navigate("/driver");
    } else {
      navigate("/passenger");
    }
  };

  return (
    <nav className={`navbar ${isDarkTheme ? "passenger-theme" : ""}`}>
      <div className="navbar-left">
        <h1 className="brand">Carpool</h1>
        <div className="role-badge">
          {isPassenger
            ? "PASSENGER VIEW"
            : isDriver
              ? "DRIVER VIEW"
              : activeRole
                ? activeRole.charAt(0).toUpperCase() +
                  activeRole.slice(1).toLowerCase()
                : "User"}
        </div>
      </div>

      {!isDarkTheme && (
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
      )}

      <div className="navbar-right">
        {isDarkTheme && (
          <div className="passenger-nav-badges">
            <div className="co2-badge">
              <LeafIcon />
              <span>
                {totalCarbonSavedKg ? totalCarbonSavedKg.toFixed(1) : "0.0"} KG
                CO₂ SAVED
              </span>
            </div>
            <div className="rating-badge">
              <StarIcon />
              <span>{rating ? rating.toFixed(1) : "80.0"}/100</span>
            </div>
          </div>
        )}

        {isDarkTheme && (
          <button
            className="theme-toggle-btn"
            onClick={toggleTheme}
            title="Toggle light/dark mode"
          >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>
        )}

        <span className="greeting">
          Hello, <strong>{name}</strong>
        </span>

        {isDarkTheme ? (
          <button className="switch-role-btn" onClick={handleRoleToggle}>
            <SwitchIcon />
            {isPassenger ? "Switch to Driver" : "Switch to Passenger"}
          </button>
        ) : (
          roles &&
          roles.length > 0 && (
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
          )
        )}

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}
