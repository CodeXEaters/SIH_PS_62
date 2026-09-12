import { apiClient } from "./apiClient";
import { CargoItem } from "@/types";
import { mockCargoItems } from "@/data/mock";
import { db } from "@/lib/offline/storage/db";
import { queueOfflineAction } from "@/lib/offline/sync/syncEngine";

export const cargoService = {
  async getAllCargo(): Promise<CargoItem[]> {
    try {
      return await apiClient.get<CargoItem[]>("/cargo");
    } catch {
      try {
        const cached = await db.cargo.toArray();
        if (cached.length > 0) return cached;
      } catch {
        // Dexie fallback
      }
      return mockCargoItems;
    }
  },
  async getCargoById(id: string): Promise<CargoItem | undefined> {
    try {
      return await apiClient.get<CargoItem>(`/cargo/${id}`);
    } catch {
      try {
        const cached = await db.cargo.get(id);
        if (cached) return cached;
      } catch {
        // Dexie fallback
      }
      return mockCargoItems.find((c) => c.id === id);
    }
  },
  async updateCargoStatus(id: string, status: CargoItem["status"], location?: string): Promise<CargoItem> {
    try {
      return await apiClient.patch<CargoItem>(`/cargo/${id}/status`, { status, location });
    } catch {
      // Local optimistic update
      const item = mockCargoItems.find((c) => c.id === id);
      if (item) {
        item.status = status;
        if (location) item.currentLocation = location;
        try {
          await db.cargo.put(item);
          await queueOfflineAction({
            type: "PATCH",
            endpoint: `/cargo/${id}/status`,
            payload: { status, location },
          });
        } catch {}
        return item;
      }
      throw new Error("Cargo not found");
    }
  },
};
