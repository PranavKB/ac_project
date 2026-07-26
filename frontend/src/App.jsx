import AuthProvider from "./context/AuthContext/AuthProvider";
import AppRoutes from "./routes/AppRoutes";
import { ConfigProvider } from "antd";

export default function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#00aff5",
          borderRadius: 16,
          fontFamily:
            "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        },
      }}
    >
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ConfigProvider>
  );
}
