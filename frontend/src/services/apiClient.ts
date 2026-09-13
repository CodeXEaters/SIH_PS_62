const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
const TOKEN_KEY = "dhruv_access_token";

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export class ApiError extends Error {
  public status?: number;
  public data?: any;
  public isOffline: boolean;

  constructor(message: string, status?: number, data?: any, isOffline: boolean = false) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
    this.isOffline = isOffline;
  }
}

export class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  /**
   * Singleton promise for the in-flight demo-login.
   * All concurrent unauthenticated requests share this one promise instead of
   * each firing their own POST /auth/login — which caused a race condition where
   * only one request received the token while the others proceeded without auth
   * (401) and were rejected, making all Dashboard KPIs show "Unavailable".
   */
  private pendingLogin: Promise<string | null> | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem(TOKEN_KEY);
    }
  }

  public setToken(token: string | null): void {
    this.token = token;
    if (typeof window !== "undefined") {
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }
    }
  }

  public getToken(): string | null {
    if (!this.token && typeof window !== "undefined") {
      this.token = localStorage.getItem(TOKEN_KEY);
    }
    return this.token;
  }

  public clearToken(): void {
    this.setToken(null);
  }

  /**
   * Acquires a demo operator token if none exists, using a singleton promise so
   * that N concurrent callers all await the same single POST /auth/login call.
   * Without this, 7 simultaneous Dashboard requests each tried to login
   * concurrently, causing a race where most proceeded without a token (→ 401).
   */
  private async ensureToken(): Promise<string | null> {
    // Fast path: token already in memory or localStorage
    const existing = this.getToken();
    if (existing) return existing;

    // If a login is already in-flight, wait for it rather than starting a new one
    if (this.pendingLogin) return this.pendingLogin;

    // Kick off exactly one login and share the promise with all concurrent callers
    this.pendingLogin = (async () => {
      try {
        const loginRes = await fetch(`${this.baseUrl}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "admin@dhruv.gov.in", password: "Admin@123456" }),
        });
        if (loginRes.ok) {
          const authData = await loginRes.json();
          if (authData?.access_token) {
            this.setToken(authData.access_token);
            return authData.access_token as string;
          }
        }
      } catch {
        // Network unavailable — continue without token (offline mode)
      } finally {
        // Clear the singleton so the next unauthenticated request can retry
        this.pendingLogin = null;
      }
      return null;
    })();

    return this.pendingLogin;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const url = `${this.baseUrl}${cleanEndpoint}`;

    // Acquire token (serialized via singleton — no concurrent race)
    let token: string | null = null;
    if (typeof window !== "undefined" && !endpoint.includes("/auth/")) {
      token = await this.ensureToken();
    } else {
      token = this.getToken();
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...((options.headers as Record<string, string>) || {}),
    };

    // Increased timeout to 10 s to accommodate login + API round-trip
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    let response: Response;
    try {
      response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });
    } catch (networkError: any) {
      clearTimeout(timeoutId);
      throw new ApiError(
        networkError.message || "Network request failed",
        undefined,
        undefined,
        true
      );
    }

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errData: any = null;
      try {
        errData = await response.json();
      } catch {
        // Body was not JSON
      }
      const errMsg =
        errData?.detail ||
        `HTTP error ${response.status}: ${response.statusText}`;
      throw new ApiError(errMsg, response.status, errData, false);
    }

    // Return empty object for 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return (await response.json()) as T;
  }

  public async get<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: "GET", headers });
  }

  public async post<T>(endpoint: string, data?: unknown, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  public async put<T>(endpoint: string, data?: unknown, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  public async patch<T>(endpoint: string, data?: unknown, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  public async delete<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE", headers });
  }
}

export const apiClient = new ApiClient();
