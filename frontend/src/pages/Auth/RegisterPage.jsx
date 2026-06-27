import { useState } from "react";
import { authAPI } from "../../../api";
import "./Register.scss";
import { useNavigate } from "react-router-dom";

const initialState = {
  name: "",
  email: "",
  phone: "",
  password: "",
  roles: ["DRIVER", "PASSENGER"],
};

export default function RegisterPage() {
  const [formData, setFormData] = useState(initialState);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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

    try {
      const { name, email, phone, password, roles } = formData;

      const resp = await authAPI.register(name, email, phone, password, roles);

      console.log("Registration response:", resp);
      alert("Registration successful! Please login.");

      setFormData(initialState);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <h2>Register</h2>
          <p>Create a new account</p>
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
              required
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              className="input-field"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Phone</label>
            <input
              type="tel"
              name="phone"
              className="input-field"
              value={formData.phone}
              onChange={handleChange}
              required
            />
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
          </div>

          {error && <div className="error-box">{error}</div>}

          <button type="submit" className="register-btn" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <div className="register-footer">
          Already have an account?{" "}
          <span onClick={() => navigate("/login")}>Login</span>
        </div>
      </div>
    </div>
  );
}
