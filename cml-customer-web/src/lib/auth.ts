// Access token: kept in memory + sessionStorage mirror (never localStorage —
// short-lived, and we don't want it surviving an XSS-adjacent stale tab longer than needed).
// Refresh token: httpOnly cookie set by the backend, never touched here.

const ACCESS_TOKEN_KEY = "cml_access_token";
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

let inMemoryToken: string | null = null;

export function getAccessToken(): string | null {
  if (inMemoryToken) return inMemoryToken;
  if (typeof window === "undefined") return null;
  inMemoryToken = window.sessionStorage.getItem(ACCESS_TOKEN_KEY);
  return inMemoryToken;
}

export function setAccessToken(token: string) {
  inMemoryToken = token;
  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
  }
}

export function clearTokens() {
  inMemoryToken = null;
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  }
}

let refreshInFlight: Promise<boolean> | null = null;

/** Calls /auth/refresh using the httpOnly cookie. Coalesces concurrent callers. */
export async function refreshAccessToken(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/v1/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) return false;
      const json = await res.json();
      if (!json.success || !json.data?.accessToken) return false;
      setAccessToken(json.data.accessToken);
      return true;
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}
