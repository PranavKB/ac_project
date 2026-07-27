import { useState } from "react";
import { AuthContext } from "./auth-context";
import { userAPI } from "../../../api";

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
    const token = userData?.data?.token;
    const userProfile = userData?.data?.user;

    if (token) {
      localStorage.setItem("token", token);
    }

    // Expecting user.data to be the user profile
    const compatibilityUser = {
      ...userData,
      data: userProfile,
    };

    setUser(compatibilityUser);
    localStorage.setItem("user", JSON.stringify(compatibilityUser));

    if (userProfile?.roles?.length > 0) {
      setActiveRole(userProfile.roles[0]);
      localStorage.setItem("activeRole", userProfile.roles[0]);
    }
  };

  const logout = () => {
    setUser(null);
    setActiveRole(null);
    localStorage.removeItem("user");
    localStorage.removeItem("activeRole");
    localStorage.removeItem("token");
  };

  const switchRole = (newRole) => {
    setActiveRole(newRole);
    localStorage.setItem("activeRole", newRole);
  };

  const refreshUser = async () => {
    if (!user?.data?.id) return;
    try {
      const res = await userAPI.get(user.data.id);
      if (res && res.success) {
        setUser(res);
        localStorage.setItem("user", JSON.stringify(res));
      }
    } catch (err) {
      console.error("Failed to refresh user profile:", err);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, activeRole, switchRole, login, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}
