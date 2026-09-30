import { apiClient } from "./apiClient";

export interface FeedbackRecord {
  id: number;
  recommendation_id: string;
  operator_id?: number;
  decision: "APPROVED" | "REJECTED" | "ALTERNATIVE_SELECTED" | string;
  reason?: string;
  outcome?: "SUCCESSFUL" | "PARTIAL" | "FAILED" | "PENDING" | string;
  timestamp: string;
}

export interface FeedbackSummary {
  total_decisions: number;
  approved_count: number;
  rejected_count: number;
  alternative_count: number;
  acceptance_rate_percent: number;
  recent_audit_log: FeedbackRecord[];
}

export interface RecordFeedbackPayload {
  recommendation_id: string;
  decision: "APPROVED" | "REJECTED" | "ALTERNATIVE_SELECTED";
  reason?: string;
  outcome?: "SUCCESSFUL" | "PARTIAL" | "FAILED" | "PENDING";
}

export const feedbackService = {
  async recordFeedback(payload: RecordFeedbackPayload): Promise<FeedbackRecord> {
    return apiClient.post<FeedbackRecord>("/feedback", payload);
  },

  async getFeedbackSummary(): Promise<FeedbackSummary> {
    return apiClient.get<FeedbackSummary>("/feedback/summary");
  },
};
