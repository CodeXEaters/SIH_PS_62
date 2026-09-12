import { EmergencyIncident } from "@/types";

export const mockEmergencyIncident: EmergencyIncident = {
  id: "EM-024",
  incidentCode: "INCIDENT #EM-024",
  title: "Team Alpha Inland Traverse Communication Loss & Blizzard Entrapment",
  type: "TRAVERSE_BLIZZARD",
  severity: "CRITICAL",
  locationName: "Larsemann Inland Ridge, Sector 4 (Coordinates: 69°45'00\"S, 75°36'36\"E)",
  coordinates: { lat: -69.7500, lng: 75.6100 },
  affectedPersonnel: [
    { id: "EXP-024", name: "Dr. Pradeep Mukherjee", role: "Traverse Commander / Glaciologist", vitals: "HR 88 bpm | SpO2 95% | Skin 32.1°C" },
    { id: "EXP-055", name: "Tenzing Norbu", role: "Field Survival & Crevasse Lead", vitals: "HR 82 bpm | SpO2 96% | Skin 31.8°C" },
    { id: "EXP-088", name: "Arjun Solanki", role: "Radar Systems Engineer", vitals: "HR 90 bpm | SpO2 94% | Skin 31.5°C" },
    { id: "EXP-093", name: "Vikram Negi", role: "Heavy Equipment Operator", vitals: "HR 84 bpm | SpO2 96% | Skin 32.4°C" },
  ],
  weatherConditions: {
    windSpeedKts: 38,
    temperatureC: -24.6,
    visibilityM: 200,
    blizzardWindowHours: 2.5,
  },
  recommendedResponse: {
    primaryAssetId: "AST-BHR-004",
    primaryAssetName: "PistenBully Polar Rescue Vehicle (Heated Life-Support Module)",
    medicalTeamLeader: "Dr. Ananya Sen (Station Medical Officer)",
    estimatedTransitHours: 0.8, // 48 minutes
    fuelRequiredLiters: 95,
    routeRiskScore: 28, // Low-Medium via sheltered gully route
    optimalDepartureWindow: "Immediate (Within next 15 minutes before 50kt front arrives)",
    contingencyPlan: "If wind exceeds 45kt during transit, hold at Emergency Refuse Hut #2 (Waypoint 2B).",
  },
  humanDecision: "PENDING",
  timeline: [
    { time: "08:30 UTC", event: "Team Alpha reported increasing ground blizzard at Sector 4 ridge", actor: "Dr. Pradeep Mukherjee" },
    { time: "08:43 UTC", event: "Automated telemetry beacon missed expected 10-minute heartbeat", actor: "Iridium Gateway Node" },
    { time: "08:48 UTC", event: "DHRUV Anomaly Detection Engine flagged persistent telemetry loss", actor: "DHRUV Intelligence Engine" },
    { time: "08:52 UTC", event: "Incident #EM-024 escalated to Tier-1 Polar Emergency status", actor: "Bharati Station Duty Officer" },
    { time: "08:55 UTC", event: "AI Multi-Vector Response Plan generated: PistenBully AST-BHR-004 standby", actor: "DHRUV Optimization Core" },
  ],
};
