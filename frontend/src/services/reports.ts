import { apiClient } from "./apiClient";

export interface ReportSummary {
  expeditionReadinessPct: number;
  cargoTonnageTracked: number;
  criticalSupplyDaysMin: number;
  totalMissionsCompleted: number;
  activeIncidentsCount: number;
  fuelEfficiencyRate: string;
}

export interface MonthlyCargoChartItem {
  month: string;
  dispatched: number;
  received: number;
}

export interface FuelConsumptionChartItem {
  week: string;
  maitri: number;
  bharati: number;
}

export interface AssetHealthChartItem {
  name: string;
  score: number;
  total: number;
  operational: number;
}

export interface ReportChartsResponse {
  monthlyCargoData: MonthlyCargoChartItem[];
  fuelConsumptionData: FuelConsumptionChartItem[];
  assetHealthData: AssetHealthChartItem[];
  totalDeliveredTonnes: number;
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

  async getReportCharts(): Promise<ReportChartsResponse> {
    try {
      const data = await apiClient.get<any>("/reports/charts");
      return {
        monthlyCargoData: data.monthlyCargoData ?? [],
        fuelConsumptionData: data.fuelConsumptionData ?? [],
        assetHealthData: data.assetHealthData ?? [],
        totalDeliveredTonnes: data.totalDeliveredTonnes ?? 0,
      };
    } catch (err: any) {
      if (err?.isOffline) {
        return {
          monthlyCargoData: [],
          fuelConsumptionData: [],
          assetHealthData: [],
          totalDeliveredTonnes: 0,
        };
      }
      throw err;
    }
  },
};
