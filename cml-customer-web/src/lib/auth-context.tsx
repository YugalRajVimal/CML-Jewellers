"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getAccessToken, refreshAccessToken } from "./auth";

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

  return <AuthContext.Provider value={{ isLoggedIn, recheck }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);