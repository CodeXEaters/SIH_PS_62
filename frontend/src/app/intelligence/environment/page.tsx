"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { IntelligenceTabs } from "@/components/intelligence/IntelligenceTabs";
import { Badge, Button } from "@/components/ui";
import {
  environmentService,
  EnvironmentalObservation,
  EnvironmentalRisk,
  EnvironmentalForecastItem,
} from "@/services/environment";
import { feedbackService } from "@/services/feedback";
import {
  CloudSnow,
  Wind,
  Compass,
  Eye,
  Gauge,
  Thermometer,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Info,
  Check,
  ChevronRight,
} from "lucide-react";

const STATIONS = [
  { id: 4, name: "Bharati Station", lat: -69.4072, lon: 76.1914, region: "Larsemann Hills, East Antarctica" },
  { id: 3, name: "Maitri Station", lat: -70.7667, lon: 11.7333, region: "Schirmacher Oasis, Queen Maud Land" },
  { id: 5, name: "Field Camp Alpha", lat: -71.2000, lon: 12.5000, region: "Deep Continental Ice Core Site" },
  { id: 6, name: "Field Camp Echo", lat: -69.7500, lon: 73.5000, region: "Amery Ice Shelf" },
  { id: 2, name: "Cape Town Transit Hub", lat: -33.9249, lon: 18.4241, region: "Port of Cape Town, South Africa" },
  { id: 1, name: "NCPOR Goa", lat: 15.4026, lon: 73.8055, region: "Polar Logistics HQ, Goa, India" },
];

export default function EnvironmentIntelligencePage() {
  const [selectedStationId, setSelectedStationId] = useState<number>(4);
  const [allObservations, setAllObservations] = useState<EnvironmentalObservation[]>([]);
  const [risk, setRisk] = useState<EnvironmentalRisk | null>(null);
  const [forecast, setForecast] = useState<EnvironmentalForecastItem[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  const fetchEnvironmentData = async (stationId: number) => {
    setIsLoading(true);
    try {
      const [allObs, stationRisk, stationForecast, envAlerts] = await Promise.all([
        environmentService.getCurrentObservations(),
        environmentService.getEnvironmentalRisk(stationId),
        environmentService.getEnvironmentalForecast(stationId, 24),
        environmentService.getEnvironmentalAlerts(),
      ]);

      setAllObservations(allObs || []);
      setRisk(stationRisk);
      setForecast(stationForecast || []);
      setAlerts(envAlerts || []);
    } catch (err) {
      console.warn("Failed to fetch environmental data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEnvironmentData(selectedStationId);
  }, [selectedStationId]);

  const currentStationObs = allObservations.find((o) => o.station_id === selectedStationId);
  const selectedStationMeta = STATIONS.find((s) => s.id === selectedStationId);

  const handleRecordFeedback = async (recId: string, decision: "APPROVED" | "REJECTED") => {
    try {
      await feedbackService.recordFeedback({
        recommendation_id: recId,
        decision,
        reason: `Operator decision recorded from Environmental Intelligence console for Station #${selectedStationId}`,
      });
      setFeedbackSuccess(recId);
      setTimeout(() => setFeedbackSuccess(null), 3500);
    } catch (err: any) {
      alert(`Feedback submission failed: ${err.message}`);
    }
  };

  const getRiskBadgeColor = (level: string) => {
    switch (level) {
      case "CRITICAL":
        return "text-[#E06D6D] bg-[#E06D6D]/10 border-[#E06D6D]/30";
      case "HIGH":
        return "text-[#E0A96D] bg-[#E0A96D]/10 border-[#E0A96D]/30";
      case "MEDIUM":
        return "text-[#8EB8E5] bg-[#8EB8E5]/10 border-[#8EB8E5]/30";
      default:
        return "text-[#7FAF91] bg-[#7FAF91]/10 border-[#7FAF91]/30";
    }
  };

  return (
    <AppShell>
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#242424] pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8EB8E5]" />
              <span className="text-[10px] font-mono tracking-[0.25em] text-[#C8C8C5] uppercase font-semibold">
                INTELLIGENCE &bull; METEOROLOGICAL &amp; CRYOSPHERIC RADAR
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F5F3EE]">
              ENVIRONMENTAL INTELLIGENCE
            </h1>
            <p className="text-xs sm:text-sm text-[#A5A29C] mt-1">
              Live polar weather telemetry, katabatic risk modeling, sea-ice fracture monitoring, and 24h predictive sorties clearance.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 text-[10px] font-mono rounded border bg-[#1A1A1A] border-[#333] text-[#A5A29C]">
              SOURCE: <span className="text-[#8EB8E5] font-semibold">SYNTHETIC SIMULATED (DHRUV ENGINE)</span>
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchEnvironmentData(selectedStationId)}
              disabled={isLoading}
              className="border-[#333] hover:border-[#555] text-xs font-mono"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
              SYNC RADAR
            </Button>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <IntelligenceTabs />

        {/* Station Selector Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {STATIONS.map((st) => (
            <button
              key={st.id}
              onClick={() => setSelectedStationId(st.id)}
              className={`px-3 py-2 text-xs font-mono rounded border whitespace-nowrap transition-colors flex items-center gap-2 ${
                selectedStationId === st.id
                  ? "bg-[#1E2522] border-[#7FAF91] text-[#F5F3EE] font-bold"
                  : "bg-[#141414] border-[#242424] text-[#888] hover:text-[#CCC] hover:border-[#383838]"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${selectedStationId === st.id ? "bg-[#7FAF91]" : "bg-[#444]"}`} />
              <span>{st.name}</span>
            </button>
          ))}
        </div>

        {/* Station Hero Overview */}
        <div className="bg-[#141414] border border-[#242424] rounded-xl p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-[#242424] pb-6 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-[#F5F3EE]">{selectedStationMeta?.name}</h2>
                <Badge variant="outline" className="font-mono text-[10px]">
                  ID #{selectedStationId}
                </Badge>
              </div>
              <div className="text-xs text-[#888] font-mono mt-1">
                {selectedStationMeta?.region} &bull; Coordinates: {selectedStationMeta?.lat}°, {selectedStationMeta?.lon}°
              </div>
            </div>

            {/* Environmental Risk Meter */}
            {risk && (
              <div className="flex items-center gap-4 bg-[#1A1A1A] border border-[#282828] px-4 py-3 rounded-lg">
                <div>
                  <div className="text-[10px] font-mono text-[#888] uppercase">Composite Environmental Risk</div>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-3xl font-mono font-bold text-[#F5F3EE]">
                      {Math.round(risk.score)}
                    </span>
                    <span className="text-[10px] text-[#666] font-mono">/ 100</span>
                  </div>
                </div>
                <div className={`px-2.5 py-1 text-xs font-mono font-bold rounded border ${getRiskBadgeColor(risk.level)}`}>
                  {risk.level}
                </div>
              </div>
            )}
          </div>

          {/* Telemetry KPI Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-[#1C1C1C] border border-[#262626] p-3.5 rounded-lg">
              <div className="text-[10px] font-mono text-[#888] uppercase flex items-center gap-1">
                <Thermometer className="w-3.5 h-3.5 text-[#8EB8E5]" /> Temperature
              </div>
              <div className="text-xl font-bold font-mono text-[#F5F3EE] mt-1.5">
                {currentStationObs ? `${currentStationObs.temperature.toFixed(1)}°C` : "--"}
              </div>
              <div className="text-[10px] text-[#666] font-mono mt-1">Surface ambient</div>
            </div>

            <div className="bg-[#1C1C1C] border border-[#262626] p-3.5 rounded-lg">
              <div className="text-[10px] font-mono text-[#888] uppercase flex items-center gap-1">
                <Wind className="w-3.5 h-3.5 text-[#E0A96D]" /> Wind Speed
              </div>
              <div className="text-xl font-bold font-mono text-[#F5F3EE] mt-1.5">
                {currentStationObs ? `${currentStationObs.wind_speed.toFixed(1)} kts` : "--"}
              </div>
              <div className="text-[10px] text-[#666] font-mono mt-1">
                Dir: {currentStationObs?.wind_direction || "N/A"}
              </div>
            </div>

            <div className="bg-[#1C1C1C] border border-[#262626] p-3.5 rounded-lg">
              <div className="text-[10px] font-mono text-[#888] uppercase flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-[#7FAF91]" /> Visibility
              </div>
              <div className="text-xl font-bold font-mono text-[#F5F3EE] mt-1.5">
                {currentStationObs ? `${currentStationObs.visibility.toFixed(1)} km` : "--"}
              </div>
              <div className="text-[10px] text-[#666] font-mono mt-1">Horizon line</div>
            </div>

            <div className="bg-[#1C1C1C] border border-[#262626] p-3.5 rounded-lg">
              <div className="text-[10px] font-mono text-[#888] uppercase flex items-center gap-1">
                <Gauge className="w-3.5 h-3.5 text-[#A5A29C]" /> Pressure
              </div>
              <div className="text-xl font-bold font-mono text-[#F5F3EE] mt-1.5">
                {currentStationObs ? `${currentStationObs.pressure.toFixed(1)} hPa` : "--"}
              </div>
              <div className="text-[10px] text-[#666] font-mono mt-1">Barometric</div>
            </div>

            <div className="bg-[#1C1C1C] border border-[#262626] p-3.5 rounded-lg">
              <div className="text-[10px] font-mono text-[#888] uppercase flex items-center gap-1">
                <CloudSnow className="w-3.5 h-3.5 text-[#8EB8E5]" /> Condition
              </div>
              <div className="text-sm font-bold font-mono text-[#F5F3EE] mt-2 truncate">
                {currentStationObs ? currentStationObs.weather_condition.replace(/_/g, " ") : "--"}
              </div>
              <div className="text-[10px] text-[#666] font-mono mt-1">Met category</div>
            </div>

            <div className="bg-[#1C1C1C] border border-[#262626] p-3.5 rounded-lg">
              <div className="text-[10px] font-mono text-[#888] uppercase flex items-center gap-1">
                <Compass className="w-3.5 h-3.5 text-[#E06D6D]" /> Sea Ice
              </div>
              <div className="text-xl font-bold font-mono text-[#F5F3EE] mt-1.5">
                {currentStationObs ? `${Math.round(currentStationObs.sea_ice_concentration)}%` : "--"}
              </div>
              <div className="text-[10px] text-[#666] font-mono mt-1 truncate">
                {currentStationObs ? currentStationObs.sea_ice_condition.replace(/_/g, " ") : "--"}
              </div>
            </div>
          </div>
        </div>

        {/* Explainable AI Risk Factors & Recommendations */}
        {risk && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Risk Factors */}
            <div className="bg-[#141414] border border-[#242424] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-[#E0A96D]" />
                <h3 className="text-sm font-bold text-[#F5F3EE] uppercase font-mono">
                  Identified Environmental Stress Factors
                </h3>
              </div>
              {risk.factors.length === 0 ? (
                <div className="text-xs text-[#7FAF91] flex items-center gap-2 p-3 bg-[#7FAF91]/10 rounded border border-[#7FAF91]/20">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>All meteorological vectors within nominal polar baseline envelope.</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {risk.factors.map((factor, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-[#1A1A1A] border border-[#282828] rounded text-xs text-[#CCC] flex items-start gap-2.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#E0A96D] mt-1.5 shrink-0" />
                      <span>{factor}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AI Operational Safeguards & Human Feedback */}
            <div className="bg-[#141414] border border-[#242424] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <ShieldAlert className="w-4 h-4 text-[#7FAF91]" />
                <h3 className="text-sm font-bold text-[#F5F3EE] uppercase font-mono">
                  Autonomous Operational Safeguards &amp; Feedback
                </h3>
              </div>
              <div className="space-y-2.5">
                {risk.recommendations.map((rec, idx) => {
                  const recId = `ENV-REC-${selectedStationId}-${idx}`;
                  const isDone = feedbackSuccess === recId;

                  return (
                    <div
                      key={idx}
                      className="p-3 bg-[#1A1A1A] border border-[#282828] rounded flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-start gap-2 text-[#E2E0DB]">
                        <ChevronRight className="w-3.5 h-3.5 text-[#7FAF91] mt-0.5 shrink-0" />
                        <span>{rec}</span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isDone ? (
                          <span className="text-[10px] font-mono text-[#7FAF91] flex items-center gap-1">
                            <Check className="w-3 h-3" /> DECISION LOGGED
                          </span>
                        ) : (
                          <>
                            <button
                              onClick={() => handleRecordFeedback(recId, "APPROVED")}
                              className="px-2 py-1 text-[10px] font-mono rounded bg-[#2D6A4F]/30 text-[#7FAF91] hover:bg-[#2D6A4F]/60"
                            >
                              ACCEPT
                            </button>
                            <button
                              onClick={() => handleRecordFeedback(recId, "REJECTED")}
                              className="px-2 py-1 text-[10px] font-mono rounded bg-[#E06D6D]/20 text-[#E06D6D] hover:bg-[#E06D6D]/40"
                            >
                              DISMISS
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 24-Hour Forecast Timeline */}
        <div className="bg-[#141414] border border-[#242424] rounded-xl p-5">
          <div className="flex items-center justify-between border-b border-[#242424] pb-3 mb-4">
            <div className="flex items-center gap-2">
              <CloudSnow className="w-4 h-4 text-[#8EB8E5]" />
              <h3 className="text-sm font-bold text-[#F5F3EE] uppercase font-mono">
                24-Hour Horizon Predictive Forecast (Synthetic Trend)
              </h3>
            </div>
            <span className="text-[10px] font-mono text-[#666]">Hourly Resolution</span>
          </div>

          <div className="overflow-x-auto">
            <div className="flex gap-2 min-w-[700px] pb-2">
              {forecast.slice(0, 12).map((item, idx) => {
                const timeStr = new Date(item.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                return (
                  <div
                    key={idx}
                    className="flex-1 bg-[#1A1A1A] border border-[#282828] rounded p-3 text-center min-w-[95px]"
                  >
                    <div className="text-[10px] font-mono text-[#888]">{timeStr}</div>
                    <div className="text-sm font-bold font-mono text-[#F5F3EE] mt-1">
                      {item.temperature.toFixed(1)}°
                    </div>
                    <div className="text-[10px] text-[#A5A29C] font-mono mt-0.5">
                      {item.wind_speed.toFixed(0)} kts
                    </div>
                    <div className="text-[9px] font-mono text-[#666] mt-1 truncate">
                      {item.weather_condition.replace(/_/g, " ")}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* All Stations Environmental Radar Grid */}
        <div className="bg-[#141414] border border-[#242424] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#242424] flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold uppercase text-[#CCC]">
              All Expedition Stations Met Radar Summary
            </h3>
            <span className="text-[10px] font-mono text-[#666]">{allObservations.length} Stations Online</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#1C1C1C] border-b border-[#242424] text-[10px] font-mono text-[#888] uppercase">
                <tr>
                  <th className="px-4 py-3">Station</th>
                  <th className="px-4 py-3">Condition</th>
                  <th className="px-4 py-3">Temp</th>
                  <th className="px-4 py-3">Wind</th>
                  <th className="px-4 py-3">Visibility</th>
                  <th className="px-4 py-3">Sea Ice Conc.</th>
                  <th className="px-4 py-3">Telemetry Mode</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#242424]">
                {allObservations.map((obs) => {
                  const sMeta = STATIONS.find((s) => s.id === obs.station_id);
                  return (
                    <tr
                      key={obs.id}
                      onClick={() => setSelectedStationId(obs.station_id)}
                      className={`hover:bg-[#1A1A1A] cursor-pointer transition-colors ${
                        obs.station_id === selectedStationId ? "bg-[#1E2522]/50" : ""
                      }`}
                    >
                      <td className="px-4 py-3 font-mono font-medium text-[#F5F3EE]">
                        {sMeta?.name || `Station #${obs.station_id}`}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-[11px] text-[#CCC]">
                          {obs.weather_condition.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[#CCC]">{obs.temperature.toFixed(1)}°C</td>
                      <td className="px-4 py-3 font-mono text-[#CCC]">
                        {obs.wind_speed.toFixed(1)} kts {obs.wind_direction}
                      </td>
                      <td className="px-4 py-3 font-mono text-[#CCC]">{obs.visibility.toFixed(1)} km</td>
                      <td className="px-4 py-3 font-mono text-[#CCC]">
                        {Math.round(obs.sea_ice_concentration)}% ({obs.sea_ice_condition.replace(/_/g, " ")})
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#242424] text-[#8EB8E5] border border-[#333]">
                          SIMULATED
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
