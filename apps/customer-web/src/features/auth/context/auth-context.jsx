"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, setAuthToken } from "@/lib/api";

const AuthContext = createContext(null);
const storageKey = "kyc_auth_session";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const session = JSON.parse(raw);
      setToken(session.token);
      setUser(session.user);
      setAuthToken(session.token);
    }
    setReady(true);
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      ready,
      login(session) {
        setToken(session.token);
        setUser(session.user);
        setAuthToken(session.token);
        localStorage.setItem(storageKey, JSON.stringify(session));
      },
      async refreshMe() {
        if (!token) {
          return null;
        }

        const response = await api.get("/auth/me");
        setUser(response.data.user);
        localStorage.setItem(storageKey, JSON.stringify({ token, user: response.data.user }));
        return response.data.user;
      },
      logout() {
        setToken(null);
        setUser(null);
        setAuthToken(null);
        localStorage.removeItem(storageKey);
      }
    }),
    [token, user, ready]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}

