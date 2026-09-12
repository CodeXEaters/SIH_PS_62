import { apiClient } from "./apiClient";
import { EmergencyIncident } from "@/types";
import { mockEmergencyIncident } from "@/data/mock";

function mapBackendEmergencyToIncident(em: any): EmergencyIncident {
  return {
    id: String(em.id),
    incidentCode: em.incident_code || `INC-${em.id}`,
    title: em.title || "Polar Emergency Incident",
    type: (em.emergency_type || "MEDICAL") as any,
    severity: "CRITICAL",
    locationName: em.location_description || "Antarctic Plateau Sector 4",
    coordinates: {
      lat: em.latitude || -70.05,
      lng: em.longitude || 75.12,
    },
    affectedPersonnel: [
      {
        id: "P-12",
        name: "Traverse Field Lead",
        role: "Specialist",
        vitals: "Hypothermia Stage 1 (Attending)",
      },
    ],
    weatherConditions: {
      windSpeedKts: 42,
      temperatureC: -36,
      visibilityM: 400,
      blizzardWindowHours: 3.5,
    },
    recommendedResponse: {
      primaryAssetId: "TRN-04",
      primaryAssetName: "PistenBully 300 Polar Rescue",
      medicalTeamLeader: "Dr. Arvind Sharan (NCPOR)",
      estimatedTransitHours: 2.5,
      fuelRequiredLiters: 140,
      routeRiskScore: 68,
      optimalDepartureWindow:
        "IMMEDIATE (0-30 min window before blizzard front)",
      contingencyPlan:
        em.recommended_response ||
        "Deploy heavy snowcat with medical oxygen reserve.",
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
          : "08:15 UTC",
        event: `Emergency SOS Alert Triggered: ${em.title}`,
        actor: "Automated Telemetry Relay",
      },
    ],
  };
}

let cachedIncident: EmergencyIncident = { ...mockEmergencyIncident };

export const emergencyService = {
  async getActiveIncident(): Promise<EmergencyIncident> {
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
    try {
      const numericId = incidentId.replace(/\D/g, "") || "1";
      const res = await apiClient.post<any>(`/emergency/${numericId}/decision`, {
        decision,
        notes: notes || `Commander authorized ${decision}`,
      });
      cachedIncident = mapBackendEmergencyToIncident(res);
      return cachedIncident;
    } catch (err: any) {
      if (err?.isOffline) {
        cachedIncident = {
          ...cachedIncident,
          humanDecision: decision,
          decisionTimestamp:
            new Date().toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
            }) + " UTC",
          decisionNotes: notes || `Commander executed offline: ${decision}`,
        };
        return cachedIncident;
      }
      throw err;
    }
  },
};
