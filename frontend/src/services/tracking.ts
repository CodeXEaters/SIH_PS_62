import { apiClient } from "./apiClient";
import { mockStations } from "@/data/mock";

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
    lastPing: "Live (Telemetry Nominal)",
  },
  {
    id: "STAT-MTR",
    name: "Maitri Station",
    type: "STATION",
    lat: -70.7658,
    lng: 11.7358,
    status: "OPERATIONAL",
    lastPing: "Live (Telemetry Nominal)",
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
    name: "MV Vasiliy Golovnin (Expedition Vessel)",
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
    id: "VEH-BHR-018",
    name: "PistenBully 300 (Team Alpha Traverse)",
    type: "VEHICLE",
    lat: -69.7500,
    lng: 75.6100,
    status: "TELEMETRY_DROPOUT",
    speedKts: 0.0,
    headingDeg: 190,
    batteryPct: 62,
    lastPing: "14 mins ago (Warning)",
    stationBase: "Bharati",
  },
  {
    id: "VEH-BHR-004",
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
    id: "HELI-KA32",
    name: "Ka-32 Heavy-Lift Helicopter (VT-NCP)",
    type: "AIRCRAFT",
    lat: -69.2820,
    lng: 76.3220,
    status: "WEATHER_HOLD",
    altitudeM: 12,
    lastPing: "8 mins ago",
    stationBase: "Vessel Helideck",
  },
  {
    id: "CRG-004821",
    name: "Cargo: Atmospheric Lidar Pod (CRG-ANT-004821)",
    type: "CARGO",
    lat: -69.2810,
    lng: 76.3210,
    status: "HOLD_DELAYED",
    lastPing: "Today 07:15 UTC",
    stationBase: "Bharati Sector",
  },
];

export const trackingService = {
  async getTrackingEntities(): Promise<TacticalTrackingEntity[]> {
    try {
      return await apiClient.get<TacticalTrackingEntity[]>("/tracking/entities");
    } catch {
      return mockTrackingEntities;
    }
  },
};
