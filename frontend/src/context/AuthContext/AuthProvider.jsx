import { useState } from "react";
import { AuthContext } from "./auth-context";

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [activeRole, setActiveRole] = useState(() => {
    const savedRole = localStorage.getItem("activeRole");
    if (savedRole) return savedRole;
    if (user?.data?.roles?.length > 0) {
      return user.data.roles[0];
    }
    return null;
  });

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
    if (userData?.data?.roles?.length > 0) {
      setActiveRole(userData.data.roles[0]);
      localStorage.setItem("activeRole", userData.data.roles[0]);
    }
  };

  const logout = () => {
    setUser(null);
    setActiveRole(null);
    localStorage.removeItem("user");
    localStorage.removeItem("activeRole");
  };

  const switchRole = (newRole) => {
    setActiveRole(newRole);
    localStorage.setItem("activeRole", newRole);
  };

  return (
    <AuthContext.Provider
      value={{ user, activeRole, switchRole, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}
