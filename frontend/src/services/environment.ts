import { apiClient } from "./apiClient";

export interface EnvironmentalObservation {
  id: number;
  station_id: number;
  latitude: number;
  longitude: number;
  temperature: number;
  wind_speed: number;
  wind_direction: string;
  visibility: number;
  pressure: number;
  weather_condition: string;
  sea_ice_condition: string;
  sea_ice_concentration: number;
  source_type: string;
  confidence: number;
  is_simulated: boolean;
  timestamp: string;
}

export interface EnvironmentalRisk {
  station_id?: number;
  score: number;
  level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | string;
  factors: string[];
  recommendations: string[];
  timestamp: string;
  is_simulated: boolean;
}

export interface EnvironmentalForecastItem {
  timestamp: string;
  temperature: number;
  wind_speed: number;
  visibility: number;
  weather_condition: string;
  sea_ice_concentration: number;
  source_type: string;
  is_simulated: boolean;
}

export interface EnvironmentalStationSummary {
  station_id: number;
  station_name: string;
  observation?: EnvironmentalObservation;
  risk: EnvironmentalRisk;
}

export interface CreateObservationPayload {
  station_id: number;
  latitude: number;
  longitude: number;
  temperature: number;
  wind_speed: number;
  wind_direction: string;
  visibility: number;
  pressure: number;
  weather_condition?: string;
  sea_ice_condition?: string;
  sea_ice_concentration?: number;
  source_type?: string;
  confidence?: number;
  is_simulated?: boolean;
}

export const environmentService = {
  async getCurrentObservations(stationId?: number): Promise<EnvironmentalObservation[]> {
    const qs = stationId ? `?station_id=${stationId}` : "";
    return apiClient.get<EnvironmentalObservation[]>(`/environment/current${qs}`);
  },

  async getObservationHistory(stationId?: number, hours: number = 24): Promise<EnvironmentalObservation[]> {
    const params = new URLSearchParams();
    if (stationId) params.append("station_id", String(stationId));
    params.append("hours", String(hours));
    return apiClient.get<EnvironmentalObservation[]>(`/environment/history?${params.toString()}`);
  },

  async getEnvironmentalRisk(stationId?: number): Promise<EnvironmentalRisk> {
    const qs = stationId ? `?station_id=${stationId}` : "";
    return apiClient.get<EnvironmentalRisk>(`/environment/risk${qs}`);
  },

  async getEnvironmentalForecast(stationId?: number, hours: number = 24): Promise<EnvironmentalForecastItem[]> {
    const params = new URLSearchParams();
    if (stationId) params.append("station_id", String(stationId));
    params.append("hours", String(hours));
    return apiClient.get<EnvironmentalForecastItem[]>(`/environment/forecast?${params.toString()}`);
  },

  async getEnvironmentalAlerts(): Promise<any[]> {
    return apiClient.get<any[]>("/environment/alerts");
  },

  async recordObservation(payload: CreateObservationPayload): Promise<EnvironmentalObservation> {
    return apiClient.post<EnvironmentalObservation>("/environment/observations", payload);
  },
};
