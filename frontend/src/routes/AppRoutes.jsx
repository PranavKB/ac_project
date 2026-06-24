import { BrowserRouter, Routes, Route } from "react-router-dom";

import StyleGuide from "../pages/StyleGuide/StyleGuide";
import DriverDashboard from "../components/DriverDashboard";
import LoginPage from "../pages/Auth/LoginPage";
import RegisterPage from "../pages/Auth/RegisterPage";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <>
              <p>Welcome to the Community Carpooling App!</p>
            </>
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/driver" element={<DriverDashboard />} />
        <Route path="/style-guide" element={<StyleGuide />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
