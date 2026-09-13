import { apiClient } from "./apiClient";

export interface TacticalTrackingEntity {
  id: string;
  name: string;
  type: "STATION" | "VESSEL" | "AIRCRAFT" | "VEHICLE" | "TEAM" | "CARGO";
  lat: number;
  lng: number;
  status: string;
  speedKts?: number;
  headingDeg?: number;
  altitudeM?: number;
  batteryPct?: number;
  lastPing: string;
  stationBase?: string;
  description?: string;
}


export const trackingService = {
  async getTrackingEntities(): Promise<TacticalTrackingEntity[]> {
    try {
      return await apiClient.get<TacticalTrackingEntity[]>("/tracking/entities");
    } catch (err: any) {
      if (err?.isOffline) {
        return [];
      }
      throw err;
    }
  },
};
