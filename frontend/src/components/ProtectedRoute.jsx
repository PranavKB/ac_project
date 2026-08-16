import { Navigate } from "react-router-dom";
import useAuth from "../context/AuthContext/useAuth";
import { isTokenExpired } from "../utils/jwtUtils";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, logout } = useAuth();
  const token = localStorage.getItem("token");
  const isExpired = isTokenExpired(token);

  if (!user || !user.data || isExpired) {
    if (isExpired && token) {
      logout();
      return <Navigate to="/login?expired=true" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const userRoles = user.data.roles || [];
    const hasRequiredRole = allowedRoles.some((role) =>
      userRoles.includes(role),
    );

    if (!hasRequiredRole) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
}
