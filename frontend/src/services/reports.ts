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
      const data = await apiClient.get<any>("/reports/summary");
      return {
        expeditionReadinessPct:
          data.expeditionReadinessPct ?? data.expedition_readiness_pct ?? 0,
        cargoTonnageTracked:
          data.cargoTonnageTracked ?? data.cargo_tonnage_tracked ?? 0,
        criticalSupplyDaysMin:
          data.criticalSupplyDaysMin ?? data.critical_supply_days_min ?? 0,
        totalMissionsCompleted:
          data.totalMissionsCompleted ?? data.total_missions_completed ?? 0,
        activeIncidentsCount:
          data.activeIncidentsCount ?? data.active_incidents_count ?? 0,
        fuelEfficiencyRate:
          data.fuelEfficiencyRate ?? data.fuel_efficiency_rate ?? "N/A",
      };
    } catch (err: any) {
      if (err?.isOffline) {
        return {
          expeditionReadinessPct: 0,
          cargoTonnageTracked: 0,
          criticalSupplyDaysMin: 0,
          totalMissionsCompleted: 0,
          activeIncidentsCount: 0,
          fuelEfficiencyRate: "N/A (Offline)",
        };
      }
      throw err;
    }
  },
};
