import { apiClient } from "./apiClient";
import { InventoryItem } from "@/types";
import { mockInventory } from "@/data/mock";
import { db } from "@/lib/offline/storage/db";

export const inventoryService = {
  async getAllInventory(): Promise<InventoryItem[]> {
    try {
      return await apiClient.get<InventoryItem[]>("/inventory");
    } catch {
      try {
        const cached = await db.inventory.toArray();
        if (cached.length > 0) return cached;
      } catch {}
      return mockInventory;
    }
  },
  async getInventoryById(id: string): Promise<InventoryItem | undefined> {
    try {
      return await apiClient.get<InventoryItem>(`/inventory/${id}`);
    } catch {
      try {
        const cached = await db.inventory.get(id);
        if (cached) return cached;
      } catch {}
      return mockInventory.find((i) => i.id === id);
    }
  },
  async getForecastByStation(stationId: string): Promise<InventoryItem[]> {
    const all = await this.getAllInventory();
    return all.filter((i) => i.stationId === stationId);
  },
};
