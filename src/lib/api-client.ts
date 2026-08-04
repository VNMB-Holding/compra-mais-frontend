const AUTH_API_URL = process.env.NEXT_PUBLIC_AUTH_API_URL || "https://vnmb-identity-api.onrender.com";
const BIZ_API_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  auth?: boolean;
}

class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

let tokenProvider: (() => string | null) | null = null;
let unauthorizedHandler: (() => void) | null = null;
let refreshHandler: (() => Promise<string | null>) | null = null;
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

let lastUnauthorizedTime = 0;
const UNAUTHORIZED_DEBOUNCE_MS = 2000;

export function setTokenProvider(provider: () => string | null) {
  tokenProvider = provider;
}

export function setUnauthorizedHandler(handler: () => void) {
  unauthorizedHandler = handler;
}

export function setRefreshHandler(handler: () => Promise<string | null>) {
  refreshHandler = handler;
}

function processQueue(error: any, token: string | null = null) {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else if (token) {
      promise.resolve(token);
    }
  });
  failedQueue = [];
}

function getStoredToken(): string | null {
  if (tokenProvider) {
    const t = tokenProvider();
    if (t) return t;
  }
  if (typeof window !== "undefined") {
    return localStorage.getItem("compra_access_token");
  }
  return null;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers: customHeaders, auth = false, ...rest } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(customHeaders as Record<string, string>),
  };

  const token = getStoredToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const baseUrl = auth ? AUTH_API_URL.replace(/\/+$/, "") : BIZ_API_URL;
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  const config: RequestInit = {
    ...rest,
    headers,
  };

  if (body !== undefined) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${baseUrl}${cleanEndpoint}`, config);

  const isAuthEndpoint = cleanEndpoint.includes("/auth/refresh") || cleanEndpoint.includes("/auth/login");
  if (response.status === 401 && !isAuthEndpoint) {
    if (refreshHandler) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(async (newToken) => {
          headers["Authorization"] = `Bearer ${newToken}`;
          const retryRes = await fetch(`${baseUrl}${cleanEndpoint}`, {
            ...rest,
            headers,
            body: body !== undefined ? JSON.stringify(body) : undefined,
          });
          if (retryRes.ok) {
            return retryRes.status === 204 ? (undefined as T) : (retryRes.json() as Promise<T>);
          }
          throw new ApiError("Sessão expirada. Faça login novamente.", 401);
        });
      }

      isRefreshing = true;

      try {
        const newToken = await refreshHandler();
        isRefreshing = false;
        if (newToken) {
          processQueue(null, newToken);
          headers["Authorization"] = `Bearer ${newToken}`;
          const retryResponse = await fetch(`${baseUrl}${cleanEndpoint}`, {
            ...rest,
            headers,
            body: body !== undefined ? JSON.stringify(body) : undefined,
          });
          if (retryResponse.ok) {
            return retryResponse.status === 204 ? (undefined as T) : (retryResponse.json() as Promise<T>);
          }
        }
      } catch (e) {
        isRefreshing = false;
        processQueue(e, null);
      }
    }

    const now = Date.now();
    if (unauthorizedHandler && now - lastUnauthorizedTime > UNAUTHORIZED_DEBOUNCE_MS) {
      lastUnauthorizedTime = now;
      unauthorizedHandler();
    }
    throw new ApiError("Sessão expirada. Faça login novamente.", 401);
  }

  if (!response.ok) {
    let errorData: unknown = {};
    try {
      errorData = await response.json();
    } catch {
    }
    const message =
      (errorData as { message?: string; error?: string })?.message ||
      (errorData as { error?: string })?.error ||
      `Erro ${response.status}: ${response.statusText}`;
    throw new ApiError(message, response.status, errorData);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const apiClient = {
  get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return request<T>(endpoint, { ...options, method: "GET" });
  },

  post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>(endpoint, { ...options, method: "POST", body });
  },

  put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>(endpoint, { ...options, method: "PUT", body });
  },

  patch<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>(endpoint, { ...options, method: "PATCH", body });
  },

  delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return request<T>(endpoint, { ...options, method: "DELETE" });
  },

  async getRaw(endpoint: string, options?: RequestOptions): Promise<Response> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { headers: customHeaders, auth = false, body: _body, ...rest } = options || {};

    const headers: Record<string, string> = {
      ...(customHeaders as Record<string, string>),
    };

    const token = getStoredToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const baseUrl = auth ? AUTH_API_URL.replace(/\/+$/, "") : BIZ_API_URL;
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

    return fetch(`${baseUrl}${cleanEndpoint}`, { ...rest, method: "GET", headers });
  },
};

export { ApiError };
