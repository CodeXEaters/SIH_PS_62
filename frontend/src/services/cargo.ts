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
  const numericId = typeof c.id === "number" ? c.id : undefined;
  const cargoCode = c.cargo_code || (typeof c.id === "string" ? c.id : `CRG-2026-${String(c.id).padStart(3, "0")}`);
  const qrCode = c.qr_code || `DHRUV:CARGO:${cargoCode}`;

  return {
    id: cargoCode,
    dbId: numericId,
    rawId: numericId,
    cargo_code: cargoCode,
    qr_code: qrCode,
    description: c.name || c.description || `Cargo Package ${cargoCode}`,
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
    qrCode: qrCode,
    lastScannedAt: c.updated_at || c.created_at,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
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
    id: string | number,
    status: CargoItem["status"],
    location?: string
  ): Promise<CargoItem> {
    const backendStatus = normalizeToBackendCargoStatus(status);
    try {
      let targetId: number;
      if (typeof id === "number") {
        targetId = id;
      } else if (/^\d+$/.test(id)) {
        targetId = parseInt(id, 10);
      } else {
        const found = await this.getCargoById(id);
        const resolvedId = found?.dbId ?? found?.rawId;
        if (typeof resolvedId === "number") {
          targetId = resolvedId;
        } else {
          throw new Error(`Unable to resolve database ID for cargo '${id}'`);
        }
      }

      const res = await apiClient.patch<any>(`/cargo/${targetId}/status`, {
        status: backendStatus,
        current_location: location,
      });
      return mapBackendCargoToCargoItem(res);
    } catch (err: any) {
      if (err?.isOffline) {
        const cached = await db.cargo.get(String(id));
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

  async resolveCargoByQr(qrPayload: string): Promise<ResolvedCargoRecord | null> {
    const clean = qrPayload.trim();
    if (!clean) return null;

    console.log("Decoded QR:", clean);

    // 1. If payload contains or is a cargo code like CRG-2026-072, query backend directly
    const codeMatch = clean.match(/CRG-\d{4}-\d+/i);
    if (codeMatch) {
      const code = codeMatch[0].toUpperCase();
      try {
        const backendCargo = await apiClient.get<any>(`/cargo/${code}`);
        if (backendCargo && typeof backendCargo.id === "number") {
          const mapped = mapBackendCargoToCargoItem(backendCargo);
          console.log("Resolved cargo:", {
            id: backendCargo.id,
            cargo_code: backendCargo.cargo_code,
            qr_code: backendCargo.qr_code,
          });
          return {
            id: backendCargo.id,
            cargo_code: backendCargo.cargo_code,
            qr_code: backendCargo.qr_code,
            rawId: backendCargo.id,
            cargo: mapped,
          };
        }
      } catch (err) {
        console.warn(`Direct backend lookup for '${code}' did not match:`, err);
      }
    }

    // 2. Search in all cargo from backend / cache
    const all = await this.getAllCargo();
    for (const c of all) {
      const dbId = c.dbId ?? c.rawId;
      const cargoCode = c.cargo_code || c.id;
      const qrCode = c.qr_code || c.qrCode;

      if (
        qrCode === clean ||
        cargoCode === clean ||
        `DHRUV:CARGO:${cargoCode}` === clean ||
        clean.endsWith(cargoCode) ||
        (typeof dbId === "number" && (`${dbId}` === clean || `DHRUV:CARGO:${dbId}` === clean))
      ) {
        if (typeof dbId === "number" && !isNaN(dbId) && dbId > 0) {
          console.log("Resolved cargo:", {
            id: dbId,
            cargo_code: cargoCode,
            qr_code: qrCode,
          });
          return {
            id: dbId,
            cargo_code: cargoCode,
            qr_code: qrCode,
            rawId: dbId,
            cargo: c,
          };
        }
      }
    }

    console.warn("QR payload could not be resolved to any cargo:", clean);
    return null;
  },

  async scanCargo(
    cargoId: number,
    qrOrOptions: string | ScanCargoOptions,
    maybeOptions?: string | ScanCargoOptions
  ): Promise<{ message: string; cargo: CargoItem; event?: any }> {
    if (typeof cargoId !== "number" || isNaN(cargoId) || cargoId <= 0) {
      throw new Error(`Invalid cargo database ID: ${cargoId}. Expected a positive integer.`);
    }

    let payload: {
      qr_code: string;
      location: string;
      station_id?: number;
      event_type?: string;
      remarks?: string;
      latitude?: number;
      longitude?: number;
    };

    if (typeof qrOrOptions === "object" && qrOrOptions !== null) {
      payload = {
        qr_code: qrOrOptions.qr_code || `CRG-${cargoId}`,
        location: qrOrOptions.location || "Polar Transit Terminal",
        station_id: qrOrOptions.station_id,
        event_type: qrOrOptions.event_type || "SCANNED",
        remarks: qrOrOptions.remarks,
        latitude: qrOrOptions.latitude,
        longitude: qrOrOptions.longitude,
      };
    } else {
      const qrCode = qrOrOptions;
      if (typeof maybeOptions === "string") {
        payload = {
          qr_code: qrCode,
          location: maybeOptions || "Polar Transit Terminal",
          event_type: "SCANNED",
        };
      } else if (typeof maybeOptions === "object" && maybeOptions !== null) {
        payload = {
          qr_code: qrCode,
          location: maybeOptions.location || "Polar Transit Terminal",
          station_id: maybeOptions.station_id,
          event_type: maybeOptions.event_type || "SCANNED",
          remarks: maybeOptions.remarks,
          latitude: maybeOptions.latitude,
          longitude: maybeOptions.longitude,
        };
      } else {
        payload = {
          qr_code: qrCode,
          location: "Polar Transit Terminal",
          event_type: "SCANNED",
        };
      }
    }

    console.log(`Final request: POST /api/v1/cargo/${cargoId}/scan`, {
      cargo_id: cargoId,
      payload,
    });

    const res = await apiClient.post<any>(`/cargo/${cargoId}/scan`, payload);
    const updated = await this.getCargoById(String(cargoId));
    return {
      message: res?.message || `Scan recorded at ${payload.location}`,
      cargo: updated || mapBackendCargoToCargoItem(res),
      event: res?.event,
    };
  },

  async createCargo(data: CreateCargoInput): Promise<{ cargo: CargoItem; raw: BackendCargoCreated }> {
    const res = await apiClient.post<BackendCargoCreated>("/cargo", data);
    const mapped = mapBackendCargoToCargoItem(res);
    return {
      cargo: mapped,
      raw: res,
    };
  },

  async getCargoTimeline(id: string | number): Promise<any> {
    const target = typeof id === "number" ? id : String(id).trim();
    try {
      return await apiClient.get<any>(`/cargo/${target}/timeline`);
    } catch (err: any) {
      if (err?.isOffline) {
        return {
          cargo_id: target,
          cargo_code: `CRG-${target}`,
          events: [],
        };
      }
      throw err;
    }
  },
};

export interface ResolvedCargoRecord {
  id: number;
  cargo_code: string;
  qr_code: string;
  rawId: number;
  cargo: CargoItem;
}

export interface CreateCargoInput {
  name: string;
  category: "SCIENTIFIC" | "MEDICAL" | "FUEL" | "FOOD" | "EQUIPMENT";
  weight: number;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  origin_station_id: number;
  destination_station_id: number;
  current_location?: string;
}

export interface BackendCargoCreated {
  id: number;
  cargo_code: string;
  name: string;
  category: string;
  weight: number;
  priority: string;
  origin_station_id: number;
  destination_station_id: number;
  status: string;
  current_location: string;
  qr_code: string;
  created_at: string;
}

export interface ScanCargoOptions {
  qr_code?: string;
  location?: string;
  station_id?: number;
  event_type?: string;
  remarks?: string;
  latitude?: number;
  longitude?: number;
}




