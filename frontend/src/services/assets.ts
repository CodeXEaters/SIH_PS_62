import { apiClient } from "./apiClient";
import { Asset } from "@/types";
import { getStationSlug } from "./stations";

function mapBackendAssetToAsset(a: any): Asset {
  const stationId = typeof a.station_id === "number" ? a.station_id : 4;
  const stationSlug = getStationSlug(a.station_id);
  let cat: Asset["category"] = "Vehicles";
  const rawType = (a.asset_type || "").toUpperCase();
  if (rawType.includes("GENERATOR") || rawType.includes("POWER")) {
    cat = "Generators";
  } else if (rawType.includes("COMM") || rawType.includes("RADIO")) {
    cat = "Communication Equipment";
  } else if (rawType.includes("SCIENCE") || rawType.includes("INSTRUMENT")) {
    cat = "Scientific Equipment";
  } else if (rawType.includes("MED")) {
    cat = "Medical Equipment";
  }

  let cond: Asset["condition"] = "Operational";
  const st = (a.status || "").toUpperCase();
  if (st.includes("MAINT") || st.includes("DUE")) cond = "Maintenance Due";
  else if (st.includes("REPAIR")) cond = "Under Repair";
  else if (st.includes("OFFLINE") || st.includes("DECOMMISSIONED")) cond = "Offline";

  return {
    id: String(a.id),
    name: a.asset_name || `Polar Asset ${a.id}`,
    category: cat,
    stationId,
    stationSlug,
    condition: cond,
    utilizationPct: a.utilization_pct ?? 0,
    operatingHours: a.operating_hours ?? 0,
    lastMaintenance: a.last_maintenance ? String(a.last_maintenance) : "Unrecorded",
    nextMaintenance: a.next_maintenance ? String(a.next_maintenance) : "Unscheduled",
    fuelLevelPct: a.fuel_level_pct ?? undefined,
    batteryHealthPct: a.health_score != null ? Math.round(a.health_score) : undefined,
    criticalSparePartsAvailable: Boolean(a.critical_spare_parts_available),
  };
}

export const assetsService = {
  async getAllAssets(): Promise<Asset[]> {
    const backendData = await apiClient.get<any[]>("/assets");
    return backendData.map(mapBackendAssetToAsset);
  },

  async getAssetById(id: string): Promise<Asset | undefined> {
    const isNumeric = /^\d+$/.test(id);
    if (isNumeric) {
      const a = await apiClient.get<any>(`/assets/${id}`);
      return mapBackendAssetToAsset(a);
    } else {
      const all = await this.getAllAssets();
      return all.find((a) => a.id === id);
    }
  },
};
