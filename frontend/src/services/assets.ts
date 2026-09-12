import { apiClient } from "./apiClient";
import { Asset } from "@/types";
import { mockAssets } from "@/data/mock";

export const assetsService = {
  async getAllAssets(): Promise<Asset[]> {
    try {
      return await apiClient.get<Asset[]>("/assets");
    } catch {
      return mockAssets;
    }
  },
  async getAssetById(id: string): Promise<Asset | undefined> {
    try {
      return await apiClient.get<Asset>(`/assets/${id}`);
    } catch {
      return mockAssets.find((a) => a.id === id);
    }
  },
};
