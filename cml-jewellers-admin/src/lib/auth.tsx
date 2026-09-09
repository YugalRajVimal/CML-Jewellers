// // "use client";

// // import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
// // import * as api from "./api";
// // import { AdminUser, Permission, Role } from "./types";

// // interface AuthState {
// //   status: "loading" | "authed" | "guest";
// //   user: AdminUser | null;
// //   role: Role | null;
// //   can: (perm: Permission) => boolean;
// //   login: (email: string, password: string) => Promise<void>;
// //   logout: () => void;
// //   error: string | null;
// // }

// // const AuthContext = createContext<AuthState | null>(null);
// // const STORAGE_KEY = "cml_admin_session";

// // export function AuthProvider({ children }: { children: React.ReactNode }) {
// //   const [status, setStatus] = useState<AuthState["status"]>("loading");
// //   const [user, setUser] = useState<AdminUser | null>(null);
// //   const [role, setRole] = useState<Role | null>(null);
// //   const [error, setError] = useState<string | null>(null);

// //   useEffect(() => {
// //     try {
// //       const raw = window.localStorage.getItem(STORAGE_KEY);
// //       if (raw) {
// //         const parsed = JSON.parse(raw) as { user: AdminUser; role: Role };
// //         setUser(parsed.user);
// //         setRole(parsed.role);
// //         setStatus("authed");
// //       } else {
// //         setStatus("guest");
// //       }
// //     } catch {
// //       setStatus("guest");
// //     }
// //   }, []);

// //   const login = useCallback(async (email: string, password: string) => {
// //     setError(null);
// //     try {
// //       const res = await api.login(email, password);
// //       setUser(res.data.user);
// //       setRole(res.data.role);
// //       setStatus("authed");
// //       window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: res.data.user, role: res.data.role }));
// //     } catch (e) {
// //       const message = e instanceof api.ApiRequestError ? e.message : "Something went wrong. Try again.";
// //       setError(message);
// //       throw e;
// //     }
// //   }, []);

// //   const logout = useCallback(() => {
// //     window.localStorage.removeItem(STORAGE_KEY);
// //     setUser(null);
// //     setRole(null);
// //     setStatus("guest");
// //   }, []);

// //   const can = useCallback(
// //     (perm: Permission) => (role ? role.permissions.includes(perm) : false),
// //     [role]
// //   );

// //   return (
// //     <AuthContext.Provider value={{ status, user, role, can, login, logout, error }}>
// //       {children}
// //     </AuthContext.Provider>
// //   );
// // }

// // export function useAuth() {
// //   const ctx = useContext(AuthContext);
// //   if (!ctx) throw new Error("useAuth must be used within AuthProvider");
// //   return ctx;
// // }


// "use client";

// import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
// import * as api from "./api";
// import { setRefreshHandler } from "./http";
// import { AdminUser, Permission, Role } from "./types";

// interface AuthState {
//   status: "loading" | "authed" | "guest";
//   user: AdminUser | null;
//   role: Role | null;
//   can: (perm: Permission) => boolean;
//   login: (email: string, password: string) => Promise<void>;
//   logout: () => void;
//   error: string | null;
// }

// const AuthContext = createContext<AuthState | null>(null);

// export function AuthProvider({ children }: { children: React.ReactNode }) {
//   const [status, setStatus] = useState<AuthState["status"]>("loading");
//   const [user, setUser] = useState<AdminUser | null>(null);
//   const [role, setRole] = useState<Role | null>(null);
//   const [error, setError] = useState<string | null>(null);

//   // Kept in sync so the 401-retry handler in lib/http.ts (which can't call
//   // React hooks) can still update the session's user/role after a refresh.
//   const sessionRef = useRef({ setUser, setRole, setStatus });
//   sessionRef.current = { setUser, setRole, setStatus };

//   useEffect(() => {
//     // Silent session bootstrap: the access token lives in memory only, so on
//     // every full page load we ask the backend to mint a new one from the
//     // httpOnly refresh cookie set at login.
//     let cancelled = false;
//     api.refreshSession().then((session) => {
//       if (cancelled) return;
//       if (session) {
//         setUser(session.user);
//         setRole(session.role);
//         setStatus("authed");
//       } else {
//         setStatus("guest");
//       }
//     });
//     return () => { cancelled = true; };
//   }, []);

//   useEffect(() => {
//     setRefreshHandler(async () => {
//       const session = await api.refreshSession();
//       if (session) {
//         sessionRef.current.setUser(session.user);
//         sessionRef.current.setRole(session.role);
//         return true;
//       }
//       sessionRef.current.setUser(null);
//       sessionRef.current.setRole(null);
//       sessionRef.current.setStatus("guest");
//       return false;
//     });
//     return () => setRefreshHandler(null);
//   }, []);

//   const login = useCallback(async (email: string, password: string) => {
//     setError(null);
//     try {
//       const res = await api.login(email, password);
//       setUser(res.data.user);
//       setRole(res.data.role);
//       setStatus("authed");
//     } catch (e) {
//       const message = e instanceof api.ApiRequestError ? e.message : "Something went wrong. Try again.";
//       setError(message);
//       throw e;
//     }
//   }, []);

//   const logout = useCallback(() => {
//     api.logout().finally(() => {
//       setUser(null);
//       setRole(null);
//       setStatus("guest");
//     });
//   }, []);

//   const can = useCallback(
//     (perm: Permission) => (role ? role.permissions.includes(perm) : false),
//     [role]
//   );

//   return (
//     <AuthContext.Provider value={{ status, user, role, can, login, logout, error }}>
//       {children}
//     </AuthContext.Provider>
//   );
// }

// export function useAuth() {
//   const ctx = useContext(AuthContext);
//   if (!ctx) throw new Error("useAuth must be used within AuthProvider");
//   return ctx;
// }

"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import * as api from "./api";
import { loadPersistedToken, setAccessToken, setUnauthorizedHandler } from "./http";
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

// There's no refresh flow for admin auth (see lib/http.ts), so what survives a
// page reload is: the access token itself (in localStorage, via
// setAccessToken/loadPersistedToken) plus this small cache of who's signed in,
// purely for instant UI paint — the token is still what every request
// actually authenticates with, and a 401 clears both.
const SESSION_CACHE_KEY = "cml_admin_session";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthState["status"]>("loading");
  const [user, setUser] = useState<AdminUser | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [error, setError] = useState<string | null>(null);

  // useEffect(() => {
  //   const token = loadPersistedToken();
  //   const raw = window.localStorage.getItem(SESSION_CACHE_KEY);
  //   if (token && raw) {
  //     try {
  //       const cached = JSON.parse(raw) as { user: AdminUser; role: Role };
  //       setUser(cached.user);
  //       setRole(cached.role);
  //       setStatus("authed");
  //     } catch {
  //       setStatus("guest");
  //     }
  //   } else {
  //     setStatus("guest");
  //   }
  // }, []);

  useEffect(() => {
    let cancelled = false;
  
    async function bootstrap() {
      const token = loadPersistedToken();
      const raw = window.localStorage.getItem(SESSION_CACHE_KEY);
  
      if (!token || !raw) {
        setStatus("guest");
        return;
      }
  
      // Don't trust the cached session blindly — confirm the token is
      // still valid (right audience, not expired/revoked) before painting
      // an authed UI. api.me() should hit a lightweight admin-authed route.
      try {
        const session = await api.me();
        if (cancelled) return;
        setUser(session.user);
        setRole(session.role);
        setStatus("authed");
        window.localStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(session));
      } catch {
        if (cancelled) return;
        setAccessToken(null);
        window.localStorage.removeItem(SESSION_CACHE_KEY);
        setStatus("guest");
      }
    }
  
    bootstrap();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      window.localStorage.removeItem(SESSION_CACHE_KEY);
      setUser(null);
      setRole(null);
      setStatus("guest");
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      const res = await api.login(email, password);
      setUser(res.data.user);
      setRole(res.data.role);
      setStatus("authed");
      window.localStorage.setItem(SESSION_CACHE_KEY, JSON.stringify({ user: res.data.user, role: res.data.role }));
    } catch (e) {
      const message = e instanceof api.ApiRequestError ? e.message : "Something went wrong. Try again.";
      setError(message);
      throw e;
    }
  }, []);

  const logout = useCallback(() => {
    api.logout().finally(() => {
      setAccessToken(null);
      window.localStorage.removeItem(SESSION_CACHE_KEY);
      setUser(null);
      setRole(null);
      setStatus("guest");
    });
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