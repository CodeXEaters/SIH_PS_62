import { apiClient } from "./apiClient";
import { Asset } from "@/types";

function mapBackendAssetToAsset(a: any): Asset {
  const stationId = a.station_id === 2 ? "maitri" : "bharati";
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
    condition: cond,
    utilizationPct: 82,
    operatingHours: 1450,
    lastMaintenance: String(a.last_maintenance || "2026-01-15"),
    nextMaintenance: String(a.next_maintenance || "2026-04-15"),
    fuelLevelPct: 85,
    batteryHealthPct: Math.round(a.health_score || 92),
    criticalSparePartsAvailable: true,
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
