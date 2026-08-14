import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authAPI } from "../../../api";
import useAuth from "../../context/AuthContext/useAuth";
import { Card, Form, Input, Button, Alert, Typography } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";

const { Title, Paragraph } = Typography;

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isExpiredSession = searchParams.get("expired") === "true";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onFinish = async (values) => {
    setLoading(true);
    setError("");

    try {
      const user = await authAPI.login(values.email, values.password);
      login(user);
      if (user?.data?.user?.roles?.includes("ADMIN")) {
        navigate("/admin");
      } else {
        navigate("/driver");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "80vh",
        padding: "0 24px",
      }}
    >
      <Card
        style={{
          width: "100%",
          maxWidth: "400px",
          borderRadius: "16px",
          border: "1px solid #eef0f2",
          boxShadow: "0 8px 24px rgba(0,0,0,0.02)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <Title
            level={2}
            style={{ color: "#054752", fontWeight: 800, margin: 0 }}
          >
            Login
          </Title>
          <Paragraph type="secondary" style={{ margin: "4px 0 0" }}>
            Enter your credentials
          </Paragraph>
        </div>

        {isExpiredSession && !error && (
          <Alert
            message="Session Expired"
            description="Your session has expired. Please log in again."
            type="warning"
            showIcon
            style={{ marginBottom: "16px", borderRadius: "8px" }}
          />
        )}

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            style={{ marginBottom: "16px", borderRadius: "8px" }}
          />
        )}

        <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Please enter your email!" },
              { type: "email", message: "Please enter a valid email!" },
            ]}
          >
            <Input
              size="large"
              prefix={<UserOutlined style={{ color: "#708c91" }} />}
              placeholder="you@example.com"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: "Please enter your password!" }]}
          >
            <Input.Password
              size="large"
              prefix={<LockOutlined style={{ color: "#708c91" }} />}
              placeholder="••••••••"
            />
          </Form.Item>

          <div style={{ textAlign: "right", marginTop: "-8px" }}>
            <Button
              type="link"
              onClick={() => navigate("/forgot-password")}
              style={{ padding: 0, fontWeight: 600, color: "#00aff5" }}
            >
              Forgot password?
            </Button>
          </div>

          <Form.Item style={{ marginTop: "24px", marginBottom: "12px" }}>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={loading}
              style={{ borderRadius: "12px", fontWeight: 600 }}
            >
              Login
            </Button>
          </Form.Item>
        </Form>

        <div
          style={{ textAlign: "center", marginTop: "16px", color: "#708c91" }}
        >
          Don't have an account?{" "}
          <Button
            type="link"
            onClick={() => navigate("/register")}
            style={{ padding: 0, fontWeight: 600, color: "#00aff5" }}
          >
            Register
          </Button>
        </div>
      </Card>
    </div>
  );
}
