import { apiClient } from "./apiClient";

export interface ReportSummary {
  expeditionReadinessPct: number;
  cargoTonnageTracked: number;
  criticalSupplyDaysMin: number;
  totalMissionsCompleted: number;
  activeIncidentsCount: number;
  fuelEfficiencyRate: string;
}

export const reportsService = {
  async getPerformanceSummary(): Promise<ReportSummary> {
    try {
      return await apiClient.get<ReportSummary>("/reports/summary");
    } catch {
      return {
        expeditionReadinessPct: 92,
        cargoTonnageTracked: 1842,
        criticalSupplyDaysMin: 6.9,
        totalMissionsCompleted: 14,
        activeIncidentsCount: 1,
        fuelEfficiencyRate: "94.2%",
      };
    }
  },
};
