import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthProvider from "../context/AuthContext/AuthProvider";
import Navbar from "../components/Navbar/Navbar";
import ProtectedRoute from "../components/ProtectedRoute";
import RoleBasedRedirect from "../components/RoleBasedRedirect";

import LoginPage from "../pages/Auth/LoginPage";
import RegisterPage from "../pages/Auth/RegisterPage";
import PassengerDashboard from "../components/PassengerDashboard";
import DriverDashboard from "../components/DriverDashboard";
import SearchRide from "../components/SearchRide";
import RideDetails from "../components/RideDetails";
import StyleGuide from "../pages/StyleGuide/StyleGuide";
import SocketTestPage from "../pages/SocketTest/SocketTestPage";
import Profile from "../components/Profile";
import RequestRegisterLinkPage from "../pages/Auth/RequestRegisterLinkPage";
import AdminLayout from "../pages/Admin/AdminLayout";
import AdminOverview from "../pages/Admin/AdminOverview";
import AdminUsers from "../pages/Admin/AdminUsers";
import AdminRides from "../pages/Admin/AdminRides";
import AdminEnvironmentalAnalytics from "../pages/Admin/AdminEnvironmentalAnalytics";
import AdminReputationAnalytics from "../pages/Admin/AdminReputationAnalytics";
import AdminNotifications from "../pages/Admin/AdminNotifications";
import AdminSettings from "../pages/Admin/AdminSettings";

function AppRoutes() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/style-guide" element={<StyleGuide />} />
          <Route
            path="/request-register-link"
            element={<RequestRegisterLinkPage />}
          />
          <Route path="/socket-test" element={<SocketTestPage />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={["PASSENGER", "DRIVER", "USER"]}>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Root redirect: admins go to /admin, everyone else to /passenger */}
          <Route path="/" element={<RoleBasedRedirect />} />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminOverview />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="rides" element={<AdminRides />} />
            <Route
              path="analytics/environmental"
              element={<AdminEnvironmentalAnalytics />}
            />
            <Route
              path="analytics/reputation"
              element={<AdminReputationAnalytics />}
            />
            <Route path="notifications" element={<AdminNotifications />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          {/* Ride Details View */}
          <Route
            path="/rides/:id"
            element={
              <ProtectedRoute allowedRoles={["PASSENGER", "DRIVER", "USER"]}>
                <RideDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ride/:id"
            element={
              <ProtectedRoute allowedRoles={["PASSENGER", "DRIVER", "USER"]}>
                <RideDetails />
              </ProtectedRoute>
            }
          />

          {/* Passenger Routes */}
          <Route
            path="/passenger"
            element={
              <ProtectedRoute allowedRoles={["PASSENGER", "DRIVER", "USER"]}>
                <PassengerDashboard defaultView="all" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/passenger/search"
            element={
              <ProtectedRoute allowedRoles={["PASSENGER", "DRIVER", "USER"]}>
                <PassengerDashboard defaultView="search" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/passenger/bookings"
            element={
              <ProtectedRoute allowedRoles={["PASSENGER", "DRIVER", "USER"]}>
                <PassengerDashboard defaultView="bookings" />
              </ProtectedRoute>
            }
          />

          {/* Standalone Search Route */}
          <Route
            path="/search"
            element={
              <ProtectedRoute allowedRoles={["PASSENGER", "DRIVER", "USER"]}>
                <SearchRide />
              </ProtectedRoute>
            }
          />

          {/* Driver Routes */}
          <Route
            path="/driver"
            element={
              <ProtectedRoute allowedRoles={["DRIVER", "PASSENGER", "USER"]}>
                <DriverDashboard />
              </ProtectedRoute>
            }
          />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/passenger" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default AppRoutes;
