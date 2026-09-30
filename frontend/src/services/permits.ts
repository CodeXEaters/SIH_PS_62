import { apiClient } from "./apiClient";

export interface Permit {
  id: number;
  permit_number: string;
  permit_type: string;
  issuing_authority: string;
  expedition_id?: string;
  station_id?: number;
  issue_date: string;
  expiry_date: string;
  status: "APPROVED" | "PENDING" | "EXPIRING" | "EXPIRED" | "SUSPENDED" | string;
  conditions?: string;
  responsible_officer: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PermitSummary {
  total: number;
  approved: number;
  expiring_soon: number;
  expired: number;
  pending: number;
  suspended: number;
}

export interface CreatePermitPayload {
  permit_number?: string;
  permit_type: string;
  issuing_authority: string;
  expedition_id?: string;
  station_id?: number;
  issue_date: string;
  expiry_date: string;
  status?: string;
  conditions?: string;
  responsible_officer: string;
  notes?: string;
}

export interface PermitFilters {
  status?: string;
  station_id?: number;
  permit_type?: string;
  expiring_within_days?: number;
}

export const permitsService = {
  async getPermits(filters?: PermitFilters): Promise<Permit[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append("status", filters.status);
    if (filters?.station_id) params.append("station_id", String(filters.station_id));
    if (filters?.permit_type) params.append("permit_type", filters.permit_type);
    if (filters?.expiring_within_days) params.append("expiring_within_days", String(filters.expiring_within_days));

    const qs = params.toString();
    const endpoint = qs ? `/permits?${qs}` : "/permits";
    return apiClient.get<Permit[]>(endpoint);
  },

  async getExpiringPermits(days: number = 30): Promise<Permit[]> {
    return apiClient.get<Permit[]>(`/permits/expiring?days=${days}`);
  },

  async getPermitSummary(): Promise<PermitSummary> {
    return apiClient.get<PermitSummary>("/permits/summary");
  },

  async getPermitById(id: number): Promise<Permit> {
    return apiClient.get<Permit>(`/permits/${id}`);
  },

  async createPermit(payload: CreatePermitPayload): Promise<Permit> {
    return apiClient.post<Permit>("/permits", payload);
  },

  async updatePermitStatus(id: number, status: string, notes?: string): Promise<Permit> {
    return apiClient.patch<Permit>(`/permits/${id}/status`, { status, notes });
  },

  async deletePermit(id: number): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/permits/${id}`);
  },
};
