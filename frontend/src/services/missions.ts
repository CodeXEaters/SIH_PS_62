import { apiClient } from "./apiClient";
import { Mission } from "@/types";
import { db } from "@/lib/offline/storage/db";
import { cacheEntityData } from "@/lib/offline/sync/syncEngine";
import { getStationSlug, getStationName } from "./stations";

function mapBackendMissionToMission(m: any): Mission {
  const stationId = typeof m.origin_station_id === "number" ? m.origin_station_id : 4;
  const stationSlug = getStationSlug(m.origin_station_id);
  const originName = m.origin || getStationName(m.origin_station_id);
  const destName = m.destination || getStationName(m.destination_station_id);
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
    stationSlug,
    location: `${originName} -> ${destName}`,
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

export interface PlanEvaluationRequest {
  mission_name: string;
  origin_station_id: number;
  destination_station_id: number;
  mission_type: string;
  team_lead_id: number;
  assigned_personnel_ids?: number[];
  assigned_asset_ids?: number[];
  assigned_cargo_ids?: number[];
  itinerary_tasks?: string[];
  start_time: string;
  expected_return: string;
  requires_permit?: boolean;
  permit_id?: number | null;
}

export interface PlanEvaluationCheckItem {
  category: "PERMIT" | "PERSONNEL" | "ASSET" | "ENVIRONMENT" | "CARGO" | "INVENTORY" | "RISK" | string;
  status: "PASS" | "WARNING" | "BLOCKED" | string;
  details: string;
}

export interface PlanEvaluationResponse {
  overall_status: "PASS" | "WARNING" | "BLOCKED" | string;
  readiness_score?: number;
  risk_level?: string;
  checks: PlanEvaluationCheckItem[];
  recommendations: string[];
  evaluated_at: string;
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

  async createMission(payload: {
    mission_name: string;
    mission_type: string;
    origin: string;
    destination: string;
    team_lead_id: number;
    origin_station_id?: number;
    destination_station_id?: number;
    start_time: string;
    expected_return: string;
    status?: string;
    risk_level?: string;
  }): Promise<Mission> {
    try {
      const res = await apiClient.post<any>("/missions", payload);
      return mapBackendMissionToMission(res);
    } catch (err: any) {
      if (err?.isOffline) {
        const { queueOfflineAction } = await import("@/lib/offline/sync/syncEngine");
        await queueOfflineAction({
          type: "MISSION_CREATE",
          endpoint: "/missions",
          method: "POST",
          payload,
        });
        return mapBackendMissionToMission({
          id: Date.now(),
          ...payload,
          status: payload.status || "PLANNED",
          risk_level: payload.risk_level || "LOW",
        });
      }
      throw err;
    }
  },

  async evaluatePlan(payload: PlanEvaluationRequest): Promise<PlanEvaluationResponse> {
    return apiClient.post<PlanEvaluationResponse>("/missions/evaluate-plan", payload);
  },
};

