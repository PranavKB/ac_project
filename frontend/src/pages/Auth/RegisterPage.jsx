import { useState, useEffect } from "react";
import { authAPI } from "../../../api";
import "./Register.scss";
import { useNavigate, useSearchParams } from "react-router-dom";
import RequestRegisterLinkPage from "./RequestRegisterLinkPage";

const initialState = {
  name: "",
  email: "",
  phone: "",
  password: "",
  roles: ["DRIVER", "PASSENGER"],
};

/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable max-lines-per-function */
export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const emailParam = searchParams.get("email");

  const [formData, setFormData] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [verifyingToken, setVerifyingToken] = useState(!!token);
  const [tokenValid, setTokenValid] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [registeredSuccess, setRegisteredSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      setVerifyingToken(true);
      authAPI
        .verifyToken(token)
        .then((res) => {
          const emailFromToken = res.data || emailParam || "";
          setFormData((prev) => ({ ...prev, email: emailFromToken }));
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
  }, [token, emailParam]);

  // If no token is provided in the URL, render the Request Registration Link flow
  if (!token) {
    return <RequestRegisterLinkPage />;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleRoleChange = (role) => {
    setFormData((prev) => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.length > 1
          ? prev.roles.filter((r) => r !== role)
          : prev.roles
        : [...prev.roles, role],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");
    setFieldErrors({});

    try {
      const { name, email, phone, password, roles } = formData;

      await authAPI.register(name, email, phone, password, roles, token);

      setRegisteredSuccess(true);
    } catch (err) {
      const respData = err.response?.data;
      if (
        respData?.errors &&
        typeof respData.errors === "object" &&
        !Array.isArray(respData.errors)
      ) {
        setFieldErrors(respData.errors);
        const errorList = Object.values(respData.errors).join(". ");
        setError(
          errorList ||
            respData.message ||
            "Validation failed. Please fix the highlighted fields.",
        );
      } else if (respData?.errors && Array.isArray(respData.errors)) {
        setError(respData.errors.join(". "));
      } else if (respData?.errors) {
        setError(String(respData.errors));
      } else {
        setError(
          respData?.message ||
            "Registration failed. Please check your details and try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  if (verifyingToken) {
    return (
      <div className="register-container">
        <div
          className="register-card"
          style={{ textAlign: "center", padding: "40px" }}
        >
          <h3>Verifying your registration link...</h3>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="register-container">
        <div className="register-card" style={{ textAlign: "center" }}>
          <div
            className="error-box"
            style={{ padding: "16px", marginBottom: "20px" }}
          >
            {error}
          </div>
          <button
            className="register-btn"
            onClick={() => navigate("/register")}
          >
            Request New Link
          </button>
        </div>
      </div>
    );
  }

  if (registeredSuccess) {
    return (
      <div className="register-container">
        <div className="register-card" style={{ textAlign: "center" }}>
          <div className="register-header">
            <h2 style={{ color: "#2e7d32" }}>Registered Successfully!</h2>
          </div>
          <p style={{ margin: "20px 0", color: "#444" }}>
            Your account has been created. A confirmation email has been sent to{" "}
            <strong>{formData.email}</strong>.
          </p>
          <button className="register-btn" onClick={() => navigate("/login")}>
            Proceed to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <h2>Complete Registration</h2>
          <p>Fill out your details to create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="name"
              className="input-field"
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
              required
            />
            {fieldErrors.name && (
              <span className="field-error">{fieldErrors.name}</span>
            )}
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              className="input-field"
              value={formData.email}
              readOnly
              style={{ backgroundColor: "#eef2f7", cursor: "not-allowed" }}
            />
            {fieldErrors.email && (
              <span className="field-error">{fieldErrors.email}</span>
            )}
          </div>

          <div className="form-group">
            <label>Phone</label>
            <input
              type="tel"
              name="phone"
              className="input-field"
              value={formData.phone}
              onChange={handleChange}
              placeholder="10-digit mobile number"
              required
            />
            {fieldErrors.phone && (
              <span className="field-error">{fieldErrors.phone}</span>
            )}
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              className="input-field"
              value={formData.password}
              onChange={handleChange}
              required
            />
            {fieldErrors.password && (
              <span className="field-error">{fieldErrors.password}</span>
            )}
          </div>

          <div className="role-section">
            <label>Roles</label>
            <div className="role-options">
              <label>
                <input
                  type="checkbox"
                  checked={formData.roles.includes("DRIVER")}
                  onChange={() => handleRoleChange("DRIVER")}
                />
                Driver
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={formData.roles.includes("PASSENGER")}
                  onChange={() => handleRoleChange("PASSENGER")}
                />
                Passenger
              </label>
            </div>
            {fieldErrors.roles && (
              <span className="field-error">{fieldErrors.roles}</span>
            )}
          </div>

          {error && <div className="error-box">{error}</div>}

          <button type="submit" className="register-btn" disabled={loading}>
            {loading ? "Registering..." : "Register Account"}
          </button>
        </form>

        <div className="register-footer">
          Already registered?{" "}
          <span onClick={() => navigate("/login")}>Login</span>
        </div>
      </div>
    </div>
  );
}
