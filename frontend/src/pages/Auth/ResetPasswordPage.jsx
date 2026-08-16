import { useState, useEffect } from "react";
import { authAPI } from "../../../api";
import { useNavigate, useSearchParams } from "react-router-dom";
import ForgotPasswordPage from "./ForgotPasswordPage";
import { Card, Form, Input, Button, Alert, Spin, Typography } from "antd";
import { LockOutlined } from "@ant-design/icons";

const { Title, Paragraph } = Typography;

function VerifyingTokenView() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "80vh",
      }}
    >
      <Spin size="large" tip="Verifying reset link..." />
    </div>
  );
}

function TokenInvalidView({ error, onReset }) {
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
          maxWidth: "450px",
          borderRadius: "16px",
          textAlign: "center",
        }}
      >
        <Alert
          title={error}
          type="error"
          showIcon
          style={{ marginBottom: "20px", borderRadius: "8px" }}
        />
        <Button
          type="primary"
          size="large"
          block
          onClick={onReset}
          style={{ borderRadius: "12px", fontWeight: 600 }}
        >
          Request New Link
        </Button>
      </Card>
    </div>
  );
}

function ResetSuccessView({ onProceed }) {
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
          maxWidth: "450px",
          borderRadius: "16px",
          textAlign: "center",
          padding: "24px",
        }}
      >
        <Title level={2} style={{ color: "#52c41a", fontWeight: 800 }}>
          Password Reset!
        </Title>
        <Paragraph type="secondary" style={{ margin: "20px 0" }}>
          Your password has been changed successfully. You can now log in with
          your new password.
        </Paragraph>
        <Button
          type="primary"
          size="large"
          block
          onClick={onProceed}
          style={{ borderRadius: "12px", fontWeight: 600 }}
        >
          Proceed to Login
        </Button>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [verifyingToken, setVerifyingToken] = useState(!!token);
  const [tokenValid, setTokenValid] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVerifyingToken(true);
      authAPI
        .verifyResetToken(token)
        .then((res) => {
          setEmail(res.data || "");
          setTokenValid(true);
          setError("");
        })
        .catch((err) => {
          setTokenValid(false);
          const respData = err.response?.data;
          setError(
            respData?.message ||
              "Password reset link is invalid or has expired. Please request a new link.",
          );
        })
        .finally(() => {
          setVerifyingToken(false);
        });
    }
  }, [token]);

  if (!token) {
    return <ForgotPasswordPage />;
  }

  const onFinish = async (values) => {
    setLoading(true);
    setError("");

    try {
      await authAPI.resetPassword(token, values.newPassword);
      setResetSuccess(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to reset password. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (verifyingToken) return <VerifyingTokenView />;
  if (!tokenValid)
    return (
      <TokenInvalidView
        error={error}
        onReset={() => navigate("/forgot-password")}
      />
    );
  if (resetSuccess)
    return <ResetSuccessView onProceed={() => navigate("/login")} />;

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
            Reset Password
          </Title>
          <Paragraph type="secondary" style={{ margin: "4px 0 0" }}>
            Choose a new password for <strong>{email}</strong>
          </Paragraph>
        </div>

        {error && (
          <Alert
            title={error}
            type="error"
            showIcon
            style={{ marginBottom: "16px", borderRadius: "8px" }}
          />
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          requiredMark={false}
        >
          <Form.Item
            name="newPassword"
            label="New Password"
            rules={[
              { required: true, message: "Please enter a new password!" },
              {
                min: 6,
                message: "Password must be at least 6 characters long",
              },
            ]}
          >
            <Input.Password
              size="large"
              prefix={<LockOutlined style={{ color: "#708c91" }} />}
              placeholder="Choose a secure password"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Confirm New Password"
            dependencies={["newPassword"]}
            rules={[
              { required: true, message: "Please confirm your password!" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("newPassword") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Passwords do not match"));
                },
              }),
            ]}
          >
            <Input.Password
              size="large"
              prefix={<LockOutlined style={{ color: "#708c91" }} />}
              placeholder="Re-enter your new password"
            />
          </Form.Item>

          <Form.Item style={{ marginTop: "24px", marginBottom: "12px" }}>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={loading}
              style={{ borderRadius: "12px", fontWeight: 600 }}
            >
              Reset Password
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
