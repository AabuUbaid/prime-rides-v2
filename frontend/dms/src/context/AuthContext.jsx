import { createContext, useContext, useEffect, useState } from "react";

import { login as loginRequest, getCurrentUser } from "../api/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem("accessToken");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser.data);
      } catch {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  async function login(email, password) {
    const response = await loginRequest(email, password);

    const accessToken = response.data.access;
    const refreshToken = response.data.refresh;

    localStorage.setItem("accessToken", accessToken);

    if (refreshToken) {
      localStorage.setItem("refreshToken", refreshToken);
    }

    const currentUser = await getCurrentUser();

    setUser(currentUser.data);

    return currentUser.data;
  }

  function logout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");

    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: Boolean(user),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
