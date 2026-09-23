import type { ApiResponse } from "./types";
import { getAccessToken, refreshAccessToken, clearTokens } from "./auth";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export class ApiClientError extends Error {
  code: string;
  details?: Record<string, unknown>;
  status: number;

  constructor(message: string, code: string, status: number, details?: Record<string, unknown>) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  auth?: boolean; // attach Authorization header, default true
  isRetry?: boolean; // internal: prevents infinite refresh loops
}

/** A validation failure's `details.issues`, as shaped by the backend's zod `validate`
 * middleware and Mongoose-validation handling (see Backend/src/middleware/errorHandler.ts). */
interface ValidationIssue {
  path?: string;
  message?: string;
}

/** Zod validation failures all arrive with the same generic "Validation failed" message —
 * the useful detail is in `details.issues`. Prefer that so the user sees e.g. "email: Invalid
 * email" instead of a message that doesn't say what was wrong. */
function messageFromDetails(message: string, code: string, details?: Record<string, unknown>): string {
  if (code !== "VALIDATION_ERROR") return message;
  const issues = details?.issues;
  if (!Array.isArray(issues) || issues.length === 0) return message;
  return issues
    .map((issue: ValidationIssue) => (issue.path ? `${issue.path}: ${issue.message ?? "Invalid value"}` : issue.message))
    .filter(Boolean)
    .join("; ");
}

/** res.json() throws SyntaxError on an empty body or a non-JSON response (e.g. an HTML error
 * page from a proxy/gateway in front of the API) — guard it so callers get a readable
 * ApiClientError instead of an uncaught SyntaxError. */
async function parseJsonResponse<T>(res: Response): Promise<ApiResponse<T>> {
  const text = await res.text();
  if (!text) {
    throw new ApiClientError(
      res.ok ? "The server returned an empty response." : `Request failed (${res.status}).`,
      "INVALID_RESPONSE",
      res.status
    );
  }
  try {
    return JSON.parse(text) as ApiResponse<T>;
  } catch {
    throw new ApiClientError("The server returned an unexpected response.", "INVALID_RESPONSE", res.status);
  }
}

function buildHeaders(auth: boolean, headers: RequestOptions["headers"]): Record<string, string> {
  const finalHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(headers as Record<string, string>),
  };
  if (auth) {
    const token = getAccessToken();
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }
  return finalHeaders;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, auth = true, isRetry, headers, ...rest } = options;

  const res = await fetch(`${BASE_URL}/api/v1${path}`, {
    ...rest,
    headers: buildHeaders(auth, headers),
    credentials: "include", // sends the httpOnly refresh cookie
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // Access token expired — try one silent refresh, then retry once.
  if (res.status === 401 && auth && !isRetry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return request<T>(path, { ...options, isRetry: true });
    }
    clearTokens();
  }

  const json = await parseJsonResponse<T>(res);

  if (!json.success) {
    throw new ApiClientError(
      messageFromDetails(json.message, json.error.code, json.error.details),
      json.error.code,
      res.status,
      json.error.details
    );
  }

  return json.data;
}

async function requestWithMeta<T>(
  path: string,
  options: RequestOptions = {},
): Promise<{ data: T; meta?: ApiSuccessMeta }> {
  const { body, auth = true, isRetry, headers, ...rest } = options;

  const res = await fetch(`${BASE_URL}/api/v1${path}`, {
    ...rest,
    headers: buildHeaders(auth, headers),
    credentials: "include",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && auth && !isRetry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return requestWithMeta<T>(path, { ...options, isRetry: true });
    }
    clearTokens();
  }

  const json = await parseJsonResponse<T>(res);

  if (!json.success) {
    throw new ApiClientError(
      messageFromDetails(json.message, json.error.code, json.error.details),
      json.error.code,
      res.status,
      json.error.details
    );
  }

  return { data: json.data, meta: json.meta };
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: "GET" }),
  getWithMeta: <T>(path: string, options?: RequestOptions) =>
    requestWithMeta<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "POST", body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PATCH", body }),
  delete: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: "DELETE" }),
};

type ApiSuccessMeta = { page?: number; limit?: number; total?: number };