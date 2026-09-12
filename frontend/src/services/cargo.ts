import { apiClient } from "./apiClient";
import { CargoItem } from "@/types";
import { db } from "@/lib/offline/storage/db";
import { queueOfflineAction, cacheEntityData } from "@/lib/offline/sync/syncEngine";

function mapBackendCargoToCargoItem(c: any): CargoItem {
  return {
    id: c.cargo_code || String(c.id),
    description: c.name || c.description || `Cargo Package ${c.cargo_code || c.id}`,
    owner: c.owner || "NCPOR Logistics Wing",
    category:
      c.category === "FUEL"
        ? "Fuel & Power"
        : c.category === "SCIENTIFIC"
        ? "Scientific Instrumentation"
        : c.category === "MEDICAL"
        ? "Medical Supplies"
        : c.category === "PROVISIONS"
        ? "Life Support & Rations"
        : "Heavy Machinery Spares",
    weightKg: c.weight ?? 0.0,
    dimensionsM: c.dimensionsM || "Standard Container",
    hazardClass: c.hazardClass || "NON-HAZARDOUS",
    origin:
      c.origin ||
      (c.origin_station_id === 1
        ? "Bharati Station"
        : c.origin_station_id === 2
        ? "Maitri Station"
        : "Cape Town Staging"),
    destination:
      c.destination ||
      (c.destination_station_id === 2 ? "Maitri Station" : "Bharati Station"),
    currentLocation: c.current_location || c.currentLocation || "In Transit",
    status: c.status,
    eta: c.eta || "Pending ETA",
    riskLevel:
      c.riskLevel ||
      (c.priority === "CRITICAL"
        ? "CRITICAL"
        : c.priority === "HIGH"
        ? "HIGH"
        : "LOW"),
    transportMode: c.transportMode || "Maritime Vessel",
    timeline: c.timeline || [],
    qrCode: c.qr_code || `CRG-${c.id}`,
    lastScannedAt: c.created_at,
  };
}

export const cargoService = {
  async getAllCargo(): Promise<CargoItem[]> {
    try {
      const backendData = await apiClient.get<any[]>("/cargo");
      const mapped = backendData.map(mapBackendCargoToCargoItem);
      await cacheEntityData("cargo", mapped);
      return mapped;
    } catch (err: any) {
      if (err?.isOffline) {
        try {
          const cached = await db.cargo.toArray();
          if (cached.length > 0) return cached;
        } catch {
          // Dexie read error
        }
      }
      throw err;
    }
  },

  async getCargoById(id: string): Promise<CargoItem | undefined> {
    try {
      const isNumeric = /^\d+$/.test(id);
      if (isNumeric) {
        const c = await apiClient.get<any>(`/cargo/${id}`);
        return mapBackendCargoToCargoItem(c);
      } else {
        const all = await this.getAllCargo();
        return all.find((c) => c.id === id || c.qrCode === id);
      }
    } catch (err: any) {
      if (err?.isOffline) {
        try {
          const cached = await db.cargo.get(id);
          if (cached) return cached;
        } catch {
          // Dexie read error
        }
      }
      throw err;
    }
  },

  async updateCargoStatus(
    id: string,
    status: CargoItem["status"],
    location?: string
  ): Promise<CargoItem> {
    try {
      const isNumeric = /^\d+$/.test(id);
      const targetId = isNumeric ? id : id.replace(/\D/g, "") || "1";
      const res = await apiClient.patch<any>(`/cargo/${targetId}/status`, {
        status,
        current_location: location,
      });
      return mapBackendCargoToCargoItem(res);
    } catch (err: any) {
      if (err?.isOffline) {
        const cached = await db.cargo.get(id);
        if (cached) {
          cached.status = status;
          if (location) cached.currentLocation = location;
          await db.cargo.put(cached);
          await queueOfflineAction({
            type: "PATCH",
            endpoint: `/cargo/${id}/status`,
            payload: { status, current_location: location },
          });
          return cached;
        }
      }
      throw err;
    }
  },
};
