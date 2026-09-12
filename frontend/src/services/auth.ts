import { apiClient } from "./apiClient";

export interface UserSession {
  id: string;
  name: string;
  role: "COMMANDER" | "LOGISTICS_OFFICER" | "SCIENTIST" | "MEDICAL_OFFICER";
  callsign: string;
  station: string;
  email: string;
}

export const mockCurrentUser: UserSession = {
  id: "USR-001",
  name: "Dr. Arvind Sharan",
  role: "COMMANDER",
  callsign: "POLAR-LEADER-1",
  station: "Bharati Station",
  email: "arvind.sharan@ncpor.res.in",
};

export const authService = {
  async getCurrentUser(): Promise<UserSession> {
    try {
      return await apiClient.get<UserSession>("/auth/me");
    } catch {
      return mockCurrentUser;
    }
  },
  async logout(): Promise<void> {
    try {
      await apiClient.post("/auth/logout");
    } catch {
      // Mock logout
    }
  },
};
