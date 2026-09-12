import { apiClient } from "./apiClient";
import { Expedition, Station } from "@/types";
import { mockExpedition, mockStations } from "@/data/mock";

export const expeditionService = {
  async getActiveExpedition(): Promise<Expedition> {
    try {
      return await apiClient.get<Expedition>("/expeditions/active");
    } catch {
      return mockExpedition;
    }
  },
  async getExpeditionById(id: string): Promise<Expedition | null> {
    try {
      return await apiClient.get<Expedition>(`/expeditions/${id}`);
    } catch {
      return mockExpedition.id === id ? mockExpedition : null;
    }
  },
  async getStations(): Promise<Station[]> {
    try {
      return await apiClient.get<Station[]>("/stations");
    } catch {
      return mockStations;
    }
  },
  async getStationById(id: string): Promise<Station | undefined> {
    try {
      return await apiClient.get<Station>(`/stations/${id}`);
    } catch {
      return mockStations.find((s) => s.id === id);
    }
  },
};
