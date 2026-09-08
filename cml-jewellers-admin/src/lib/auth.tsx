"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import * as api from "./api";
import { AdminUser, Permission, Role } from "./types";

interface AuthState {
  status: "loading" | "authed" | "guest";
  user: AdminUser | null;
  role: Role | null;
  can: (perm: Permission) => boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  error: string | null;
}

const AuthContext = createContext<AuthState | null>(null);
const STORAGE_KEY = "cml_admin_session";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthState["status"]>("loading");
  const [user, setUser] = useState<AdminUser | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { user: AdminUser; role: Role };
        setUser(parsed.user);
        setRole(parsed.role);
        setStatus("authed");
      } else {
        setStatus("guest");
      }
    } catch {
      setStatus("guest");
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      const res = await api.login(email, password);
      setUser(res.data.user);
      setRole(res.data.role);
      setStatus("authed");
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: res.data.user, role: res.data.role }));
    } catch (e) {
      const message = e instanceof api.ApiRequestError ? e.message : "Something went wrong. Try again.";
      setError(message);
      throw e;
    }
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    setRole(null);
    setStatus("guest");
  }, []);

  const can = useCallback(
    (perm: Permission) => (role ? role.permissions.includes(perm) : false),
    [role]
  );

  return (
    <AuthContext.Provider value={{ status, user, role, can, login, logout, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
