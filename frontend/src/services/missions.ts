import { apiClient } from "./apiClient";
import { Mission } from "@/types";
import { mockMissions } from "@/data/mock";
import { db } from "@/lib/offline/storage/db";

export const missionsService = {
  async getAllMissions(): Promise<Mission[]> {
    try {
      return await apiClient.get<Mission[]>("/missions");
    } catch {
      try {
        const cached = await db.missions.toArray();
        if (cached.length > 0) return cached;
      } catch {}
      return mockMissions;
    }
  },
  async getMissionById(id: string): Promise<Mission | undefined> {
    try {
      return await apiClient.get<Mission>(`/missions/${id}`);
    } catch {
      try {
        const cached = await db.missions.get(id);
        if (cached) return cached;
      } catch {}
      return mockMissions.find((m) => m.id === id);
    }
  },
};
