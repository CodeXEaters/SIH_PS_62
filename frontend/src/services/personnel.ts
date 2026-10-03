import { apiClient } from "./apiClient";
import { Personnel } from "@/types";
import { db } from "@/lib/offline/storage/db";
import { cacheEntityData } from "@/lib/offline/sync/syncEngine";
import { getStationSlug, getStationName } from "./stations";

function mapBackendPersonnelToPersonnel(p: any): Personnel {
  const stationId = typeof p.station_id === "number" ? p.station_id : 4;
  const stationSlug = getStationSlug(p.station_id);
  const locationName = p.current_location || getStationName(p.station_id);
  let statusMapped: Personnel["status"] = "Active";
  const st = (p.status || "").toUpperCase();
  if (st.includes("MISSION")) statusMapped = "On Mission";
  else if (st.includes("TRANSIT")) statusMapped = "In Transit";
  else if (st.includes("EVAC") || st.includes("EMERG")) statusMapped = "Emergency";
  else if (st.includes("REST") || st.includes("STATION")) statusMapped = "At Station";

  return {
    id: String(p.id),
    name: p.name || `Expedition Member ${p.id}`,
    role: p.designation || "Operations Specialist",
    team: (p.team || "Station Operations") as any,
    stationId,
    stationSlug,
    location: locationName,
    status: statusMapped,
    medicalClearance: (() => {
      const health = (p.health_clearance_status || "").toUpperCase();
      const ready = (p.readiness_status || "").toUpperCase();
      if (health === "PENDING") return "UNDER_REVIEW";
      if (
        health === "RESTRICTED" ||
        health === "REVOKED" ||
        ready === "CLEARANCE_EXPIRED" ||
        ready === "NOT_READY" ||
        ready === "LIMITED" ||
        p.medical_clearance === false
      ) {
        return "SPECIAL_MONITORING";
      }
      return "VALID";
    })(),
    trainingStatus: p.training_status || "STANDARD",
    lastCheckIn: p.last_check_in ? String(p.last_check_in) : "Unrecorded",
    bloodGroup: p.blood_group || "UNRECORDED",
    emergencyContact: p.emergency_contact || "Unlisted",
    polarExpeditionsCount: p.polar_expeditions_count ?? 0,
    assignedMissions: p.assigned_missions || [],
    movementHistory: p.movement_history || [],
    vitalSigns: p.vital_signs || undefined,
  };
}

export interface PersonnelReadiness {
  id: number;
  name: string;
  station_id: number;
  designation: string;
  role: string;
  readiness_status: "READY" | "LIMITED" | "CLEARANCE_EXPIRED" | "UNFIT" | string;
  health_clearance_status: "APPROVED" | "RESTRICTED" | "PENDING" | "REJECTED" | string;
  clearance_expiry?: string;
  medical_review_date?: string;
  deployment_eligibility: string;
  restrictions_notes?: string;
}

export interface PersonnelReadinessSummary {
  total_personnel: number;
  ready_count: number;
  limited_count: number;
  expired_count: number;
  unfit_count: number;
  readiness_percentage: number;
}

export interface UpdateReadinessPayload {
  readiness_status?: string;
  health_clearance_status?: string;
  clearance_expiry?: string;
  deployment_eligibility?: string;
  restrictions_notes?: string;
}

export const personnelService = {
  async getAllPersonnel(): Promise<Personnel[]> {
    try {
      const backendData = await apiClient.get<any[]>("/personnel");
      const mapped = backendData.map(mapBackendPersonnelToPersonnel);
      await cacheEntityData("personnel", mapped);
      return mapped;
    } catch (err: any) {
      if (err?.isOffline) {
        try {
          const cached = await db.personnel.toArray();
          if (cached.length > 0) return cached;
        } catch {
          // Dexie error
        }
      }
      throw err;
    }
  },

  async getPersonnelById(id: string): Promise<Personnel | undefined> {
    try {
      const isNumeric = /^\d+$/.test(id);
      if (isNumeric) {
        const p = await apiClient.get<any>(`/personnel/${id}`);
        return mapBackendPersonnelToPersonnel(p);
      } else {
        const all = await this.getAllPersonnel();
        return all.find((p) => p.id === id);
      }
    } catch (err: any) {
      if (err?.isOffline) {
        try {
          const cached = await db.personnel.get(id);
          if (cached) return cached;
        } catch {
          // Dexie error
        }
      }
      throw err;
    }
  },

  async getPersonnelReadiness(status?: string, stationId?: number): Promise<PersonnelReadiness[]> {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    if (stationId) params.append("station_id", String(stationId));
    const qs = params.toString();
    return apiClient.get<PersonnelReadiness[]>(qs ? `/personnel/readiness?${qs}` : "/personnel/readiness");
  },

  async getReadinessSummary(): Promise<PersonnelReadinessSummary> {
    return apiClient.get<PersonnelReadinessSummary>("/personnel/readiness/summary");
  },

  async updateReadiness(id: number, payload: UpdateReadinessPayload): Promise<PersonnelReadiness> {
    return apiClient.patch<PersonnelReadiness>(`/personnel/${id}/readiness`, payload);
  },
};
