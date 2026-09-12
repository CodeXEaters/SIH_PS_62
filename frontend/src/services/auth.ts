import { apiClient } from "./apiClient";

export interface UserSession {
  id: string;
  name: string;
  role: string;
  callsign: string;
  station: string;
  email: string;
}

export interface BackendUser {
  id: number;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<UserSession> {
    const res = await apiClient.post<LoginResponse>("/auth/login", credentials);
    if (res?.access_token) {
      apiClient.setToken(res.access_token);
    }
    return await this.getCurrentUser();
  },

  async getCurrentUser(): Promise<UserSession> {
    const backendUser = await apiClient.get<BackendUser>("/auth/me");
    return {
      id: String(backendUser.id),
      name: backendUser.full_name,
      role: backendUser.role,
      callsign: `POLAR-${backendUser.role}`,
      station: "Bharati Station",
      email: backendUser.email,
    };
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post("/auth/logout");
    } catch {
      // Discard errors on logout
    } finally {
      apiClient.clearToken();
    }
  },

  isAuthenticated(): boolean {
    return Boolean(apiClient.getToken());
  },
};
