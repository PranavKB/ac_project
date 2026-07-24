import { useState } from "react";
import { authAPI } from "../../../api";
import "./Register.scss";
import { useNavigate } from "react-router-dom";

export default function RequestRegisterLinkPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const resp = await authAPI.requestRegisterLink(email);
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
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <h2>Register</h2>
          <p>Enter your email to receive a registration link</p>
        </div>

        {successMsg ? (
          <div
            className="success-box"
            style={{
              background: "#e8f5e9",
              color: "#2e7d32",
              padding: "16px",
              borderRadius: "6px",
              textAlign: "center",
              margin: "16px 0",
            }}
          >
            <h3>Link Sent!</h3>
            <p>{successMsg}</p>
            <p style={{ fontSize: "14px", marginTop: "8px", color: "#555" }}>
              Check your email inbox and click on the registration link to
              complete your account setup.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="register-form">
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                name="email"
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            {error && <div className="error-box">{error}</div>}

            <button type="submit" className="register-btn" disabled={loading}>
              {loading ? "Sending link..." : "Send Registration Link"}
            </button>
          </form>
        )}

        <div className="register-footer">
          Already have an account?{" "}
          <span onClick={() => navigate("/login")}>Login</span>
        </div>
      </div>
    </div>
  );
}
