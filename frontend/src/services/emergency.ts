import { apiClient } from "./apiClient";
import { EmergencyIncident } from "@/types";

function mapBackendEmergencyToIncident(em: any): EmergencyIncident {
  const stationName = em.station_name || "Bharati Station";
  const personnelName = em.personnel_name || (em.personnel_id ? `Personnel #${em.personnel_id}` : "Field Personnel");
  const assetName = em.asset_name || (em.asset_id ? `Asset #${em.asset_id}` : "PistenBully Polar Rescue Unit");

  return {
    id: String(em.id),
    incidentCode: em.incident_code || `INC-${em.id}`,
    title: em.title || "Polar Emergency Incident",
    type: (em.emergency_type || "MEDICAL") as any,
    severity: "CRITICAL",
    locationName: em.location_description || "Antarctic Sector",
    stationName: stationName,
    coordinates: {
      lat: em.latitude ?? 0.0,
      lng: em.longitude ?? 0.0,
    },
    affectedPersonnel: em.personnel_id
      ? [
          {
            id: String(em.personnel_id),
            name: personnelName,
            role: "Field Specialist",
            vitals: "SOS Telemetry Active",
          },
        ]
      : [],
    weatherConditions: {
      windSpeedKts: 38,
      temperatureC: -28,
      visibilityM: 800,
      blizzardWindowHours: 4,
    },
    recommendedResponse: {
      primaryAssetId: em.asset_id ? `AST-${em.asset_id}` : "DISPATCH-PENDING",
      primaryAssetName: assetName,
      medicalTeamLeader: "Chief Medical Officer",
      estimatedTransitHours: 1.8,
      fuelRequiredLiters: 48,
      routeRiskScore: 32,
      optimalDepartureWindow: "IMMEDIATE",
      contingencyPlan:
        em.recommended_response ||
        "Deploy rescue snowcat unit via surveyed corridor. Evacuate casualty to station infirmary.",
    },
    humanDecision: (em.human_decision || "PENDING") as any,
    decisionTimestamp: em.decision_timestamp
      ? new Date(em.decision_timestamp).toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        }) + " UTC"
      : undefined,
    decisionNotes: em.decision_notes || undefined,
    timeline: [
      {
        time: em.created_at
          ? new Date(em.created_at).toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
            }) + " UTC"
          : "Incident Time",
        event: `Emergency SOS Alert Triggered: ${em.title}`,
        actor: "Automated Telemetry Relay",
      },
    ],
  };
}

let cachedIncident: EmergencyIncident | null = null;

export const emergencyService = {
  async getActiveIncident(): Promise<EmergencyIncident | null> {
    try {
      const active = await apiClient.get<any>("/emergency/active");
      if (active && active.id) {
        cachedIncident = mapBackendEmergencyToIncident(active);
        return cachedIncident;
      }
      return cachedIncident;
    } catch (err: any) {
      if (err?.isOffline) {
        return cachedIncident;
      }
      throw err;
    }
  },

  async updateDecision(
    incidentId: string,
    decision: "APPROVED" | "MODIFIED" | "REJECTED",
    notes?: string
  ): Promise<EmergencyIncident> {
    const numericId = incidentId.replace(/\D/g, "") || "1";
    const res = await apiClient.post<any>(`/emergency/${numericId}/decision`, {
      decision,
      notes: notes || `Commander authorized ${decision}`,
    });
    cachedIncident = mapBackendEmergencyToIncident(res);
    return cachedIncident;
  },
};
