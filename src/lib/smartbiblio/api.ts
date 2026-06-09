const KEY_BASE = "sb_api_base";
const KEY_ACCESS = "sb_access_token";
const KEY_REFRESH = "sb_refresh_token";

// export function getApiBase(): string {
//   if (typeof window === "undefined") return "";
//   return localStorage.getItem(KEY_BASE) || (import.meta.env.VITE_API_BASE_URL as string) || "";
// }
export function getApiBase(): string {
  
  return 'http://127.0.0.1:8000';
}
export function setApiBase(url: string) {
  localStorage.setItem(KEY_BASE, url.replace(/\/+$/, ""));
}
export function getAccessToken() {
  return typeof window === "undefined" ? null : localStorage.getItem(KEY_ACCESS);
}
export function getRefreshToken() {
  return typeof window === "undefined" ? null : localStorage.getItem(KEY_REFRESH);
}
export function setTokens(t: { access_token?: string; refresh_token?: string } | null) {
  if (!t) {
    localStorage.removeItem(KEY_ACCESS);
    localStorage.removeItem(KEY_REFRESH);
    return;
  }
  if (t.access_token) localStorage.setItem(KEY_ACCESS, t.access_token);
  if (t.refresh_token) localStorage.setItem(KEY_REFRESH, t.refresh_token);
}

export interface ApiEnvelope<T> {
  data: T;
  meta?: Record<string, unknown> & { page?: number; per_page?: number; total?: number; last_page?: number };
  errors: { code: string; message: string; details?: unknown }[];
}

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;
  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

let refreshing: Promise<string | null> | null = null;

async function doRefresh(): Promise<string | null> {
  const base = getApiBase();
  const rt = getRefreshToken();
  if (!base || !rt) return null;
  try {
    const res = await fetch(`${base}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ refresh_token: rt }),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as ApiEnvelope<{ tokens: { access_token: string; refresh_token: string } }>;
    setTokens(body.data.tokens);
    return body.data.tokens.access_token;
  } catch {
    return null;
  }
}

export async function apiRequest<T = unknown>(
  path: string,
  init: RequestInit & { query?: Record<string, string | number | undefined | null> } = {},
): Promise<ApiEnvelope<T>> {
  const base = getApiBase();
  if (!base) throw new ApiError(0, "NO_API_BASE", "API base URL is not configured. Go to Settings.");

  const { query, ...rest } = init;
  let url = `${base}${path.startsWith("/") ? "" : "/"}${path}`;
  if (query) {
    const qs = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
    });
    const s = qs.toString();
    if (s) url += (url.includes("?") ? "&" : "?") + s;
  }

  const exec = async (token: string | null): Promise<Response> => {
    const headers = new Headers(rest.headers);
    headers.set("Accept", "application/json");
    if (rest.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return fetch(url, { ...rest, headers });
  };

  let token = getAccessToken();
  let res = await exec(token);

  if (res.status === 401 && getRefreshToken() && !path.includes("/auth/refresh") && !path.includes("/auth/login")) {
    if (!refreshing) refreshing = doRefresh().finally(() => (refreshing = null));
    const newToken = await refreshing;
    if (newToken) {
      res = await exec(newToken);
    } else {
      setTokens(null);
    }
  }

  let body: ApiEnvelope<T> | null = null;
  const text = await res.text();
  try {
    body = text ? (JSON.parse(text) as ApiEnvelope<T>) : null;
  } catch {
    /* non-json */
  }

  if (!res.ok) {
    const err = body?.errors?.[0];
    throw new ApiError(res.status, err?.code ?? "HTTP_ERROR", err?.message ?? res.statusText, err?.details);
  }
  return body ?? ({ data: null as unknown as T, meta: {}, errors: [] });
}

export async function apiFetch<T = unknown>(
  path: string,
  init: Parameters<typeof apiRequest>[1] = {},
): Promise<T> {
  const r = await apiRequest<T>(path, init);
  return r.data;
}