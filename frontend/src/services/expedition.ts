import { apiClient } from "./apiClient";
import { Expedition, Station } from "@/types";

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
    capacity: s.capacity ?? 0,
    currentOccupancy: s.currentOccupancy ?? 0,
    status:
      s.status === "OPERATIONAL"
        ? "OPERATIONAL"
        : s.status === "MAINTENANCE"
        ? "MAINTENANCE"
        : "INCIDENT",
    weather: {
      temperatureC: 0,
      feelsLikeC: 0,
      windSpeedKts: 0,
      windDirection: "N",
      barometricPressureHpa: 1013,
      visibilityKm: 10,
      condition: "Nominal",
      blizzardRisk: "NONE",
      lastUpdated: "Sensor Offline",
    },
  };
}

export const expeditionService = {
  async getActiveExpedition(): Promise<Expedition> {
    const exp = await apiClient.get<any>("/expeditions/active");
    return {
      id: exp.id || exp.code || "ISEA-46",
      name: exp.name || "46th Indian Scientific Expedition to Antarctica",
      shortName: exp.shortName || exp.short_name || "46th ISEA",
      season: exp.season || "2026-2027 Austral Season",
      status: exp.status || "ACTIVE",
      startDate: exp.startDate || exp.start_date || "2026-11-15",
      endDate: exp.endDate || exp.end_date || "2027-04-10",
      leader: exp.leader || "Dr. Arvind Sharan (Scientist 'G', NCPOR)",
      vessel: exp.vessel || "MV Vasiliy Golovnin (Charter Icebreaker)",
      personnelCount: exp.personnelCount ?? exp.personnel_count ?? 0,
      cargoTonnage: exp.cargoTonnage ?? exp.cargo_tonnage ?? 0,
      activeMissionsCount:
        exp.activeMissionsCount ?? exp.active_missions_count ?? 0,
      overallReadinessPct:
        exp.overallReadinessPct ?? exp.overall_readiness_pct ?? 0,
      milestones: exp.milestones || [],
    };
  },

  async getExpeditionById(id: string): Promise<Expedition | null> {
    return await apiClient.get<Expedition>(`/expeditions/${id}`);
  },

  async getStations(): Promise<Station[]> {
    const backendStations = await apiClient.get<any[]>("/stations");
    const mapped = backendStations.map(mapBackendStationToStation);
    const unique = Array.from(new Map(mapped.map((s) => [s.id, s])).values());
    return unique;
  },

  async getStationById(id: string): Promise<Station | undefined> {
    const stations = await this.getStations();
    return stations.find((s) => s.id === id.toLowerCase());
  },
};
