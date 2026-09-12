import { apiClient } from "./apiClient";
import { InventoryItem } from "@/types";
import { db } from "@/lib/offline/storage/db";
import { cacheEntityData } from "@/lib/offline/sync/syncEngine";

function mapBackendInventoryToItem(inv: any): InventoryItem {
  const days =
    inv.daily_consumption && inv.daily_consumption > 0
      ? Math.max(0, Math.round(inv.quantity / inv.daily_consumption))
      : 99;

  let categoryMapped: InventoryItem["category"] = "Station Infrastructure";
  const cat = (inv.category || "").toUpperCase();
  if (cat.includes("FUEL") || cat.includes("POWER")) {
    categoryMapped = "Fuel & Power";
  } else if (cat.includes("FOOD") || cat.includes("LIFE") || cat.includes("RATION") || cat.includes("PROVISION")) {
    categoryMapped = "Life Support";
  } else if (cat.includes("MED") || cat.includes("PHARMA")) {
    categoryMapped = "Medical & Pharma";
  } else if (cat.includes("VEHICLE") || cat.includes("SPARE")) {
    categoryMapped = "Vehicle Spares";
  }

  const stationId = inv.station_id === 2 ? "maitri" : "bharati";
  const status: InventoryItem["status"] =
    inv.quantity <= inv.minimum_threshold || days <= 5
      ? "Critical"
      : days <= 15
      ? "Low"
      : days <= 30
      ? "Adequate"
      : "Optimal";

  const daily = inv.daily_consumption || 10;
  const history = Array.from({ length: 7 }, (_, idx) => ({
    day: `D+${idx + 1}`,
    projected: Math.max(0, Math.round(inv.quantity - daily * (idx + 1))),
    threshold: inv.minimum_threshold || 100,
  }));

  return {
    id: String(inv.id),
    name: inv.item_name || `Inventory Item ${inv.id}`,
    category: categoryMapped,
    stationId,
    currentStock: inv.quantity ?? 0,
    unit: inv.unit || "units",
    dailyConsumption: daily,
    daysRemaining: days,
    safetyStockDays: 14,
    status,
    storageLocation: `${stationId.toUpperCase()} Core Storage Bay`,
    minimumThreshold: inv.minimum_threshold || 50,
    replenishmentETA: "2026-03-25",
    forecastHistory: history,
  };
}

export const inventoryService = {
  async getAllInventory(): Promise<InventoryItem[]> {
    try {
      const backendData = await apiClient.get<any[]>("/inventory");
      const mapped = backendData.map(mapBackendInventoryToItem);
      await cacheEntityData("inventory", mapped);
      return mapped;
    } catch (err: any) {
      if (err?.isOffline) {
        try {
          const cached = await db.inventory.toArray();
          if (cached.length > 0) return cached;
        } catch {
          // Dexie error
        }
      }
      throw err;
    }
  },

  async getInventoryById(id: string): Promise<InventoryItem | undefined> {
    try {
      const isNumeric = /^\d+$/.test(id);
      if (isNumeric) {
        const inv = await apiClient.get<any>(`/inventory/${id}`);
        return mapBackendInventoryToItem(inv);
      } else {
        const all = await this.getAllInventory();
        return all.find((i) => i.id === id);
      }
    } catch (err: any) {
      if (err?.isOffline) {
        try {
          const cached = await db.inventory.get(id);
          if (cached) return cached;
        } catch {
          // Dexie error
        }
      }
      throw err;
    }
  },

  async getForecastByStation(stationId: string): Promise<InventoryItem[]> {
    const all = await this.getAllInventory();
    return all.filter((i) => i.stationId === stationId.toLowerCase());
  },
};
