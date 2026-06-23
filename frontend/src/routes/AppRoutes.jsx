import { BrowserRouter, Routes, Route } from "react-router-dom";

import StyleGuide from "../pages/StyleGuide/StyleGuide";
import DriverDashboard from "../components/DriverDashboard";

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
        <Route path="/driver" element={<DriverDashboard />} />
        <Route path="/style-guide" element={<StyleGuide />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
