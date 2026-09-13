export type SeverityLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface GeoCoordinate {
  lat: number;
  lng: number;
}

export interface StationWeather {
  temperatureC: number;
  feelsLikeC: number;
  windSpeedKts: number;
  windDirection: string;
  barometricPressureHpa: number;
  visibilityKm: number;
  condition: string;
  blizzardRisk: "NONE" | "MODERATE" | "SEVERE" | "EXTREME";
  lastUpdated: string;
}

export interface Station {
  id: number;
  slug: string;
  name: string;
  coordinates: GeoCoordinate;
  elevation: string;
  locationName: string;
  established: number;
  capacity: number;
  currentOccupancy: number;
  status: "OPERATIONAL" | "MAINTENANCE" | "INCIDENT";
  weather: StationWeather;
}

export interface ExpeditionMilestone {
  id: string;
  title: string;
  location: string;
  date: string;
  status: "COMPLETED" | "ACTIVE" | "PENDING";
  description: string;
}

export interface Expedition {
  id: string;
  name: string;
  shortName: string;
  season: string;
  status: "PLANNING" | "ACTIVE" | "COMPLETED";
  startDate: string;
  endDate: string;
  leader: string;
  vessel: string;
  personnelCount: number;
  cargoTonnage: number;
  activeMissionsCount: number;
  overallReadinessPct: number;
  milestones: ExpeditionMilestone[];
}

export type CargoStatus =
  | "Booked"
  | "Packed"
  | "Loaded"
  | "In Transit"
  | "Received"
  | "Delayed"
  | "Exception"
  | "PLANNED"
  | "PACKED"
  | "DISPATCHED"
  | "IN_TRANSIT"
  | "DELAYED"
  | "ARRIVED"
  | "DELIVERED";

export interface CargoTimelineStep {
  step: string;
  location: string;
  timestamp: string;
  completed: boolean;
  active?: boolean;
  carrier?: string;
  notes?: string;
}

export interface CargoAIAssessment {
  delayProbability: number;
  estimatedDelayHours: number;
  keyDrivers: string[];
  recommendation: string;
  alternativeTransportSlot?: string;
}

export interface CargoItem {
  id: string;
  rawId?: number;
  description: string;
  owner: string;
  category: "Scientific Instrumentation" | "Fuel & Energy" | "Fuel & Power" | "Life Support & Rations" | "Heavy Machinery Spares" | "Medical Supplies";
  weightKg: number;
  dimensionsM: string;
  hazardClass: "NON-HAZARDOUS" | "CLASS-3 FLAMMABLE" | "CLASS-9 MISCELLANEOUS" | "CLASS-7 RADIOACTIVE (LAB TRACER)";
  origin: string;
  destination: "Bharati Station" | "Maitri Station" | "Cape Town Staging";
  currentLocation: string;
  status: CargoStatus;
  eta: string;
  riskLevel: SeverityLevel;
  transportMode: "Maritime Vessel" | "Air Cargo" | "Snow Traverse" | "Helicopter Ferry";
  timeline: CargoTimelineStep[];
  aiAssessment?: CargoAIAssessment;
  qrCode: string;
  lastScannedBy?: string;
  lastScannedAt?: string;
}

export type PersonnelStatus =
  | "Active"
  | "In Transit"
  | "At Station"
  | "On Mission"
  | "Emergency";

export interface PersonnelMovementEvent {
  timestamp: string;
  from: string;
  to: string;
  mode: string;
  authorizedBy: string;
}

export interface Personnel {
  id: string;
  name: string;
  role: string;
  team: "Meteorology & Climatology" | "Glaciology & Ice Coring" | "Logistics & Heavy Transport" | "Station Operations" | "Medical & Life Support" | "Upper Atmosphere Physics";
  stationId: number;
  stationSlug: string;
  location: string;
  status: PersonnelStatus;
  medicalClearance: "VALID" | "UNDER_REVIEW" | "SPECIAL_MONITORING";
  trainingStatus: "CERTIFIED_SURVIVAL" | "ADVANCED_POLAR" | "STANDARD";
  lastCheckIn: string;
  bloodGroup: string;
  emergencyContact: string;
  polarExpeditionsCount: number;
  assignedMissions: string[];
  movementHistory: PersonnelMovementEvent[];
  vitalSigns?: {
    heartRateBpm: number;
    spo2Pct: number;
    skinTempC: number;
    batteryPct: number;
  };
}

export type AssetCondition = "Operational" | "Maintenance Due" | "Under Repair" | "Offline";

export interface Asset {
  id: string;
  name: string;
  category: "Vehicles" | "Generators" | "Communication Equipment" | "Scientific Equipment" | "Medical Equipment";
  stationId: number;
  stationSlug: string;
  condition: AssetCondition;
  utilizationPct: number;
  operatingHours: number;
  lastMaintenance: string;
  nextMaintenance: string;
  fuelLevelPct?: number;
  batteryHealthPct?: number;
  criticalSparePartsAvailable: boolean;
  assignedMissionId?: string;
}

export type InventoryStockStatus = "Optimal" | "Adequate" | "Low" | "Critical";

export interface InventoryItem {
  id: string;
  name: string;
  category: "Fuel & Power" | "Life Support" | "Medical & Pharma" | "Station Infrastructure" | "Vehicle Spares";
  stationId: number;
  stationSlug: string;
  currentStock: number;
  unit: string;
  dailyConsumption: number;
  daysRemaining: number;
  safetyStockDays: number;
  status: InventoryStockStatus;
  storageLocation: string;
  minimumThreshold: number;
  replenishmentETA: string;
  forecastHistory: { day: string; projected: number; threshold: number }[];
}

export type MissionStatus = "Planned" | "Active" | "Delayed" | "Completed" | "Emergency";

export interface Mission {
  id: string;
  title: string;
  purpose: string;
  teamLead: string;
  teamLeadId: string;
  membersCount: number;
  stationId: number;
  stationSlug: string;
  location: string;
  coordinates: GeoCoordinate[];
  startTime: string;
  expectedReturn: string;
  riskLevel: SeverityLevel;
  status: MissionStatus;
  telemetryStatus: "NOMINAL" | "DELAYED" | "DROPOUT";
  lastTelemetryTime: string;
  telemetryDropMinutes?: number;
  assignedVehicles: string[];
  assignedEquipment: string[];
  weatherRiskSummary: string;
}

export interface AttentionItem {
  id: string;
  title: string;
  category: "CARGO" | "INVENTORY" | "TELEMETRY" | "WEATHER" | "ASSET";
  severity: SeverityLevel;
  reason: string;
  location: string;
  timestamp: string;
  actionLabel: string;
  actionUrl: string;
  entityId: string;
}

export interface EmergencyIncident {
  id: string;
  incidentCode: string;
  title: string;
  type: "MEDICAL" | "TRAVERSE_BLIZZARD" | "GENERATOR_FAILURE" | "COMMUNICATION_BLACKOUT";
  severity: "CRITICAL";
  locationName: string;
  stationName?: string;
  coordinates: GeoCoordinate;
  affectedPersonnel: { id: string; name: string; role: string; vitals: string }[];
  weatherConditions: {
    windSpeedKts: number;
    temperatureC: number;
    visibilityM: number;
    blizzardWindowHours: number;
  };
  recommendedResponse: {
    primaryAssetId: string;
    primaryAssetName: string;
    medicalTeamLeader: string;
    estimatedTransitHours: number;
    fuelRequiredLiters: number;
    routeRiskScore: number;
    optimalDepartureWindow: string;
    contingencyPlan: string;
  };
  humanDecision: "PENDING" | "APPROVED" | "MODIFIED" | "REJECTED";
  decisionTimestamp?: string;
  decisionNotes?: string;
  timeline: { time: string; event: string; actor: string }[];
}

export interface WhatIfScenarioInput {
  vesselDelayDays: number;
  aircraftCancelled: boolean;
  fuelConsumptionSpikePct: number;
  missionTraverseExtendedHours: number;
  stationTransferDelayedDays: number;
}

export interface WhatIfScenarioResult {
  bharatiFuelDaysRemaining: number;
  maitriFuelDaysRemaining: number;
  cargoDelaysCount: number;
  criticalSupplyStockouts: string[];
  operationalRiskScore: number; // 0-100
  recommendedAction: string;
}

export interface ChainOfCustodyRecord {
  id: string;
  cargoId: string;
  timestamp: string;
  actorName: string;
  actorRole: string;
  action: string;
  fromLocation: string;
  toLocation: string;
  verificationHash: string;
  notes: string;
}
