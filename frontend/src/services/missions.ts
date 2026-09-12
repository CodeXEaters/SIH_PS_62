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
    membersCount: m.members_count ?? 0,
    stationId,
    location: `${m.origin} -> ${m.destination}`,
    coordinates: m.coordinates || [],
    startTime: m.start_time ? String(m.start_time) : "",
    expectedReturn: m.expected_return ? String(m.expected_return) : "",
    riskLevel: riskMapped,
    status: statusMapped,
    telemetryStatus: "NOMINAL",
    lastTelemetryTime: m.last_telemetry_time
      ? String(m.last_telemetry_time)
      : "Telemetry Unlogged",
    assignedVehicles: m.assigned_vehicles || [],
    assignedEquipment: m.assigned_equipment || [],
    weatherRiskSummary:
      m.weather_risk_summary || "Nominal Antarctic operational conditions",
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
