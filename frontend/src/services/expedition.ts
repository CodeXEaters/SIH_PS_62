import { apiClient } from "./apiClient";
import { Expedition, Station } from "@/types";
import { stationsService } from "./stations";


export const expeditionService = {
  async getActiveExpedition(): Promise<Expedition> {
    const exp = await apiClient.get<any>("/expeditions/active");
    return {
      id: exp.id || exp.code || "ISEA-46",
      name: exp.name || "46th Indian Scientific Expedition to Antarctica",
      shortName: exp.shortName || exp.short_name || "46th ISEA",
      season: exp.season || "2026-2027 Austral Season",
      status: exp.status || "ACTIVE",
      startDate: exp.startDate || exp.start_date || "2026-11-15",
      endDate: exp.endDate || exp.end_date || "2027-04-10",
      leader: exp.leader || "Dr. Arvind Sharan (Scientist 'G', NCPOR)",
      vessel: exp.vessel || "MV Vasiliy Golovnin (Charter Icebreaker)",
      personnelCount: exp.personnelCount ?? exp.personnel_count ?? 0,
      cargoTonnage: exp.cargoTonnage ?? exp.cargo_tonnage ?? 0,
      activeMissionsCount:
        exp.activeMissionsCount ?? exp.active_missions_count ?? 0,
      overallReadinessPct:
        exp.overallReadinessPct ?? exp.overall_readiness_pct ?? 0,
      milestones: exp.milestones || [],
    };
  },

  async getExpeditionById(id: string): Promise<Expedition | null> {
    return await apiClient.get<Expedition>(`/expeditions/${id}`);
  },

  async getStations(): Promise<Station[]> {
    return await stationsService.getAllStations();
  },

  async getStationById(id: string): Promise<Station | undefined> {
    return await stationsService.getStationById(id);
  },
};
