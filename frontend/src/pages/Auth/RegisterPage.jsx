import { useState, useEffect } from "react";
import { authAPI } from "../../../api";
import { useNavigate, useSearchParams } from "react-router-dom";
import RequestRegisterLinkPage from "./RequestRegisterLinkPage";
import {
  Card,
  Form,
  Input,
  Button,
  Checkbox,
  Alert,
  Spin,
  Typography,
} from "antd";
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  LockOutlined,
} from "@ant-design/icons";

const { Title, Paragraph } = Typography;

// --- Helper Sub-components to keep function size under 250 lines ---

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
      <Spin size="large" tip="Verifying registration link..." />
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

function RegisteredSuccessView({ email, onProceed }) {
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
          Registered Successfully!
        </Title>
        <Paragraph type="secondary" style={{ margin: "20px 0" }}>
          Your account has been created. A confirmation email has been sent to{" "}
          <strong>{email}</strong>.
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

export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const emailParam = searchParams.get("email");

  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [verifyingToken, setVerifyingToken] = useState(!!token);
  const [tokenValid, setTokenValid] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [registeredSuccess, setRegisteredSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVerifyingToken(true);
      authAPI
        .verifyToken(token)
        .then((res) => {
          const emailFromToken = res.data || emailParam || "";
          form.setFieldsValue({ email: emailFromToken });
          setTokenValid(true);
          setError("");
        })
        .catch((err) => {
          setTokenValid(false);
          const respData = err.response?.data;
          setError(
            respData?.message ||
              "Registration link is invalid or has expired. Please request a new link.",
          );
        })
        .finally(() => {
          setVerifyingToken(false);
        });
    }
  }, [token, emailParam, form]);

  if (!token) {
    return <RequestRegisterLinkPage />;
  }

  const handleValidationErrors = (respData) => {
    if (
      respData?.errors &&
      typeof respData.errors === "object" &&
      !Array.isArray(respData.errors)
    ) {
      setFieldErrors(respData.errors);
      const errorList = Object.values(respData.errors).join(". ");
      setError(errorList || respData.message || "Validation failed.");
    } else if (respData?.errors && Array.isArray(respData.errors)) {
      setError(respData.errors.join(". "));
    } else {
      setError(
        String(respData?.errors || respData?.message || "Registration failed."),
      );
    }
  };

  const onFinish = async (values) => {
    setLoading(true);
    setError("");
    setFieldErrors({});

    try {
      await authAPI.register(
        values.name,
        values.email,
        values.phone,
        values.password,
        values.roles,
        token,
      );
      setRegisteredSuccess(true);
    } catch (err) {
      handleValidationErrors(err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  if (verifyingToken) return <VerifyingTokenView />;
  if (!tokenValid)
    return (
      <TokenInvalidView error={error} onReset={() => navigate("/register")} />
    );
  if (registeredSuccess)
    return (
      <RegisteredSuccessView
        email={form.getFieldValue("email")}
        onProceed={() => navigate("/login")}
      />
    );

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "80vh",
        padding: "30px 24px",
      }}
    >
      <Card
        style={{
          width: "100%",
          maxWidth: "480px",
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
            Complete Registration
          </Title>
          <Paragraph type="secondary" style={{ margin: "4px 0 0" }}>
            Fill out your details to create your account
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
          initialValues={{ roles: ["DRIVER", "PASSENGER"] }}
        >
          <Form.Item
            name="name"
            label="Full Name"
            rules={[{ required: true, message: "Please enter your name!" }]}
            validateStatus={fieldErrors.name ? "error" : ""}
            help={fieldErrors.name}
          >
            <Input
              size="large"
              prefix={<UserOutlined style={{ color: "#708c91" }} />}
              placeholder="John Doe"
            />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email Address"
            rules={[{ required: true }]}
            validateStatus={fieldErrors.email ? "error" : ""}
            help={fieldErrors.email}
          >
            <Input
              size="large"
              prefix={<MailOutlined style={{ color: "#708c91" }} />}
              readOnly
              style={{ backgroundColor: "#f5f5f5", cursor: "not-allowed" }}
            />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Phone"
            rules={[
              { required: true, message: "Please enter your phone number!" },
            ]}
            validateStatus={fieldErrors.phone ? "error" : ""}
            help={fieldErrors.phone}
          >
            <Input
              size="large"
              prefix={<PhoneOutlined style={{ color: "#708c91" }} />}
              placeholder="10-digit mobile number"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: "Please choose a password!" }]}
            validateStatus={fieldErrors.password ? "error" : ""}
            help={fieldErrors.password}
          >
            <Input.Password
              size="large"
              prefix={<LockOutlined style={{ color: "#708c91" }} />}
              placeholder="Choose a secure password"
            />
          </Form.Item>

          <Form.Item
            name="roles"
            label="Roles"
            rules={[
              { required: true, message: "Please choose at least one role!" },
            ]}
            validateStatus={fieldErrors.roles ? "error" : ""}
            help={fieldErrors.roles}
          >
            <Checkbox.Group style={{ width: "100%" }}>
              <Checkbox value="DRIVER" style={{ marginRight: "24px" }}>
                Driver
              </Checkbox>
              <Checkbox value="PASSENGER">Passenger</Checkbox>
            </Checkbox.Group>
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
              Register Account
            </Button>
          </Form.Item>
        </Form>

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
      </Card>
    </div>
  );
}
