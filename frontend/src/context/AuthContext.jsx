import { createContext, useCallback, useContext, useMemo, useState } from "react";

import { loginRequest, registerRequest } from "../api/auth.js";
import {
  clearStoredAuth,
  getStoredToken,
  getStoredUser,
  setStoredToken,
  setStoredUser
} from "../utils/storage.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => getStoredUser());
  const [token, setToken] = useState(() => getStoredToken());

  const applySession = useCallback((session) => {
    setUser(session.user);
    setToken(session.token);
    setStoredUser(session.user);
    setStoredToken(session.token);
  }, []);

  const login = useCallback(
    async (credentials) => {
      const session = await loginRequest(credentials);
      applySession(session);
      return session.user;
    },
    [applySession]
  );

  const register = useCallback(
    async (details) => {
      const session = await registerRequest(details);
      applySession(session);
      return session.user;
    },
    [applySession]
  );

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    clearStoredAuth();
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token),
      login,
      register,
      logout
    }),
    [user, token, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }

  return context;
};
