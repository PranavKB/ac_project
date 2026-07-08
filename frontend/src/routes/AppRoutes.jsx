import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import StyleGuide from "../pages/StyleGuide/StyleGuide";
import DriverDashboard from "../components/DriverDashboard";
import PassengerDashboard from "../components/PassengerDashboard";
import LoginPage from "../pages/Auth/LoginPage";
import RegisterPage from "../pages/Auth/RegisterPage";
import ProtectedRoute from "../components/ProtectedRoute";
import Navbar from "../components/Navbar/Navbar";
import useAuth from "../context/AuthContext/useAuth";

function RootRedirect() {
  const { user, activeRole } = useAuth();

  if (!user || !user.data) {
    return <Navigate to="/login" replace />;
  }

  if (activeRole) {
    return <Navigate to={`/${activeRole.toLowerCase()}`} replace />;
  }

  return <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/driver"
          element={
            <ProtectedRoute allowedRoles={["DRIVER"]}>
              <DriverDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/passenger"
          element={
            <ProtectedRoute allowedRoles={["PASSENGER"]}>
              <PassengerDashboard defaultView="all" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/passenger/search"
          element={
            <ProtectedRoute allowedRoles={["PASSENGER"]}>
              <PassengerDashboard defaultView="search" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/passenger/bookings"
          element={
            <ProtectedRoute allowedRoles={["PASSENGER"]}>
              <PassengerDashboard defaultView="bookings" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <div className="admin-temp-panel">
                <h2>Admin Dashboard</h2>
                <p>Welcome, Administrator.</p>
              </div>
            </ProtectedRoute>
          }
        />
        <Route path="/style-guide" element={<StyleGuide />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
