import { apiClient } from "./apiClient";

export interface WasteRecord {
  id: number;
  station_id: number;
  waste_category: string;
  quantity: number;
  unit: string;
  disposal_method: string;
  storage_location: string;
  hazardous: boolean;
  status: "STORED" | "SEGREGATED" | "TREATED" | "TRANSFERRED" | "DISPOSED" | string;
  generated_at: string;
  processed_at?: string;
  responsible_personnel_id?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface WasteSummary {
  total_records: number;
  total_quantity_kg: number;
  hazardous_stored_kg: number;
  retrograde_pending_kg: number;
  category_breakdown: Record<string, number>;
  status_breakdown: Record<string, number>;
  compliance_status: string;
}

export interface CreateWasteRecordPayload {
  station_id: number;
  waste_category: string;
  quantity: number;
  unit?: string;
  disposal_method?: string;
  storage_location?: string;
  hazardous?: boolean;
  status?: string;
  responsible_personnel_id?: number;
  notes?: string;
}

export interface WasteFilters {
  station_id?: number;
  waste_category?: string;
  status?: string;
  hazardous_only?: boolean;
}

export const wasteService = {
  async getWasteRecords(filters?: WasteFilters): Promise<WasteRecord[]> {
    const params = new URLSearchParams();
    if (filters?.station_id) params.append("station_id", String(filters.station_id));
    if (filters?.waste_category) params.append("waste_category", filters.waste_category);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.hazardous_only) params.append("hazardous_only", "true");

    const qs = params.toString();
    return apiClient.get<WasteRecord[]>(qs ? `/waste?${qs}` : "/waste");
  },

  async getWasteSummary(stationId?: number): Promise<WasteSummary> {
    const qs = stationId ? `?station_id=${stationId}` : "";
    return apiClient.get<WasteSummary>(`/waste/summary${qs}`);
  },

  async getWasteRecordById(id: number): Promise<WasteRecord> {
    return apiClient.get<WasteRecord>(`/waste/${id}`);
  },

  async createWasteRecord(payload: CreateWasteRecordPayload): Promise<WasteRecord> {
    return apiClient.post<WasteRecord>("/waste", payload);
  },

  async updateWasteRecord(id: number, payload: Partial<CreateWasteRecordPayload>): Promise<WasteRecord> {
    return apiClient.patch<WasteRecord>(`/waste/${id}`, payload);
  },

  async deleteWasteRecord(id: number): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/waste/${id}`);
  },
};
