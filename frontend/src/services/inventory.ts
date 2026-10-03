import { apiClient } from "./apiClient";
import { InventoryItem } from "@/types";
import { db } from "@/lib/offline/storage/db";
import { cacheEntityData } from "@/lib/offline/sync/syncEngine";
import { getStationSlug, getStationName } from "./stations";

function mapBackendInventoryToItem(inv: any, forecast?: any): InventoryItem {
  // Canonical source: Backend Intelligence Inventory Forecast (/intelligence/forecast/inventory)
  let days: number;
  let status: InventoryItem["status"];
  let replenishmentETA: string;

  if (forecast) {
    days = Math.max(0, Math.round(forecast.days_remaining ?? 0));
    const urg = (forecast.urgency || "").toUpperCase();
    if (forecast.is_critical || urg === "CRITICAL") {
      status = "Critical";
    } else if (urg === "LOW") {
      status = "Low";
    } else if (urg === "ADEQUATE" || urg === "NOMINAL") {
      status = "Adequate";
    } else {
      status = "Optimal";
    }

    if (forecast.replenishment_recommendation) {
      replenishmentETA = forecast.replenishment_recommendation;
    } else if (forecast.projected_stockout_date) {
      replenishmentETA = `Projected Stockout: ${forecast.projected_stockout_date}`;
    } else if (days <= 15) {
      replenishmentETA = "Priority Airlift Requested";
    } else {
      replenishmentETA = "Voyage 46 Resupply (Nov 2026)";
    }
  } else {
    /* ---------------------------------------------------------------------------
     * INTENTIONAL OFFLINE FALLBACK:
     * When offline or disconnected from backend intelligence, estimate burn rate
     * locally using inventory quantity and daily consumption baseline.
     * --------------------------------------------------------------------------- */
    days =
      inv.daily_consumption && inv.daily_consumption > 0
        ? Math.max(0, Math.round(inv.quantity / inv.daily_consumption))
        : 0;

    status =
      (inv.quantity ?? 0) <= (inv.minimum_threshold ?? 0) || (days > 0 && days <= 5)
        ? "Critical"
        : days > 0 && days <= 15
        ? "Low"
        : days > 0 && days <= 30
        ? "Adequate"
        : (inv.quantity ?? 0) > 0
        ? "Optimal"
        : "Critical";

    replenishmentETA =
      inv.replenishment_eta
        ? String(inv.replenishment_eta)
        : days > 0 && days <= 15
        ? "Priority Airlift Requested"
        : days > 0 && days <= 45
        ? "Voyage 46 Resupply (Nov 2026)"
        : "Nominal Stock Reserves";
  }

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

  const stationId = typeof inv.station_id === "number" ? inv.station_id : 4;
  const stationSlug = getStationSlug(inv.station_id);
  const stationName = getStationName(inv.station_id);

  const daily = inv.daily_consumption ?? 0;
  const history = Array.from({ length: 7 }, (_, idx) => ({
    day: `D+${idx + 1}`,
    projected: Math.max(0, Math.round(inv.quantity - daily * (idx + 1))),
    threshold: inv.minimum_threshold || 0,
  }));

  return {
    id: String(inv.id),
    name: inv.item_name || `Inventory Item ${inv.id}`,
    category: categoryMapped,
    stationId,
    stationSlug,
    currentStock: inv.quantity ?? 0,
    unit: inv.unit || "units",
    dailyConsumption: daily,
    daysRemaining: days,
    safetyStockDays:
      inv.minimum_threshold && daily > 0
        ? Math.round(inv.minimum_threshold / daily)
        : 0,
    status,
    storageLocation: `${stationName} Core Storage Bay`,
    minimumThreshold: inv.minimum_threshold ?? 0,
    replenishmentETA,
    expiryDate: inv.expiry_date ? String(inv.expiry_date) : undefined,
    forecastHistory: history,
  };
}

export const inventoryService = {
  async getAllInventory(): Promise<InventoryItem[]> {
    try {
      const [backendDataRes, forecastRes] = await Promise.allSettled([
        apiClient.get<any[]>("/inventory"),
        apiClient.get<any[]>("/intelligence/forecast/inventory"),
      ]);

      const backendData = backendDataRes.status === "fulfilled" && Array.isArray(backendDataRes.value) ? backendDataRes.value : [];
      const forecasts = forecastRes.status === "fulfilled" && Array.isArray(forecastRes.value) ? forecastRes.value : [];
      const forecastMap = new Map<number, any>();
      for (const fc of forecasts) {
        if (fc.inventory_id) forecastMap.set(fc.inventory_id, fc);
      }

      const mapped = backendData.map((inv: any) => mapBackendInventoryToItem(inv, forecastMap.get(inv.id)));
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
        const [invRes, forecastRes] = await Promise.allSettled([
          apiClient.get<any>(`/inventory/${id}`),
          apiClient.get<any[]>("/intelligence/forecast/inventory"),
        ]);
        const inv = invRes.status === "fulfilled" ? invRes.value : null;
        if (!inv) return undefined;
        const forecasts = forecastRes.status === "fulfilled" && Array.isArray(forecastRes.value) ? forecastRes.value : [];
        const forecast = forecasts.find((f: any) => f.inventory_id === inv.id);
        return mapBackendInventoryToItem(inv, forecast);
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
    return all.filter((i) => i.stationSlug === stationId.toLowerCase() || String(i.stationId) === stationId);
  },

  async getInventoryTransfers(): Promise<Array<{
    id: string;
    item: string;
    quantity: string;
    from: string;
    to: string;
    status: string;
    timestamp: string;
    officer: string;
    notes?: string;
  }>> {
    try {
      const data = await apiClient.get<any[]>("/inventory/transfers");
      return (data || []).map((t) => ({
        id: t.id,
        item: t.item,
        quantity: t.quantity,
        from: t.from_location,
        to: t.to_location,
        status: t.status,
        timestamp: t.timestamp,
        officer: t.officer,
        notes: t.notes,
      }));
    } catch (err: any) {
      if (err?.isOffline) {
        return [];
      }
      throw err;
    }
  },

  async createInventoryItem(payload: {
    item_name: string;
    category: string;
    station_id: number;
    quantity: number;
    minimum_threshold: number;
    daily_consumption: number;
    unit: string;
    expiry_date?: string;
  }): Promise<InventoryItem> {
    try {
      const res = await apiClient.post<any>("/inventory", payload);
      return mapBackendInventoryToItem(res);
    } catch (err: any) {
      if (err?.isOffline) {
        const { queueOfflineAction } = await import("@/lib/offline/sync/syncEngine");
        await queueOfflineAction({
          type: "INVENTORY_CREATE",
          endpoint: "/inventory",
          method: "POST",
          payload,
        });
        return mapBackendInventoryToItem({
          id: Date.now(),
          ...payload,
        });
      }
      throw err;
    }
  },

  async createTransfer(payload: {
    item_id: number;
    from_station_id: number;
    to_station_id: number;
    quantity: number;
    notes?: string;
  }): Promise<any> {
    try {
      return await apiClient.post<any>("/inventory/transfers", payload);
    } catch (err: any) {
      if (err?.isOffline) {
        const { queueOfflineAction } = await import("@/lib/offline/sync/syncEngine");
        await queueOfflineAction({
          type: "INVENTORY_TRANSFER",
          endpoint: "/inventory/transfers",
          method: "POST",
          payload,
        });
        return {
          id: `TRF-${Date.now()}`,
          item: `Item #${payload.item_id}`,
          quantity: `${payload.quantity} units`,
          from_location: `Station #${payload.from_station_id}`,
          to_location: `Station #${payload.to_station_id}`,
          status: "QUEUED_OFFLINE",
          timestamp: new Date().toISOString(),
          officer: "Field Officer (Offline)",
          notes: payload.notes,
        };
      }
      throw err;
    }
  },
};

