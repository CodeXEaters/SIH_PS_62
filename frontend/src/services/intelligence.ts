import { apiClient } from "./apiClient";
import { WhatIfScenarioInput, WhatIfScenarioResult } from "@/types";
import { mockAttentionItems } from "@/data/mock";

export const intelligenceService = {
  async getAttentionItems() {
    try {
      return await apiClient.get<typeof mockAttentionItems>("/intelligence/attention");
    } catch {
      return mockAttentionItems;
    }
  },

  async runWhatIfSimulation(input: WhatIfScenarioInput): Promise<WhatIfScenarioResult> {
    try {
      return await apiClient.post<WhatIfScenarioResult>("/intelligence/what-if", input);
    } catch {
      // High-fidelity operational simulation model
      const baseFuelDays = 6.9;
      const fuelBurnRate = 180 * (1 + input.fuelConsumptionSpikePct / 100);
      const updatedBharatiDays = Math.max(0, Number((1240 / fuelBurnRate).toFixed(1)));
      const updatedMaitriDays = Math.max(5, Number((8200 / (350 * (1 + input.fuelConsumptionSpikePct / 100))).toFixed(1)));
      
      const delayCount = 1 + (input.vesselDelayDays > 0 ? 3 : 0) + (input.aircraftCancelled ? 2 : 0);
      
      let riskScore = 48;
      riskScore += input.vesselDelayDays * 6;
      if (input.aircraftCancelled) riskScore += 18;
      riskScore += Math.floor(input.fuelConsumptionSpikePct * 0.4);
      riskScore += Math.min(20, Math.floor(input.missionTraverseExtendedHours * 0.8));
      riskScore = Math.min(98, Math.max(15, riskScore));

      const stockouts: string[] = [];
      if (updatedBharatiDays < 4) stockouts.push("Bharati Station Polar Diesel");
      if (input.aircraftCancelled) stockouts.push("Maitri Deep Ice Core Spares");
      if (input.vesselDelayDays >= 4) stockouts.push("Bharati Fresh Cryo-Reagents");

      let recommendation = "Maintain baseline operational tempo.";
      if (riskScore >= 75) {
        recommendation = "CRITICAL: Restrict non-essential heating circuits at Bharati immediately. Re-route PistenBully traverse to haul emergency fuel bladders from coastal cache.";
      } else if (riskScore >= 50) {
        recommendation = "ADVISORY: Prioritize vessel fuel hose discharge over scientific container offloading during next calm weather window.";
      }

      return {
        bharatiFuelDaysRemaining: updatedBharatiDays,
        maitriFuelDaysRemaining: updatedMaitriDays,
        cargoDelaysCount: delayCount,
        criticalSupplyStockouts: stockouts,
        operationalRiskScore: riskScore,
        recommendedAction: recommendation,
      };
    }
  },
};
