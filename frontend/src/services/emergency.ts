import { apiClient } from "./apiClient";
import { EmergencyIncident } from "@/types";

function mapBackendEmergencyToIncident(em: any, envObs?: any, envRisk?: any): EmergencyIncident {
  const stationName = em.station_name || "Bharati Station";
  const personnelName = em.personnel_name || (em.personnel_id ? `Personnel #${em.personnel_id}` : "Field Personnel");
  const assetName = em.asset_name || (em.asset_id ? `Asset #${em.asset_id}` : "PistenBully Polar Rescue Unit");

  // Environmental conditions sourced dynamically from backend observation
  const windKts = envObs?.wind_speed != null ? Math.round(envObs.wind_speed) : 28;
  const tempC = envObs?.temperature != null ? Math.round(envObs.temperature) : -22;
  const visM = envObs?.visibility != null ? Math.round(envObs.visibility * 1000) : 1500;
  const blizzardHours = envRisk?.level === "CRITICAL" ? 2 : envRisk?.level === "HIGH" ? 4 : envRisk?.level === "MEDIUM" ? 8 : 12;

  // Route risk and departure window derived from backend risk engine
  const riskScore = envRisk?.score != null ? Math.round(envRisk.score) : 45;
  const departureWindow = envRisk?.level === "CRITICAL" ? "HOLD_FOR_WINDOW" : "IMMEDIATE";

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
      windSpeedKts: windKts,
      temperatureC: tempC,
      visibilityM: visM,
      blizzardWindowHours: blizzardHours,
      source: envObs ? "Backend Environmental Observation (Simulated)" : "Offline Baseline Model (Simulated)",
    },
    recommendedResponse: (() => {
      let transitHours = 1.8;
      let fuelLiters = 48;
      let medicalLeader = "Chief Medical Officer";
      let recommendedAsset = assetName;

      const resp = em.recommended_response || "";
      const transitMatch = resp.match(/transit:\s*([\d\.]+)\s*hrs/i);
      if (transitMatch) {
        transitHours = parseFloat(transitMatch[1]);
      } else {
        const etaMatch = resp.match(/ETA:\s*(\d+)h(?:\s*(\d+)m)?/i);
        if (etaMatch) {
          const h = parseInt(etaMatch[1], 10);
          const m = etaMatch[2] ? parseInt(etaMatch[2], 10) : 0;
          transitHours = Math.round((h + m / 60) * 10) / 10;
        }
      }

      const fuelMatch = resp.match(/fuel:\s*([\d\.]+)\s*L/i);
      if (fuelMatch) {
        fuelLiters = parseFloat(fuelMatch[1]);
      }

      const leaderMatch = resp.match(/under\s+([^\.]+)\./i);
      if (leaderMatch) {
        medicalLeader = leaderMatch[1].trim();
      }

      const vehicleMatch = resp.match(/Deploy\s+([^\s]+(?:\s+[^\s]+)*?)\s+from/i);
      if (vehicleMatch && !em.asset_name) {
        recommendedAsset = vehicleMatch[1].trim();
      }

      return {
        primaryAssetId: em.asset_id ? `AST-${em.asset_id}` : "DISPATCH-PENDING",
        primaryAssetName: recommendedAsset,
        medicalTeamLeader: medicalLeader,
        estimatedTransitHours: transitHours,
        fuelRequiredLiters: fuelLiters,
        routeRiskScore: riskScore,
        optimalDepartureWindow: departureWindow,
        contingencyPlan:
          em.recommended_response ||
          "Deploy rescue snowcat unit via surveyed corridor. Evacuate casualty to station infirmary.",
      };
    })(),
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
        let envObs: any = null;
        let envRisk: any = null;
        try {
          const stId = active.station_id || 4;
          const [obsRes, riskRes] = await Promise.allSettled([
            apiClient.get<any[]>(`/environment/current?station_id=${stId}`),
            apiClient.get<any>(`/environment/risk?station_id=${stId}`),
          ]);
          if (obsRes.status === "fulfilled" && Array.isArray(obsRes.value) && obsRes.value.length > 0) {
            envObs = obsRes.value[0];
          }
          if (riskRes.status === "fulfilled" && riskRes.value) {
            envRisk = riskRes.value;
          }
        } catch {
          // Gracefully fall back to offline baseline
        }
        cachedIncident = mapBackendEmergencyToIncident(active, envObs, envRisk);
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

  async triggerEmergency(payload: {
    title: string;
    emergency_type: string;
    severity?: string;
    description: string;
    station_id?: number;
    location_description?: string;
    latitude?: number;
    longitude?: number;
  }): Promise<EmergencyIncident> {
    const res = await apiClient.post<any>("/emergency", {
      title: payload.title,
      emergency_type: payload.emergency_type,
      severity: payload.severity || "CRITICAL",
      description: payload.description,
      station_id: payload.station_id || 4,
      location_description: payload.location_description || "Antarctic Traverse Sector",
      latitude: payload.latitude ?? -69.4087,
      longitude: payload.longitude ?? 76.1872,
    });
    cachedIncident = mapBackendEmergencyToIncident(res);
    return cachedIncident;
  },
};

