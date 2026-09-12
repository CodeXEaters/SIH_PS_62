import { apiClient } from "./apiClient";
import { EmergencyIncident } from "@/types";
import { mockEmergencyIncident } from "@/data/mock";

let currentIncidentState = { ...mockEmergencyIncident };

export const emergencyService = {
  async getActiveIncident(): Promise<EmergencyIncident> {
    try {
      return await apiClient.get<EmergencyIncident>("/emergency/active");
    } catch {
      return currentIncidentState;
    }
  },

  async updateDecision(
    incidentId: string,
    decision: "APPROVED" | "MODIFIED" | "REJECTED",
    notes?: string
  ): Promise<EmergencyIncident> {
    try {
      return await apiClient.post<EmergencyIncident>(`/emergency/${incidentId}/decision`, {
        decision,
        notes,
      });
    } catch {
      currentIncidentState = {
        ...currentIncidentState,
        humanDecision: decision,
        decisionTimestamp: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) + " UTC",
        decisionNotes: notes || `Mission Commander executed: ${decision}`,
        timeline: [
          ...currentIncidentState.timeline,
          {
            time: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) + " UTC",
            event: `Commander executed action: ${decision}. Dispatch authorization relayed to rescue units.`,
            actor: "Dr. Arvind Sharan (Commander)",
          },
        ],
      };
      return currentIncidentState;
    }
  },
};
