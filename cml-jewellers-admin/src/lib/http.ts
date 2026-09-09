// // Thin fetch wrapper around the real backend described in PART 5 — API CONTRACT.
// //
// // Base URL: /api/v1 (admin routes under /api/v1/admin). Point
// // NEXT_PUBLIC_ADMIN_API_BASE_URL at the API ROOT (e.g. https://api.cmljewellers.com/api/v1).
// // Per the architecture doc, the admin panel only ever talks to /api/v1/admin —
// // including its own login/refresh/logout, which is a separate JWT namespace
// // (aud: admin, no OTP) from the customer-facing /api/v1/auth/* routes. See
// // AUTH_BASE below: it's nested under ADMIN_BASE, not a sibling of it.

// export interface ApiMeta { page: number; limit: number; total: number }
// export interface ApiResponse<T> {
//   success: true;
//   message: string;
//   data: T;
//   meta?: ApiMeta;
// }
// interface ApiErrorBody {
//   success: false;
//   message: string;
//   error: { code: string; details?: Record<string, unknown> };
// }

// export class ApiRequestError extends Error {
//   code: string;
//   status?: number;
//   constructor(message: string, code: string, status?: number) {
//     super(message);
//     this.code = code;
//     this.status = status;
//   }
// }

// const API_ROOT = (process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL || "http://localhost:4000/api/v1").replace(/\/$/, "");
// export const ADMIN_BASE = `${API_ROOT}/admin`;
// // Admin auth is its own JWT namespace (aud: admin, password-only, no OTP) per
// // the architecture doc, and the admin panel is only supposed to talk to
// // /api/v1/admin — so admin login/refresh/logout live under the admin prefix,
// // NOT under the customer-facing /api/v1/auth/* OTP routes.
// export const AUTH_BASE = `${ADMIN_BASE}/auth`;

// // Access token lives in memory only (never localStorage) — the refresh token is
// // the httpOnly cookie the backend sets on login, per the architecture doc.
// let accessToken: string | null = null;
// export function setAccessToken(token: string | null) {
//   accessToken = token;
// }
// export function getAccessToken() {
//   return accessToken;
// }

// // Set by auth.tsx so a 401 can trigger exactly one silent refresh-and-retry
// // without this module depending on the auth context directly.
// let refreshHandler: (() => Promise<boolean>) | null = null;
// export function setRefreshHandler(fn: (() => Promise<boolean>) | null) {
//   refreshHandler = fn;
// }

// async function parseBody(res: Response): Promise<unknown> {
//   const text = await res.text();
//   if (!text) return null;
//   try {
//     return JSON.parse(text);
//   } catch {
//     throw new ApiRequestError("The server returned an unexpected response.", "INVALID_RESPONSE", res.status);
//   }
// }

// async function request<T>(url: string, options: RequestInit = {}, retrying = false): Promise<ApiResponse<T>> {
//   const headers: Record<string, string> = {
//     "Content-Type": "application/json",
//     ...(options.headers as Record<string, string> | undefined),
//   };
//   if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

//   let res: Response;
//   try {
//     res = await fetch(url, { ...options, headers, credentials: "include" });
//   } catch {
//     throw new ApiRequestError("Could not reach the server. Check your connection and try again.", "NETWORK_ERROR");
//   }

//   if (res.status === 401 && !retrying && refreshHandler) {
//     const refreshed = await refreshHandler();
//     if (refreshed) return request<T>(url, options, true);
//   }

//   const body = await parseBody(res);

//   if (!res.ok || (body as { success?: boolean } | null)?.success === false) {
//     const err = body as ApiErrorBody | null;
//     throw new ApiRequestError(
//       err?.message || `Request failed with status ${res.status}.`,
//       err?.error?.code || "UNKNOWN_ERROR",
//       res.status
//     );
//   }

//   return body as ApiResponse<T>;
// }

// function toQuery(params: Record<string, unknown> = {}) {
//   const qs = Object.entries(params)
//     .filter(([, v]) => v !== undefined && v !== null && v !== "")
//     .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
//     .join("&");
//   return qs ? `?${qs}` : "";
// }

// export const http = {
//   get: <T>(path: string, params?: Record<string, unknown>) =>
//     request<T>(`${ADMIN_BASE}${path}${toQuery(params)}`),
//   post: <T>(path: string, body?: unknown) =>
//     request<T>(`${ADMIN_BASE}${path}`, { method: "POST", body: body !== undefined ? JSON.stringify(body) : undefined }),
//   patch: <T>(path: string, body?: unknown) =>
//     request<T>(`${ADMIN_BASE}${path}`, { method: "PATCH", body: body !== undefined ? JSON.stringify(body) : undefined }),
//   delete: <T>(path: string) => request<T>(`${ADMIN_BASE}${path}`, { method: "DELETE" }),
// };

// export const authHttp = {
//   post: <T>(path: string, body?: unknown) =>
//     request<T>(`${AUTH_BASE}${path}`, { method: "POST", body: body !== undefined ? JSON.stringify(body) : undefined }),
//   get: <T>(path: string) => request<T>(`${AUTH_BASE}${path}`),
// };

// Thin fetch wrapper around the real backend described in PART 5 — API CONTRACT.
//
// Base URL: /api/v1 (admin routes under /api/v1/admin). Point
// NEXT_PUBLIC_ADMIN_API_BASE_URL at the API ROOT (e.g. https://api.cmljewellers.com/api/v1).
// Per the architecture doc, the admin panel only ever talks to /api/v1/admin —
// including its own login/logout, which is a separate JWT namespace
// (aud: admin, no OTP) from the customer-facing /api/v1/auth/* routes. See
// AUTH_BASE below: it's nested under ADMIN_BASE, not a sibling of it.
//
// No refresh flow: unlike the customer flow (which the docs explicitly give
// a refresh token + httpOnly cookie), admin auth is documented only as
// "password + optional 2FA later" — no refresh token is called out. So the
// access token is a plain long-lived-ish JWT, persisted client-side (see
// setAccessToken below) and used until it expires or a request comes back
// 401, at which point the session is cleared and the person logs in again.

export interface ApiMeta { page: number; limit: number; total: number }
export interface ApiResponse<T> {
  success: true;
  message: string;
  data: T;
  meta?: ApiMeta;
}
interface ApiErrorBody {
  success: false;
  message: string;
  error: { code: string; details?: Record<string, unknown> };
}

export class ApiRequestError extends Error {
  code: string;
  status?: number;
  constructor(message: string, code: string, status?: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

const API_ROOT = (process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL || "http://localhost:4000/api/v1").replace(/\/$/, "");
export const ADMIN_BASE = `${API_ROOT}/admin`;
// Admin auth is its own JWT namespace (aud: admin, password-only, no OTP) per
// the architecture doc, and the admin panel is only supposed to talk to
// /api/v1/admin — so admin login/logout live under the admin prefix, NOT
// under the customer-facing /api/v1/auth/* OTP routes.
export const AUTH_BASE = `${ADMIN_BASE}/auth`;

const TOKEN_STORAGE_KEY = "cml_admin_token";

// No refresh token to fall back on, so the access token itself is persisted
// (localStorage) to survive a page reload — the tradeoff being that it's
// readable by any script on the page. If the backend later adds a refresh
// token + httpOnly cookie for admin, switch this back to memory-only and
// reintroduce a refresh-and-retry step in request() below.
let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  else window.localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export function getAccessToken() {
  return accessToken;
}

// Called once on app start (see auth.tsx) to restore a token saved before a
// page reload, without any network round-trip.
export function loadPersistedToken(): string | null {
  if (typeof window === "undefined") return null;
  const token = window.localStorage.getItem(TOKEN_STORAGE_KEY);
  accessToken = token;
  return token;
}

// Set by auth.tsx so a 401 (expired/invalid token, and there's no refresh to
// retry with) clears the session and lets the route guard bounce to /login.
let unauthorizedHandler: (() => void) | null = null;
export function setUnauthorizedHandler(fn: (() => void) | null) {
  unauthorizedHandler = fn;
}

async function parseBody(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    throw new ApiRequestError("The server returned an unexpected response.", "INVALID_RESPONSE", res.status);
  }
}

async function request<T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  let res: Response;
  try {
    res = await fetch(url, { ...options, headers });
  } catch {
    throw new ApiRequestError("Could not reach the server. Check your connection and try again.", "NETWORK_ERROR");
  }

  if (res.status === 401) {
    setAccessToken(null);
    unauthorizedHandler?.();
  }

  const body = await parseBody(res);

  if (!res.ok || (body as { success?: boolean } | null)?.success === false) {
    const err = body as ApiErrorBody | null;
    throw new ApiRequestError(
      err?.message || `Request failed with status ${res.status}.`,
      err?.error?.code || "UNKNOWN_ERROR",
      res.status
    );
  }

  return body as ApiResponse<T>;
}

function toQuery(params: Record<string, unknown> = {}) {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");
  return qs ? `?${qs}` : "";
}

export const http = {
  get: <T>(path: string, params?: Record<string, unknown>) =>
    request<T>(`${ADMIN_BASE}${path}${toQuery(params)}`),
  post: <T>(path: string, body?: unknown) =>
    request<T>(`${ADMIN_BASE}${path}`, { method: "POST", body: body !== undefined ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(`${ADMIN_BASE}${path}`, { method: "PATCH", body: body !== undefined ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(`${ADMIN_BASE}${path}`, { method: "DELETE" }),
};

export const authHttp = {
  post: <T>(path: string, body?: unknown) =>
    request<T>(`${AUTH_BASE}${path}`, { method: "POST", body: body !== undefined ? JSON.stringify(body) : undefined }),
};