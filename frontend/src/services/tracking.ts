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

export const mockTrackingEntities: TacticalTrackingEntity[] = [
  {
    id: "STAT-BHR",
    name: "Bharati Station",
    type: "STATION",
    lat: -69.4081,
    lng: 76.1872,
    status: "OPERATIONAL",
    lastPing: "No Telemetry Recorded",
  },
  {
    id: "STAT-MTR",
    name: "Maitri Station",
    type: "STATION",
    lat: -70.7658,
    lng: 11.7358,
    status: "OPERATIONAL",
    lastPing: "No Telemetry Recorded",
  },
  {
    id: "NODE-GOA",
    name: "NCPOR Headquarters (Goa)",
    type: "STATION",
    lat: 15.4026,
    lng: 73.8055,
    status: "OPERATIONAL",
    lastPing: "Command Link Active",
  },
  {
    id: "NODE-CPT",
    name: "Cape Town Transit Gateway",
    type: "STATION",
    lat: -33.9249,
    lng: 18.4241,
    status: "OPERATIONAL",
    lastPing: "Port Terminal Connected",
  },
  {
    id: "VESSEL-01",
    name: "MV Vasundhara Polar Resupply Vessel",
    type: "VESSEL",
    lat: -69.2800,
    lng: 76.3200,
    status: "FAST_ICE_MOORED",
    speedKts: 0.0,
    headingDeg: 215,
    lastPing: "3 mins ago (AIS)",
    stationBase: "Bharati Offshore",
  },
  {
    id: "TRN-1",
    name: "PistenBully Polar Traverse 01",
    type: "VEHICLE",
    lat: -70.9500,
    lng: 12.1000,
    status: "IN_TRANSIT",
    speedKts: 16.5,
    headingDeg: 190,
    batteryPct: 89,
    lastPing: "Live GPS Ping",
    stationBase: "Maitri",
  },
  {
    id: "AST-1",
    name: "PistenBully Polar Rescue Unit",
    type: "VEHICLE",
    lat: -69.4120,
    lng: 76.1900,
    status: "STANDBY_READY",
    batteryPct: 99,
    lastPing: "1 min ago",
    stationBase: "Bharati",
  },
  {
    id: "TRN-2",
    name: "Cape Town - Antarctica Air Bridge",
    type: "AIRCRAFT",
    lat: -33.9249,
    lng: 18.4241,
    status: "STANDBY",
    altitudeM: 0,
    lastPing: "Cape Town Hub Staged",
    stationBase: "Cape Town Airport",
  },
  {
    id: "CRG-2026-001",
    name: "Atmospheric Aerosol Sampling Filters (CRG-2026-001)",
    type: "CARGO",
    lat: -69.2810,
    lng: 76.3210,
    status: "DELAYED",
    lastPing: "Prydz Bay Mooring (+18h Hold)",
    stationBase: "Bharati Sector",
  },
];

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
