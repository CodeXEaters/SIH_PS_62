import { apiClient } from "./apiClient";
import { Personnel } from "@/types";
import { db } from "@/lib/offline/storage/db";
import { cacheEntityData } from "@/lib/offline/sync/syncEngine";

function mapBackendPersonnelToPersonnel(p: any): Personnel {
  const stationId = p.station_id === 2 ? "maitri" : "bharati";
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
    location: p.current_location || (stationId === "maitri" ? "Maitri Station" : "Bharati Station"),
    status: statusMapped,
    medicalClearance: p.medical_clearance === false ? "SPECIAL_MONITORING" : "VALID",
    trainingStatus: "CERTIFIED_SURVIVAL",
    lastCheckIn: p.last_check_in || "2026-03-01T12:00:00Z",
    bloodGroup: "O+",
    emergencyContact: p.emergency_contact || "+91-11-2436-0000",
    polarExpeditionsCount: 2,
    assignedMissions: [],
    movementHistory: [],
    vitalSigns: {
      heartRateBpm: 72,
      spo2Pct: 98,
      skinTempC: 36.8,
      batteryPct: 95,
    },
  };
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
};
