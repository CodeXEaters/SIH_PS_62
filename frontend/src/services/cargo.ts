import { apiClient } from "./apiClient";
import { CargoItem } from "@/types";
import { db } from "@/lib/offline/storage/db";
import { queueOfflineAction, cacheEntityData } from "@/lib/offline/sync/syncEngine";
import { getStationName } from "./stations";

function normalizeToBackendCargoStatus(status: string): string {
  const s = (status || "").toUpperCase().replace(/\s+/g, "_");
  if (s === "RECEIVED") return "ARRIVED";
  if (s === "LOADED") return "DISPATCHED";
  if (s === "BOOKED") return "PLANNED";
  if (s === "IN_TRANSIT" || s === "INTRANSIT") return "IN_TRANSIT";
  if (["PLANNED", "PACKED", "DISPATCHED", "IN_TRANSIT", "DELAYED", "ARRIVED", "DELIVERED"].includes(s)) {
    return s;
  }
  return "IN_TRANSIT";
}

function mapBackendCargoToCargoItem(c: any): CargoItem {
  return {
    id: c.cargo_code || String(c.id),
    rawId: typeof c.id === "number" ? c.id : undefined,
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
      (c.origin_station_id ? getStationName(c.origin_station_id) : "Cape Town Staging"),
    destination:
      c.destination ||
      (c.destination_station_id ? getStationName(c.destination_station_id) : "Bharati Station"),
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
    const backendStatus = normalizeToBackendCargoStatus(status);
    try {
      const isNumeric = /^\d+$/.test(id);
      const targetId = isNumeric ? id : id.replace(/\D/g, "") || "1";
      const res = await apiClient.patch<any>(`/cargo/${targetId}/status`, {
        status: backendStatus,
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
            payload: { status: backendStatus, current_location: location },
          });
          return cached;
        }
      }
      throw err;
    }
  },

  async resolveCargoByQr(qrPayload: string): Promise<{ cargo: CargoItem; rawId: number } | null> {
    const clean = qrPayload.trim();
    const all = await this.getAllCargo();
    for (const c of all) {
      if (
        c.qrCode === clean ||
        c.id === clean ||
        `DHRUV:CARGO:${c.id}` === clean ||
        clean.endsWith(c.id) ||
        (c.rawId && (String(c.rawId) === clean || `DHRUV:CARGO:${c.rawId}` === clean))
      ) {
        return {
          cargo: c,
          rawId: c.rawId || Number(c.id.replace(/\D/g, "")) || 1,
        };
      }
    }
    return null;
  },

  async scanCargo(
    cargoId: number,
    qrCode: string,
    location: string = "Polar Transit Terminal"
  ): Promise<{ message: string; cargo: CargoItem }> {
    const res = await apiClient.post<any>(`/cargo/${cargoId}/scan`, {
      qr_code: qrCode,
      location,
      event_type: "SCANNED",
    });
    const updated = await this.getCargoById(String(cargoId));
    return {
      message: res?.message || `Scan recorded at ${location}`,
      cargo: updated || mapBackendCargoToCargoItem(res),
    };
  },

  async getCargoTimeline(id: string | number): Promise<any> {
    const numericId = typeof id === "number" ? id : parseInt(String(id).replace(/\D/g, ""), 10) || 1;
    try {
      return await apiClient.get<any>(`/cargo/${numericId}/timeline`);
    } catch (err: any) {
      if (err?.isOffline) {
        return {
          cargo_id: numericId,
          cargo_code: `CRG-${numericId}`,
          events: [],
        };
      }
      throw err;
    }
  },
};
