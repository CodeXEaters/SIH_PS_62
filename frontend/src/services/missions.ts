import { apiClient } from "./apiClient";
import { Mission } from "@/types";
import { db } from "@/lib/offline/storage/db";
import { cacheEntityData } from "@/lib/offline/sync/syncEngine";

function mapBackendMissionToMission(m: any): Mission {
  const stationId = m.origin_station_id === 2 ? "maitri" : "bharati";
  let statusMapped: Mission["status"] = "Planned";
  const st = (m.status || "").toUpperCase();
  if (st === "ACTIVE") statusMapped = "Active";
  else if (st === "COMPLETED") statusMapped = "Completed";
  else if (st === "DELAYED") statusMapped = "Delayed";
  else if (st === "EMERGENCY") statusMapped = "Emergency";

  const riskMapped = (m.risk_level || "LOW").toUpperCase() as any;

  return {
    id: String(m.id),
    title: m.mission_name || `Mission ${m.id}`,
    purpose: m.mission_type
      ? m.mission_type.replace(/_/g, " ")
      : "Polar Field Science & Logistics",
    teamLead: `Leader (Personnel #${m.team_lead_id})`,
    teamLeadId: String(m.team_lead_id),
    membersCount: 4,
    stationId,
    location: `${m.origin} -> ${m.destination}`,
    coordinates: [
      { lat: -69.4, lng: 76.2 },
      { lat: -69.8, lng: 75.8 },
    ],
    startTime:
      typeof m.start_time === "string"
        ? m.start_time
        : "2026-03-01T08:00:00Z",
    expectedReturn:
      typeof m.expected_return === "string"
        ? m.expected_return
        : "2026-03-10T18:00:00Z",
    riskLevel: riskMapped,
    status: statusMapped,
    telemetryStatus: "NOMINAL",
    lastTelemetryTime: "4 mins ago",
    assignedVehicles: ["PistenBully 300 Polar"],
    assignedEquipment: ["Ground Penetrating Radar", "HF Radio Relay"],
    weatherRiskSummary: "Blizzard advisory in sector 4. Marginal visibility.",
  };
}

export const missionsService = {
  async getAllMissions(): Promise<Mission[]> {
    try {
      const backendData = await apiClient.get<any[]>("/missions");
      const mapped = backendData.map(mapBackendMissionToMission);
      await cacheEntityData("missions", mapped);
      return mapped;
    } catch (err: any) {
      if (err?.isOffline) {
        try {
          const cached = await db.missions.toArray();
          if (cached.length > 0) return cached;
        } catch {
          // Dexie error
        }
      }
      throw err;
    }
  },

  async getMissionById(id: string): Promise<Mission | undefined> {
    try {
      const isNumeric = /^\d+$/.test(id);
      if (isNumeric) {
        const m = await apiClient.get<any>(`/missions/${id}`);
        return mapBackendMissionToMission(m);
      } else {
        const all = await this.getAllMissions();
        return all.find((m) => m.id === id);
      }
    } catch (err: any) {
      if (err?.isOffline) {
        try {
          const cached = await db.missions.get(id);
          if (cached) return cached;
        } catch {
          // Dexie error
        }
      }
      throw err;
    }
  },
};
