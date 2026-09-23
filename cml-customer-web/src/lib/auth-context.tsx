"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getAccessToken, refreshAccessToken, AUTH_CHANGED_EVENT } from "./auth";

const AuthContext = createContext<{ isLoggedIn: boolean; recheck: () => void }>({
  isLoggedIn: false,
  recheck: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const recheck = useCallback(async () => {
    if (getAccessToken()) { setIsLoggedIn(true); return; }
    const ok = await refreshAccessToken();
    setIsLoggedIn(ok);
  }, []);

  useEffect(() => { recheck(); }, [recheck]);

  // Keep isLoggedIn in sync when tokens are set/cleared outside a component — e.g.
  // api-client clearing tokens after a failed silent refresh.
  useEffect(() => {
    window.addEventListener(AUTH_CHANGED_EVENT, recheck);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, recheck);
  }, [recheck]);

  return <AuthContext.Provider value={{ isLoggedIn, recheck }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);