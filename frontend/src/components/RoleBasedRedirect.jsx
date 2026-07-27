import { Navigate } from "react-router-dom";
import useAuth from "../context/AuthContext/useAuth";

export default function RoleBasedRedirect() {
  const { user } = useAuth();

  if (user?.data?.roles?.includes("ADMIN")) {
    return <Navigate to="/admin" replace />;
  }

  return <Navigate to="/passenger" replace />;
}
