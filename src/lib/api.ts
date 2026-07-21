const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8787";

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T | null> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    // This is what lets the browser attach Better Auth's session cookie.
    // Every request to the backend needs this, not just the auth ones —
    // forgetting it is the #1 cause of "why am I getting 401s while
    // clearly logged in."
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (res.status === 204) return null; // no content, nothing to parse
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.error ?? res.statusText);
  }
  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

export { ApiError };
