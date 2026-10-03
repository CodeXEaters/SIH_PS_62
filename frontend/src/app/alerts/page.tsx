"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  RefreshCw,
  ShieldAlert,
  ChevronRight,
  X,
  ExternalLink,
  Info,
  Check,
  Eye,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button, Badge } from "@/components/ui";
import { alertsService } from "@/services/alerts";
import { useWebSocket } from "@/hooks/useWebSocket";
import { Alert, AlertStatus, AlertSeverity, AlertType } from "@/types";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");
  const [actionInProgress, setActionInProgress] = useState<number | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await alertsService.getAllAlerts();
      if (Array.isArray(data)) {
        setAlerts(data);
      }
    } catch (err: any) {
      console.warn("Failed to fetch alerts:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Real-time synchronization via WebSocket alerts channel
  useWebSocket({
    channel: "alerts",
    onMessage: () => {
      fetchAlerts();
    },
  });

  const handleAcknowledge = async (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActionInProgress(id);
    try {
      const updated = await alertsService.acknowledgeAlert(id);
      setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, ...updated } : a)));
      if (selectedAlert?.id === id) {
        setSelectedAlert((prev) => (prev ? { ...prev, ...updated } : null));
      }
      setFeedbackMessage(`Alert #${id} acknowledged.`);
      setTimeout(() => setFeedbackMessage(null), 4000);
    } catch (err: any) {
      setFeedbackMessage(`Error acknowledging alert: ${err?.message || "Operation failed"}`);
      setTimeout(() => setFeedbackMessage(null), 4000);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleResolve = async (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActionInProgress(id);
    try {
      const updated = await alertsService.resolveAlert(id);
      setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, ...updated } : a)));
      if (selectedAlert?.id === id) {
        setSelectedAlert((prev) => (prev ? { ...prev, ...updated } : null));
      }
      setFeedbackMessage(`Alert #${id} resolved successfully.`);
      setTimeout(() => setFeedbackMessage(null), 4000);
    } catch (err: any) {
      setFeedbackMessage(`Error resolving alert: ${err?.message || "Operation failed"}`);
      setTimeout(() => setFeedbackMessage(null), 4000);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDismiss = async (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActionInProgress(id);
    try {
      const updated = await alertsService.dismissAlert(id);
      setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, ...updated } : a)));
      if (selectedAlert?.id === id) {
        setSelectedAlert((prev) => (prev ? { ...prev, ...updated } : null));
      }
      setFeedbackMessage(`Alert #${id} dismissed.`);
      setTimeout(() => setFeedbackMessage(null), 4000);
    } catch (err: any) {
      setFeedbackMessage(`Error dismissing alert: ${err?.message || "Operation failed"}`);
      setTimeout(() => setFeedbackMessage(null), 4000);
    } finally {
      setActionInProgress(null);
    }
  };

  // Filter alerts
  const filteredAlerts = alerts.filter((alert) => {
    if (statusFilter !== "ALL" && alert.status !== statusFilter) return false;
    if (severityFilter !== "ALL" && alert.severity !== severityFilter) return false;
    return true;
  });

  const activeCount = alerts.filter((a) => a.status === "ACTIVE").length;
  const acknowledgedCount = alerts.filter((a) => a.status === "ACKNOWLEDGED").length;
  const criticalCount = alerts.filter((a) => a.severity === "CRITICAL" && a.status === "ACTIVE").length;

  const getSeverityStyle = (sev: AlertSeverity) => {
    switch (sev) {
      case "CRITICAL":
        return {
          badge: "bg-[#1F1010] text-[#B85C5C] border-[#B85C5C]/40",
          dot: "bg-[#B85C5C]",
          text: "text-[#B85C5C]",
          border: "border-l-[#B85C5C]",
        };
      case "HIGH":
        return {
          badge: "bg-[#1A1208] text-[#C49A55] border-[#C49A55]/40",
          dot: "bg-[#C49A55]",
          text: "text-[#C49A55]",
          border: "border-l-[#C49A55]",
        };
      case "MEDIUM":
        return {
          badge: "bg-[#141410] text-[#C8C8C5] border-[#383838]",
          dot: "bg-[#C8C8C5]",
          text: "text-[#C8C8C5]",
          border: "border-l-[#6F6D68]",
        };
      case "LOW":
      default:
        return {
          badge: "bg-[#0A140D] text-[#7FAF91] border-[#7FAF91]/30",
          dot: "bg-[#7FAF91]",
          text: "text-[#7FAF91]",
          border: "border-l-[#7FAF91]",
        };
    }
  };

  const getStatusBadge = (st: AlertStatus) => {
    switch (st) {
      case "ACTIVE":
        return "bg-[#1F1010] text-[#B85C5C] border-[#B85C5C]/40";
      case "ACKNOWLEDGED":
        return "bg-[#161208] text-[#C49A55] border-[#C49A55]/40";
      case "RESOLVED":
        return "bg-[#0A140D] text-[#7FAF91] border-[#7FAF91]/40";
      case "DISMISSED":
      default:
        return "bg-[#141414] text-[#6F6D68] border-[#242424]";
    }
  };

  const getEntityUrl = (entityType?: string | null, entityId?: number | null) => {
    if (!entityType || entityId === undefined || entityId === null) return null;
    switch (entityType.toUpperCase()) {
      case "CARGO":
        return `/cargo`;
      case "INVENTORY":
        return `/inventory`;
      case "ASSET":
        return `/assets`;
      case "MISSION":
        return `/missions`;
      case "PERSONNEL":
        return `/personnel`;
      case "STATION":
        return `/operations/map`;
      default:
        return null;
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#242424] pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  criticalCount > 0 ? "bg-[#B85C5C] animate-pulse" : "bg-[#7FAF91]"
                }`}
              />
              <span className="text-[10px] font-mono tracking-[0.2em] text-[#C8C8C5] uppercase font-semibold">
                NCPOR OPERATIONAL TELEMETRY &bull; CENTRAL ALERTS
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F5F3EE]">
              OPERATIONAL ALERTS
            </h1>
            <p className="text-xs sm:text-sm text-[#A5A29C] mt-1">
              Active system alerts, sensor threshold anomalies, and mission hazard notices across polar bases.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchAlerts}
              disabled={isLoading}
              className="gap-2 font-mono text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </Button>
            <Link href="/dashboard">
              <Button variant="primary" size="sm" className="font-mono text-xs">
                <span>&larr; Command Center</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Feedback notification toast */}
        {feedbackMessage && (
          <div className="p-3 rounded bg-[#0A0A0A] border border-[#7FAF91]/50 text-xs font-mono text-[#7FAF91] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-[#7FAF91]" />
              <span>{feedbackMessage}</span>
            </div>
            <button
              onClick={() => setFeedbackMessage(null)}
              className="text-[#6F6D68] hover:text-[#F5F3EE]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Metric Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded bg-[#101010] border border-[#242424]">
            <span className="text-[10px] font-mono font-medium tracking-widest text-[#6F6D68] uppercase block">
              TOTAL ALERTS
            </span>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-[#F5F3EE] mt-1">
              {alerts.length}
            </div>
            <span className="text-[10px] font-mono text-[#6F6D68] mt-0.5 block">
              System wide records
            </span>
          </div>

          <div className="p-4 rounded bg-[#101010] border border-[#242424]">
            <span className="text-[10px] font-mono font-medium tracking-widest text-[#B85C5C] uppercase block">
              CRITICAL HAZARDS
            </span>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-[#B85C5C] mt-1">
              {criticalCount}
            </div>
            <span className="text-[10px] font-mono text-[#6F6D68] mt-0.5 block">
              Requires immediate action
            </span>
          </div>

          <div className="p-4 rounded bg-[#101010] border border-[#242424]">
            <span className="text-[10px] font-mono font-medium tracking-widest text-[#C49A55] uppercase block">
              ACTIVE UNRESOLVED
            </span>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-[#C49A55] mt-1">
              {activeCount}
            </div>
            <span className="text-[10px] font-mono text-[#6F6D68] mt-0.5 block">
              Pending resolution
            </span>
          </div>

          <div className="p-4 rounded bg-[#101010] border border-[#242424]">
            <span className="text-[10px] font-mono font-medium tracking-widest text-[#7FAF91] uppercase block">
              ACKNOWLEDGED
            </span>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-[#7FAF91] mt-1">
              {acknowledgedCount}
            </div>
            <span className="text-[10px] font-mono text-[#6F6D68] mt-0.5 block">
              Operator logged
            </span>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded bg-[#0D0D0D] border border-[#242424]">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] font-mono">
            <span className="text-[#6F6D68] text-[10px] uppercase mr-1 hidden sm:inline">STATUS:</span>
            {["ALL", "ACTIVE", "ACKNOWLEDGED", "RESOLVED"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                  statusFilter === st
                    ? "bg-[#202020] text-[#F5F3EE] font-bold border border-[#383838]"
                    : "text-[#8F8D88] hover:text-[#F5F3EE] hover:bg-[#151515]"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Severity Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] font-mono">
            <span className="text-[#6F6D68] text-[10px] uppercase mr-1 hidden sm:inline">SEVERITY:</span>
            {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                  severityFilter === sev
                    ? "bg-[#202020] text-[#F5F3EE] font-bold border border-[#383838]"
                    : "text-[#8F8D88] hover:text-[#F5F3EE] hover:bg-[#151515]"
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>

        {/* Alerts List */}
        <div className="rounded bg-[#0A0A0A] border border-[#242424] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#242424] flex items-center justify-between bg-[#070707]">
            <span className="text-xs font-mono font-bold tracking-wider text-[#F5F3EE] uppercase flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-[#C49A55]" />
              ALERT REGISTRY ({filteredAlerts.length})
            </span>
            <span className="text-[10px] font-mono text-[#6F6D68]">
              LIVE BACKEND SYNCHRONIZATION
            </span>
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-xs font-mono text-[#6F6D68] space-y-2">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#7FAF91]" />
              <p>Loading operational alerts from central backend...</p>
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="p-12 text-center text-xs font-mono text-[#6F6D68] space-y-1">
              <CheckCircle2 className="w-6 h-6 mx-auto text-[#7FAF91] mb-2" />
              <p className="text-sm font-bold text-[#F5F3EE]">No matching alerts found</p>
              <p className="text-[11px] text-[#6F6D68]">
                All station sensor parameters and operational telemetry within nominal thresholds.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#242424]">
              {filteredAlerts.map((alert) => {
                const sevStyle = getSeverityStyle(alert.severity);
                const isSelected = selectedAlert?.id === alert.id;
                const isOperating = actionInProgress === alert.id;

                return (
                  <div
                    key={alert.id}
                    onClick={() => setSelectedAlert(alert)}
                    className={`p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer transition-colors border-l-4 ${
                      sevStyle.border
                    } ${
                      isSelected
                        ? "bg-[#151515]"
                        : "hover:bg-[#101010]"
                    }`}
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono font-bold text-[#6F6D68]">
                          #{String(alert.id).padStart(3, "0")}
                        </span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-bold ${sevStyle.badge}`}>
                          {alert.severity}
                        </span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${getStatusBadge(alert.status)}`}>
                          {alert.status}
                        </span>
                        <span className="text-[10px] font-mono text-[#6F6D68] uppercase">
                          {alert.alert_type?.replace(/_/g, " ")}
                        </span>
                        {alert.station_id && (
                          <span className="text-[10px] font-mono text-[#A5A29C]">
                            &bull; Station #{alert.station_id}
                          </span>
                        )}
                        {alert.entity_type && (
                          <span className="text-[10px] font-mono text-[#6F6D68]">
                            &bull; {alert.entity_type} {alert.entity_id ? `(#${alert.entity_id})` : ""}
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-[#F5F3EE] tracking-tight">
                        {alert.title}
                      </h3>

                      <p className="text-xs text-[#A5A29C] leading-relaxed line-clamp-2">
                        {alert.message}
                      </p>

                      <div className="flex items-center gap-4 text-[10px] font-mono text-[#6F6D68] pt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {alert.created_at ? new Date(alert.created_at).toLocaleString("en-GB", { timeZone: "UTC" }) + " UTC" : "—"}
                        </span>
                        {alert.acknowledged_at && (
                          <span className="text-[#C49A55]">
                            &bull; Ack: {new Date(alert.acknowledged_at).toLocaleTimeString("en-GB", { timeZone: "UTC" })}
                          </span>
                        )}
                        {alert.resolved_at && (
                          <span className="text-[#7FAF91]">
                            &bull; Resolved: {new Date(alert.resolved_at).toLocaleTimeString("en-GB", { timeZone: "UTC" })}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quick Operator Actions */}
                    <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0">
                      {alert.status === "ACTIVE" && (
                        <button
                          onClick={(e) => handleAcknowledge(alert.id, e)}
                          disabled={isOperating}
                          className="px-2.5 py-1.5 rounded bg-[#161208] border border-[#C49A55]/40 hover:border-[#C49A55] text-[#C49A55] text-xs font-mono transition-colors disabled:opacity-50"
                        >
                          {isOperating ? "Processing..." : "Acknowledge"}
                        </button>
                      )}

                      {alert.status !== "RESOLVED" && alert.status !== "DISMISSED" && (
                        <button
                          onClick={(e) => handleResolve(alert.id, e)}
                          disabled={isOperating}
                          className="px-2.5 py-1.5 rounded bg-[#0A140D] border border-[#7FAF91]/40 hover:border-[#7FAF91] text-[#7FAF91] text-xs font-mono transition-colors disabled:opacity-50"
                        >
                          Resolve
                        </button>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAlert(alert);
                        }}
                        className="p-1.5 rounded text-[#6F6D68] hover:text-[#F5F3EE] hover:bg-[#1A1A1A] transition-colors"
                        title="Inspect Alert Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Detailed Alert Inspection Modal / Drawer */}
        {selectedAlert && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#0A0A0A] border border-[#242424] rounded-lg w-full max-w-lg p-6 space-y-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#242424] pb-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      getSeverityStyle(selectedAlert.severity).dot
                    }`}
                  />
                  <h2 className="text-sm font-bold font-mono text-[#F5F3EE] uppercase tracking-wider">
                    Alert Inspector &bull; #{String(selectedAlert.id).padStart(3, "0")}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedAlert(null)}
                  className="text-[#6F6D68] hover:text-[#F5F3EE] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Status and Severity Badges */}
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-bold ${getSeverityStyle(selectedAlert.severity).badge}`}>
                  {selectedAlert.severity}
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${getStatusBadge(selectedAlert.status)}`}>
                  {selectedAlert.status}
                </span>
                <span className="text-[10px] font-mono text-[#6F6D68] uppercase">
                  TYPE: {selectedAlert.alert_type}
                </span>
              </div>

              {/* Title & Message */}
              <div className="space-y-2 bg-[#101010] p-4 rounded border border-[#242424]">
                <h3 className="text-sm font-bold text-[#F5F3EE]">{selectedAlert.title}</h3>
                <p className="text-xs text-[#C8C8C5] leading-relaxed">{selectedAlert.message}</p>
              </div>

              {/* Telemetry / Entity Context */}
              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 rounded bg-[#101010] border border-[#242424]">
                  <span className="text-[9px] uppercase text-[#6F6D68] block">Related Entity</span>
                  <span className="font-bold text-[#F5F3EE] mt-0.5 block">
                    {selectedAlert.entity_type || "None"} {selectedAlert.entity_id ? `(#${selectedAlert.entity_id})` : ""}
                  </span>
                  {getEntityUrl(selectedAlert.entity_type, selectedAlert.entity_id) && (
                    <Link
                      href={getEntityUrl(selectedAlert.entity_type, selectedAlert.entity_id)!}
                      className="text-[10px] text-[#C8A96B] hover:underline flex items-center gap-1 mt-1"
                    >
                      <span>Navigate to {selectedAlert.entity_type}</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  )}
                </div>

                <div className="p-3 rounded bg-[#101010] border border-[#242424]">
                  <span className="text-[9px] uppercase text-[#6F6D68] block">Polar Station</span>
                  <span className="font-bold text-[#F5F3EE] mt-0.5 block">
                    {selectedAlert.station_id ? `Station ID: ${selectedAlert.station_id}` : "All Bases / Global"}
                  </span>
                </div>
              </div>

              {/* Audit Timestamps */}
              <div className="p-3 rounded bg-[#0D0D0D] border border-[#1A1A1A] space-y-1.5 text-[11px] font-mono text-[#A5A29C]">
                <div className="flex justify-between">
                  <span className="text-[#6F6D68]">Created:</span>
                  <span>{new Date(selectedAlert.created_at).toLocaleString("en-GB", { timeZone: "UTC" })} UTC</span>
                </div>
                {selectedAlert.acknowledged_at && (
                  <div className="flex justify-between">
                    <span className="text-[#6F6D68]">Acknowledged:</span>
                    <span>{new Date(selectedAlert.acknowledged_at).toLocaleString("en-GB", { timeZone: "UTC" })} UTC</span>
                  </div>
                )}
                {selectedAlert.resolved_at && (
                  <div className="flex justify-between">
                    <span className="text-[#6F6D68]">Resolved:</span>
                    <span>{new Date(selectedAlert.resolved_at).toLocaleString("en-GB", { timeZone: "UTC" })} UTC</span>
                  </div>
                )}
              </div>

              {/* Operator Command Actions */}
              <div className="pt-2 border-t border-[#242424] flex items-center justify-end gap-2.5">
                {selectedAlert.status === "ACTIVE" && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleAcknowledge(selectedAlert.id)}
                    disabled={actionInProgress === selectedAlert.id}
                    className="font-mono text-xs"
                  >
                    Acknowledge Notice
                  </Button>
                )}

                {selectedAlert.status !== "RESOLVED" && selectedAlert.status !== "DISMISSED" && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleResolve(selectedAlert.id)}
                    disabled={actionInProgress === selectedAlert.id}
                    className="font-mono text-xs"
                  >
                    Resolve Alert
                  </Button>
                )}

                {selectedAlert.status !== "DISMISSED" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDismiss(selectedAlert.id)}
                    disabled={actionInProgress === selectedAlert.id}
                    className="font-mono text-xs text-[#6F6D68]"
                  >
                    Dismiss
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedAlert(null)}
                  className="font-mono text-xs"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
