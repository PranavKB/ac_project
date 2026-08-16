import { useState } from "react";
import { authAPI } from "../../../api";
import { useNavigate } from "react-router-dom";
import { Card, Form, Input, Button, Alert, Typography, Space } from "antd";
import { MailOutlined } from "@ant-design/icons";

const { Title, Paragraph, Text } = Typography;

export default function RequestRegisterLinkPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const resp = await authAPI.requestRegisterLink(values.email);
      setSuccessMsg(
        resp.message ||
          "Registration link sent to your email! Please check your inbox.",
      );
    } catch (err) {
      const respData = err.response?.data;
      if (
        respData?.errors &&
        typeof respData.errors === "object" &&
        !Array.isArray(respData.errors)
      ) {
        const errorList = Object.values(respData.errors).join(". ");
        setError(errorList || respData.message || "Invalid email address.");
      } else if (respData?.errors) {
        setError(
          Array.isArray(respData.errors)
            ? respData.errors.join(". ")
            : String(respData.errors),
        );
      } else {
        setError(
          respData?.message ||
            "Failed to send registration link. Please check your email and try again.",
        );
      }
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
            Register
          </Title>
          <Paragraph type="secondary" style={{ margin: "4px 0 0" }}>
            Enter your email to receive a registration link
          </Paragraph>
        </div>

        {successMsg ? (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <Alert
              title={<span style={{ fontWeight: 700 }}>Link Sent!</span>}
              description={
                <Space orientation="vertical" style={{ marginTop: "8px" }}>
                  <Text>{successMsg}</Text>
                  <Text type="secondary" style={{ fontSize: "0.85rem" }}>
                    Check your email inbox and click on the registration link to
                    complete your account setup.
                  </Text>
                </Space>
              }
              type="success"
              showIcon
              style={{ borderRadius: "8px" }}
            />
            <Button
              type="default"
              size="large"
              block
              onClick={() => navigate("/login")}
              style={{
                marginTop: "24px",
                borderRadius: "12px",
                fontWeight: 600,
              }}
            >
              Back to Login
            </Button>
          </div>
        ) : (
          <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
            <Form.Item
              name="email"
              label="Email Address"
              rules={[
                { required: true, message: "Please enter your email!" },
                { type: "email", message: "Please enter a valid email!" },
              ]}
            >
              <Input
                size="large"
                prefix={<MailOutlined style={{ color: "#708c91" }} />}
                placeholder="you@example.com"
              />
            </Form.Item>

            {error && (
              <Alert
                title={error}
                type="error"
                showIcon
                style={{ marginBottom: "16px", borderRadius: "8px" }}
              />
            )}

            <Form.Item style={{ marginTop: "24px", marginBottom: "12px" }}>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                block
                loading={loading}
                style={{ borderRadius: "12px", fontWeight: 600 }}
              >
                Send Registration Link
              </Button>
            </Form.Item>
          </Form>
        )}

        {!successMsg && (
          <div
            style={{ textAlign: "center", marginTop: "16px", color: "#708c91" }}
          >
            Already registered?{" "}
            <Button
              type="link"
              onClick={() => navigate("/login")}
              style={{ padding: 0, fontWeight: 600, color: "#00aff5" }}
            >
              Login
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
