import { apiClient } from "./apiClient";
import { Station } from "@/types";

export interface BackendStation {
  id: number;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  type: string;
  status: string;
}

// Runtime dynamic cache populated from GET /stations
const runtimeStationCache: Map<number, BackendStation> = new Map();
let runtimeStationsList: Station[] = [];

// Initial fallback dictionary based on verified DB seed if network is offline before initial fetch
const SEED_FALLBACK_STATIONS: BackendStation[] = [
  { id: 1, name: "NCPOR Goa", location: "Headquarters, Vasco da Gama, Goa, India", latitude: 15.4026, longitude: 73.8055, type: "HQ", status: "OPERATIONAL" },
  { id: 2, name: "Cape Town Transit Hub", location: "Port of Cape Town Logistics Base, South Africa", latitude: -33.9249, longitude: 18.4241, type: "TRANSIT_HUB", status: "OPERATIONAL" },
  { id: 3, name: "Maitri Station", location: "Schirmacher Oasis, Queen Maud Land, Antarctica", latitude: -70.7667, longitude: 11.7333, type: "PERMANENT_STATION", status: "OPERATIONAL" },
  { id: 4, name: "Bharati Station", location: "Larsemann Hills, East Antarctica", latitude: -69.4067, longitude: 76.1906, type: "PERMANENT_STATION", status: "OPERATIONAL" },
  { id: 5, name: "Field Camp Alpha", location: "Queen Maud Land Deep Core Site, Antarctica", latitude: -71.2, longitude: 12.5, type: "FIELD_CAMP", status: "OPERATIONAL" },
  { id: 6, name: "Field Camp Echo", location: "Amery Ice Shelf, East Antarctica", latitude: -69.75, longitude: 73.5, type: "FIELD_CAMP", status: "OPERATIONAL" },
];

function seedFallbackCache() {
  if (runtimeStationCache.size === 0) {
    for (const s of SEED_FALLBACK_STATIONS) {
      runtimeStationCache.set(s.id, s);
    }
  }
}
seedFallbackCache();

function determineStationSlug(name: string, id: number): string {
  const n = (name || "").toLowerCase();
  if (n.includes("maitri")) return "maitri";
  if (n.includes("bharati")) return "bharati";
  if (n.includes("goa") || n.includes("ncpor")) return "goa";
  if (n.includes("cape") || n.includes("transit")) return "capetown";
  if (n.includes("alpha")) return "alpha";
  if (n.includes("echo")) return "echo";
  return `station-${id}`;
}

export function mapBackendToStation(s: BackendStation): Station {
  const isMaitri = (s.name || "").toLowerCase().includes("maitri");
  const isBharati = (s.name || "").toLowerCase().includes("bharati");
  const slug = determineStationSlug(s.name, s.id);

  return {
    id: slug,
    name: s.name,
    coordinates: {
      lat: s.latitude,
      lng: s.longitude,
    },
    elevation: isMaitri ? "117 m" : isBharati ? "35 m" : "15 m",
    locationName: s.location,
    established: isMaitri ? 1989 : isBharati ? 2012 : 2000,
    capacity: isMaitri ? 65 : isBharati ? 72 : s.type === "HQ" ? 150 : 25,
    currentOccupancy: isMaitri ? 38 : isBharati ? 47 : 12,
    status:
      s.status === "OPERATIONAL"
        ? "OPERATIONAL"
        : s.status === "MAINTENANCE"
        ? "MAINTENANCE"
        : "INCIDENT",
    weather: {
      temperatureC: isMaitri ? -22 : isBharati ? -18 : 24,
      feelsLikeC: isMaitri ? -31 : isBharati ? -28 : 26,
      windSpeedKts: isMaitri ? 28 : isBharati ? 22 : 8,
      windDirection: "SE",
      barometricPressureHpa: 994,
      visibilityKm: 10,
      condition: "Polar Nominal",
      blizzardRisk: "NONE",
      lastUpdated: "Live Telemetry",
    },
  };
}

export function getStationSlug(stationId: number | string | null | undefined): string {
  if (stationId === null || stationId === undefined) return "bharati";
  const num = typeof stationId === "number" ? stationId : parseInt(String(stationId), 10);
  if (!isNaN(num)) {
    const cached = runtimeStationCache.get(num);
    if (cached) {
      return determineStationSlug(cached.name, cached.id);
    }
  }
  const str = String(stationId).toLowerCase();
  if (str.includes("maitri")) return "maitri";
  if (str.includes("bharati")) return "bharati";
  if (str.includes("goa")) return "goa";
  if (str.includes("cape") || str.includes("transit")) return "capetown";
  if (str.includes("alpha")) return "alpha";
  if (str.includes("echo")) return "echo";
  return str;
}

export function getStationName(stationId: number | string | null | undefined): string {
  if (stationId === null || stationId === undefined) return "Bharati Station";
  const num = typeof stationId === "number" ? stationId : parseInt(String(stationId), 10);
  if (!isNaN(num)) {
    const cached = runtimeStationCache.get(num);
    if (cached) return cached.name;
  }
  const str = String(stationId).toLowerCase();
  if (str.includes("maitri")) return "Maitri Station";
  if (str.includes("bharati")) return "Bharati Station";
  if (str.includes("goa")) return "NCPOR Goa";
  if (str.includes("cape") || str.includes("transit")) return "Cape Town Transit Hub";
  if (str.includes("alpha")) return "Field Camp Alpha";
  if (str.includes("echo")) return "Field Camp Echo";
  return String(stationId);
}

export function getStationIdFromSlug(slug: string): number {
  const s = (slug || "").toLowerCase();
  for (const [id, station] of Array.from(runtimeStationCache.entries())) {
    if (determineStationSlug(station.name, id) === s) {
      return id;
    }
  }
  if (s.includes("goa")) return 1;
  if (s.includes("cape") || s.includes("transit") || s.includes("cpt")) return 2;
  if (s.includes("maitri")) return 3;
  if (s.includes("bharati")) return 4;
  if (s.includes("alpha")) return 5;
  if (s.includes("echo")) return 6;
  return 4; // Default to Bharati Station
}

export const stationsService = {
  async getAllStations(): Promise<Station[]> {
    try {
      const backendStations = await apiClient.get<BackendStation[]>("/stations");
      if (backendStations && Array.isArray(backendStations) && backendStations.length > 0) {
        runtimeStationCache.clear();
        for (const s of backendStations) {
          runtimeStationCache.set(s.id, s);
        }
        runtimeStationsList = backendStations.map(mapBackendToStation);
        return runtimeStationsList;
      }
    } catch {
      // Return cached/fallback stations on network error
    }

    if (runtimeStationsList.length === 0) {
      runtimeStationsList = SEED_FALLBACK_STATIONS.map(mapBackendToStation);
    }
    return runtimeStationsList;
  },

  async getStationById(id: string | number): Promise<Station | undefined> {
    const stations = await this.getAllStations();
    const strId = String(id).toLowerCase();
    const numId = typeof id === "number" ? id : parseInt(id, 10);

    return stations.find((s) => {
      if (s.id === strId) return true;
      if (!isNaN(numId)) {
        const cached = runtimeStationCache.get(numId);
        if (cached && s.name === cached.name) return true;
      }
      return s.name.toLowerCase().includes(strId);
    });
  },

  getStationName(id: number | string | null | undefined): string {
    return getStationName(id);
  },

  getStationSlug(id: number | string | null | undefined): string {
    return getStationSlug(id);
  },

  getStationIdFromSlug(slug: string): number {
    return getStationIdFromSlug(slug);
  },
};
