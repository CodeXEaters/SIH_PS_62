import { apiClient } from "./apiClient";
import { Expedition, Station } from "@/types";
import { mockExpedition, mockStations } from "@/data/mock";

function mapBackendStationToStation(s: any): Station {
  const isMaitri = (s.name || "").toLowerCase().includes("maitri");
  const id: Station["id"] = isMaitri ? "maitri" : "bharati";
  return {
    id,
    name: s.name,
    coordinates: {
      lat: s.latitude,
      lng: s.longitude,
    },
    elevation: isMaitri ? "117 m" : "35 m",
    locationName:
      s.location ||
      (isMaitri
        ? "Schirmacher Oasis, Queen Maud Land"
        : "Larsemann Hills, Princess Elizabeth Land"),
    established: isMaitri ? 1989 : 2012,
    capacity: isMaitri ? 25 : 47,
    currentOccupancy: isMaitri ? 23 : 42,
    status:
      s.status === "OPERATIONAL"
        ? "OPERATIONAL"
        : s.status === "MAINTENANCE"
        ? "MAINTENANCE"
        : "INCIDENT",
    weather: {
      temperatureC: isMaitri ? -18.4 : -14.2,
      feelsLikeC: isMaitri ? -28.0 : -24.5,
      windSpeedKts: isMaitri ? 28 : 34,
      windDirection: isMaitri ? "ESE" : "SSE",
      barometricPressureHpa: 984,
      visibilityKm: 12,
      condition: "BLIZZARD_WARNING",
      blizzardRisk: "MODERATE",
      lastUpdated: "10 mins ago",
    },
  };
}

export const expeditionService = {
  async getActiveExpedition(): Promise<Expedition> {
    try {
      const exp = await apiClient.get<any>("/expeditions/active");
      return {
        id: exp.id || exp.code || "ISEA-46",
        name: exp.name || "46th Indian Scientific Expedition to Antarctica",
        shortName: exp.shortName || exp.short_name || "46th ISEA",
        season: exp.season || "2025-2026 Austral Summer/Winter",
        status: exp.status || "ACTIVE",
        startDate: exp.startDate || exp.start_date || "2025-11-01",
        endDate: exp.endDate || exp.end_date || "2026-04-30",
        leader: exp.leader || "Dr. Arvind Sharan (NCPOR)",
        vessel: exp.vessel || "MV Vasiliy Golovnin",
        personnelCount: exp.personnelCount ?? exp.personnel_count ?? 68,
        cargoTonnage: exp.cargoTonnage ?? exp.cargo_tonnage ?? 1842,
        activeMissionsCount:
          exp.activeMissionsCount ?? exp.active_missions_count ?? 3,
        overallReadinessPct:
          exp.overallReadinessPct ?? exp.overall_readiness_pct ?? 91.4,
        milestones: exp.milestones || mockExpedition.milestones,
      };
    } catch (err: any) {
      if (err?.isOffline) {
        return mockExpedition;
      }
      throw err;
    }
  },

  async getExpeditionById(id: string): Promise<Expedition | null> {
    try {
      return await apiClient.get<Expedition>(`/expeditions/${id}`);
    } catch (err: any) {
      if (err?.isOffline) {
        return mockExpedition.id === id ? mockExpedition : null;
      }
      throw err;
    }
  },

  async getStations(): Promise<Station[]> {
    try {
      const backendStations = await apiClient.get<any[]>("/stations");
      const mapped = backendStations.map(mapBackendStationToStation);
      // Ensure unique by id if multiple backend stations share station type
      const unique = Array.from(new Map(mapped.map((s) => [s.id, s])).values());
      return unique.length > 0 ? unique : mockStations;
    } catch (err: any) {
      if (err?.isOffline) {
        return mockStations;
      }
      throw err;
    }
  },

  async getStationById(id: string): Promise<Station | undefined> {
    try {
      const stations = await this.getStations();
      return stations.find((s) => s.id === id.toLowerCase());
    } catch (err: any) {
      if (err?.isOffline) {
        return mockStations.find((s) => s.id === id);
      }
      throw err;
    }
  },
};
