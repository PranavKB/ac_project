import { useState } from "react";
import { authAPI } from "../../../api";
import "./Register.scss";

export default function RegisterPage({ onTogglePage }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [roles, setRoles] = useState(["DRIVER", "PASSENGER"]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRoleChange = (role) => {
    if (roles.includes(role)) {
      if (roles.length > 1) {
        setRoles(roles.filter((r) => r !== role));
      }
    } else {
      setRoles([...roles, role]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const resp = await authAPI.register(name, email, phone, password, roles);
      console.log("Registration response:", resp);
      alert("Registration successful! Please login.");

      //onRegisterSuccess();
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
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Email</label>

            <input
              type="email"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Phone</label>

            <input
              type="tel"
              className="input-field"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>

            <input
              type="password"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="role-section">
            <label>Roles</label>

            <div className="role-options">
              <label>
                <input
                  type="checkbox"
                  checked={roles.includes("DRIVER")}
                  onChange={() => handleRoleChange("DRIVER")}
                />
                Driver
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={roles.includes("PASSENGER")}
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
          Already have an account? <span onClick={onTogglePage}>Login</span>
        </div>
      </div>
    </div>
  );
}
