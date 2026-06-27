import { Navigate } from "react-router-dom";
import useAuth from "../context/AuthContext/useAuth";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();

  if (!user || !user.data) {
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
