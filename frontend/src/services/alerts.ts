import { apiClient } from "./apiClient";
import { Alert, AlertStatus, AlertSeverity, AlertType } from "@/types";

export interface AlertFilterParams {
  status?: AlertStatus;
  severity?: AlertSeverity;
  alert_type?: AlertType;
  station_id?: number;
  limit?: number;
  offset?: number;
}

export interface AlertCreateInput {
  alert_type: AlertType;
  severity?: AlertSeverity;
  title: string;
  message: string;
  entity_type?: string | null;
  entity_id?: number | null;
  station_id?: number | null;
}

export const alertsService = {
  /**
   * Retrieve alerts from central backend with optional filters.
   */
  async getAllAlerts(params?: AlertFilterParams): Promise<Alert[]> {
    const query = new URLSearchParams();
    if (params?.status) query.append("status", params.status);
    if (params?.severity) query.append("severity", params.severity);
    if (params?.alert_type) query.append("alert_type", params.alert_type);
    if (params?.station_id !== undefined && params?.station_id !== null) {
      query.append("station_id", String(params.station_id));
    }
    if (params?.limit) query.append("limit", String(params.limit));
    if (params?.offset) query.append("offset", String(params.offset));

    const qs = query.toString();
    const endpoint = qs ? `/alerts?${qs}` : "/alerts";
    return apiClient.get<Alert[]>(endpoint);
  },

  /**
   * Retrieve active and unacknowledged alerts for real-time operational picture.
   */
  async getActiveAlerts(limit: number = 50): Promise<Alert[]> {
    return apiClient.get<Alert[]>(`/alerts/active?limit=${limit}`);
  },

  /**
   * Retrieve alert details by ID.
   */
  async getAlertById(id: number): Promise<Alert> {
    return apiClient.get<Alert>(`/alerts/${id}`);
  },

  /**
   * Acknowledge an active alert by an authorized operator.
   */
  async acknowledgeAlert(id: number): Promise<Alert> {
    return apiClient.post<Alert>(`/alerts/${id}/acknowledge`);
  },

  /**
   * Mark an alert as resolved.
   */
  async resolveAlert(id: number): Promise<Alert> {
    return apiClient.post<Alert>(`/alerts/${id}/resolve`);
  },

  /**
   * Dismiss an alert.
   */
  async dismissAlert(id: number): Promise<Alert> {
    return apiClient.patch<Alert>(`/alerts/${id}/dismiss`);
  },

  /**
   * Raise a new alert in the central alerts system.
   */
  async createAlert(data: AlertCreateInput): Promise<Alert> {
    return apiClient.post<Alert>("/alerts", data);
  },
};
