"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  Box,
  Users,
  Database,
  Truck,
  Radio,
  FileSpreadsheet,
  RefreshCw,
  ShieldCheck,
  Fuel,
  Activity,
  AlertTriangle,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { AppShell } from "@/components/layout/AppShell";
import { Badge, Button } from "@/components/ui";
import { reportsService, ReportSummary, ReportChartsResponse } from "@/services/reports";

export default function ReportsPage() {
  const [activeReportTab, setActiveReportTab] = useState<"cargo" | "fuel" | "assets">("cargo");
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [charts, setCharts] = useState<ReportChartsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    Promise.allSettled([
      reportsService.getPerformanceSummary(),
      reportsService.getReportCharts(),
    ]).then(([summaryRes, chartsRes]) => {
      if (!isMounted) return;
      if (summaryRes.status === "fulfilled" && summaryRes.value) {
        setSummary(summaryRes.value);
      }
      if (chartsRes.status === "fulfilled" && chartsRes.value) {
        setCharts(chartsRes.value);
      }
      setIsLoading(false);
    });
    return () => { isMounted = false; };
  }, []);

  const monthlyCargoData = charts?.monthlyCargoData ?? [];
  const fuelConsumptionData = charts?.fuelConsumptionData ?? [];
  const assetHealthData = charts?.assetHealthData ?? [];

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-polar-border pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-polar-cyan font-bold">
                OPERATIONAL ANALYTICS
              </span>
              <span className="text-polar-muted">&bull;</span>
              <span className="text-[10px] font-mono text-emerald-400">
                OFFICIAL NCPOR COMPLIANCE
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              EXPEDITION ANALYTICS &amp; REPORTS
            </h1>
            <p className="text-xs sm:text-sm text-polar-muted mt-0.5">
              Throughput logs, fuel burn curves, fleet health readiness, and safety compliance audits.
            </p>
          </div>

          <Button variant="secondary" size="sm" className="gap-1.5 font-mono text-xs">
            <Download className="w-3.5 h-3.5" />
            <span>Export Official PDF Report</span>
          </Button>
        </div>

        {/* Top Operational Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-4 rounded-lg bg-polar-deep/90 border border-polar-border space-y-1">
            <span className="text-[10px] font-mono text-polar-muted uppercase block">READINESS INDEX</span>
            <span className="text-xl font-bold font-mono text-emerald-400">
              {summary ? `${Math.round(summary.expeditionReadinessPct)}%` : "..."}
            </span>
            <span className="text-[9px] font-mono text-polar-muted block">Asset Health Avg</span>
          </div>
          <div className="p-4 rounded-lg bg-polar-deep/90 border border-polar-border space-y-1">
            <span className="text-[10px] font-mono text-polar-muted uppercase block">CARGO TRACKED</span>
            <span className="text-xl font-bold font-mono text-polar-cyan">
              {summary ? `${summary.cargoTonnageTracked} t` : "..."}
            </span>
            <span className="text-[9px] font-mono text-polar-muted block">Expedition Manifest</span>
          </div>
          <div className="p-4 rounded-lg bg-polar-deep/90 border border-polar-border space-y-1">
            <span className="text-[10px] font-mono text-polar-muted uppercase block">MIN SUPPLY RESERVE</span>
            <span className={`text-xl font-bold font-mono ${(summary?.criticalSupplyDaysMin || 0) < 10 ? "text-amber-400" : "text-polar-snow"}`}>
              {summary ? `${summary.criticalSupplyDaysMin} d` : "..."}
            </span>
            <span className="text-[9px] font-mono text-polar-muted block">Critical Inventory</span>
          </div>
          <div className="p-4 rounded-lg bg-polar-deep/90 border border-polar-border space-y-1">
            <span className="text-[10px] font-mono text-polar-muted uppercase block">MISSIONS DONE</span>
            <span className="text-xl font-bold font-mono text-polar-snow">
              {summary ? summary.totalMissionsCompleted : "..."}
            </span>
            <span className="text-[9px] font-mono text-polar-muted block">Traverses Completed</span>
          </div>
          <div className="p-4 rounded-lg bg-polar-deep/90 border border-polar-border space-y-1">
            <span className="text-[10px] font-mono text-polar-muted uppercase block">ACTIVE INCIDENTS</span>
            <span className={`text-xl font-bold font-mono ${(summary?.activeIncidentsCount || 0) > 0 ? "text-rose-400" : "text-emerald-400"}`}>
              {summary ? summary.activeIncidentsCount : "..."}
            </span>
            <span className="text-[9px] font-mono text-polar-muted block">SAR &amp; Distress</span>
          </div>
          <div className="p-4 rounded-lg bg-polar-deep/90 border border-polar-border space-y-1">
            <span className="text-[10px] font-mono text-polar-muted uppercase block">FUEL STATUS</span>
            <span className="text-xs font-bold font-mono text-polar-snow mt-1 block truncate" title={summary?.fuelEfficiencyRate || ""}>
              {summary ? (summary.fuelEfficiencyRate.includes("days") ? summary.fuelEfficiencyRate.replace("Derived: ", "") : "Stable") : "..."}
            </span>
            <span className="text-[9px] font-mono text-polar-muted block">Thermal Bunkering</span>
          </div>
        </div>

        {/* Report Selector Tabs */}
        <div className="flex items-center gap-2 border-b border-polar-border pb-2 overflow-x-auto text-xs font-mono">
          <button
            onClick={() => setActiveReportTab("cargo")}
            className={`px-3 py-1.5 rounded transition-all ${
              activeReportTab === "cargo"
                ? "bg-polar-deep text-polar-cyan font-bold border border-polar-cyan/40"
                : "text-polar-muted hover:text-polar-snow"
            }`}
          >
            Cargo Throughput
          </button>
          <button
            onClick={() => setActiveReportTab("fuel")}
            className={`px-3 py-1.5 rounded transition-all ${
              activeReportTab === "fuel"
                ? "bg-polar-deep text-polar-cyan font-bold border border-polar-cyan/40"
                : "text-polar-muted hover:text-polar-snow"
            }`}
          >
            Fuel Burn Rate
          </button>
          <button
            onClick={() => setActiveReportTab("assets")}
            className={`px-3 py-1.5 rounded transition-all ${
              activeReportTab === "assets"
                ? "bg-polar-deep text-polar-cyan font-bold border border-polar-cyan/40"
                : "text-polar-muted hover:text-polar-snow"
            }`}
          >
            Fleet Health &amp; Readiness
          </button>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Selected Chart (8 Columns) */}
          <div className="lg:col-span-8 p-6 rounded-lg bg-polar-deep/90 border border-polar-border shadow-sm space-y-4">
            {activeReportTab === "cargo" && (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono font-bold tracking-wider text-polar-snow uppercase">
                    CARGO THROUGHPUT &bull; TONNAGE RECEIVED VS MANIFEST
                  </h3>
                  <Badge variant="info">
                    {charts ? `${charts.totalDeliveredTonnes} t Delivered` : "Calculating..."}
                  </Badge>
                </div>
                <div className="h-72 w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyCargoData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#16314F" />
                      <XAxis dataKey="month" stroke="#A7B9CB" fontSize={11} />
                      <YAxis stroke="#A7B9CB" fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#08111F",
                          borderColor: "#16314F",
                          borderRadius: "4px",
                          fontSize: "12px",
                        }}
                      />
                      <Bar dataKey="dispatched" name="Tonnes Manifested" fill="#4A6572" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="received" name="Tonnes Received" fill="#C8A96B" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}

            {activeReportTab === "fuel" && (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono font-bold tracking-wider text-polar-snow uppercase">
                    STATION WEEKLY DIESEL CONSUMPTION (LITERS)
                  </h3>
                  <Badge variant="warning">Bharati Burn Surge (Wk 51)</Badge>
                </div>
                <div className="h-72 w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={fuelConsumptionData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#16314F" />
                      <XAxis dataKey="week" stroke="#A7B9CB" fontSize={11} />
                      <YAxis stroke="#A7B9CB" fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#08111F",
                          borderColor: "#16314F",
                          borderRadius: "4px",
                          fontSize: "12px",
                        }}
                      />
                      <Line type="monotone" dataKey="maitri" name="Maitri (L)" stroke="#C8C8C5" strokeWidth={2} />
                      <Line type="monotone" dataKey="bharati" name="Bharati (L)" stroke="#E45B5B" strokeWidth={2.5} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}

            {activeReportTab === "assets" && (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono font-bold tracking-wider text-polar-snow uppercase">
                    FLEET HEALTH &amp; OPERATIONAL READINESS (%)
                  </h3>
                  <Badge variant="success">
                    {summary ? `${Math.round(summary.expeditionReadinessPct)}% Avg Health` : "Active"}
                  </Badge>
                </div>
                <div className="h-72 w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={assetHealthData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#16314F" />
                      <XAxis type="number" domain={[50, 100]} stroke="#A7B9CB" fontSize={11} />
                      <YAxis type="category" dataKey="name" stroke="#A7B9CB" fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#08111F",
                          borderColor: "#16314F",
                          borderRadius: "4px",
                          fontSize: "12px",
                        }}
                      />
                      <Bar dataKey="score" name="Health Score %" fill="#43C99A" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </div>

          {/* Report Summary Cards (4 Columns) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="p-5 rounded-lg bg-polar-deep/90 border border-polar-border space-y-3 text-xs font-mono">
              <h3 className="font-bold text-polar-snow uppercase text-[11px] tracking-wider">
                COMPLIANCE AUDIT STATUS
              </h3>

              <div className="space-y-2">
                <div className="flex justify-between py-1.5 border-b border-polar-border/60">
                  <span className="text-polar-muted">Madrid Protocol:</span>
                  <span className="text-emerald-400 font-bold">100% Compliant</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-polar-border/60">
                  <span className="text-polar-muted">Bio-Waste Removal:</span>
                  <span className="text-polar-snow">Iso-Containers Sealed</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-polar-border/60">
                  <span className="text-polar-muted">Fuel Spill Drills:</span>
                  <span className="text-emerald-400">Signed-off (02 Jan)</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-polar-muted">Medical Incident Ratio:</span>
                  <span className="text-polar-snow">0.02 / 1000 hrs</span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-lg bg-polar-deep/90 border border-polar-border space-y-3">
              <h3 className="font-bold text-polar-snow uppercase text-[11px] tracking-wider font-mono">
                DATA EXPORTS
              </h3>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-between text-xs font-mono">
                  <span>Download Cargo Manifest CSV</span>
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-between text-xs font-mono">
                  <span>Export Fuel Telemetry Log</span>
                  <Download className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
