import { apiClient } from "./apiClient";
import { Personnel } from "@/types";
import { mockPersonnel } from "@/data/mock";
import { db } from "@/lib/offline/storage/db";

export const personnelService = {
  async getAllPersonnel(): Promise<Personnel[]> {
    try {
      return await apiClient.get<Personnel[]>("/personnel");
    } catch {
      try {
        const cached = await db.personnel.toArray();
        if (cached.length > 0) return cached;
      } catch {}
      return mockPersonnel;
    }
  },
  async getPersonnelById(id: string): Promise<Personnel | undefined> {
    try {
      return await apiClient.get<Personnel>(`/personnel/${id}`);
    } catch {
      try {
        const cached = await db.personnel.get(id);
        if (cached) return cached;
      } catch {}
      return mockPersonnel.find((p) => p.id === id);
    }
  },
};
