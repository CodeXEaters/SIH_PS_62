"use client";

import React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { IntelligenceTabs } from "@/components/intelligence/IntelligenceTabs";
import { Button } from "@/components/ui";
import { ArrowRight } from "lucide-react";

export default function AnomaliesPage() {
  const anomalies = [
    {
      type: "TELEMETRY MISSING",
      target: "TEAM ALPHA",
      time: "14 MIN",
      severity: "HIGH",
      reason: "No tracking update received. Last verified ping at Sector 4 Larsemann Ridge.",
      actionUrl: "/emergency",
      actionLabel: "INVESTIGATE",
    },
    {
      type: "INVENTORY SURGE",
      target: "DIESEL DAY TANK 1",
      time: "48 MIN",
      severity: "HIGH",
      reason: "Burn rate spiked to 223 L/day vs 180 L/day nominal. Auxiliary boiler loop bypass open.",
      actionUrl: "/inventory/forecast",
      actionLabel: "INVESTIGATE",
    },
    {
      type: "WEATHER EXPOSURE",
      target: "CRG-ANT-004821",
      time: "1 HOUR",
      severity: "MODERATE",
      reason: "Climate-sensitive Lidar unit left on vessel weather-deck during grounding lull.",
      actionUrl: "/cargo/CRG-ANT-004821",
      actionLabel: "INVESTIGATE",
    },
    {
      type: "SENSOR FAILURE",
      target: "CORE DRILL AST-022",
      time: "3 HOURS",
      severity: "LOW",
      reason: "Motor drive temperature thermistor ceased transmitting CAN bus telemetry.",
      actionUrl: "/assets",
      actionLabel: "INVESTIGATE",
    },
  ];

  return (
    <AppShell>
      <div className="space-y-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#242424] pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#B85C5C]" />
              <span className="text-[10px] font-mono tracking-[0.25em] text-[#C49A55] uppercase font-semibold">
                INTELLIGENCE &bull; INCIDENT FEED
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F5F3EE]">
              ANOMALIES
            </h1>
            <p className="text-xs sm:text-sm text-[#A5A29C] mt-1">
              Real-time feed of sensor dropouts, telemetry blackouts, and threshold violations.
            </p>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <IntelligenceTabs />

        {/* Clean Incident-Feed UI */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#242424]">
            <span className="text-xs font-mono font-bold tracking-wider text-[#F5F3EE] uppercase">
              ACTIVE OPERATIONAL ANOMALIES
            </span>
            <span className="text-[10px] font-mono text-[#B85C5C]">
              4 UNRESOLVED INCIDENTS
            </span>
          </div>

          <div className="space-y-3">
            {anomalies.map((anm) => (
              <div
                key={anm.type + anm.target}
                className="p-5 sm:p-6 rounded bg-[#101010] border border-[#242424] hover:border-[#383838] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 max-w-2xl font-mono text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-[#F5F3EE] tracking-wider uppercase">
                      {anm.type}
                    </span>
                    <span className="text-[#303030]">&bull;</span>
                    <span className="text-[#C8A96B] font-bold">
                      {anm.target}
                    </span>
                    <span className="text-[#303030]">&bull;</span>
                    <span className="text-[11px] text-[#A5A29C]">
                      {anm.time}
                    </span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded border font-bold ${
                        anm.severity === "HIGH"
                          ? "bg-[#140808] text-[#B85C5C] border-[#B85C5C]/40"
                          : anm.severity === "MODERATE"
                          ? "bg-[#141008] text-[#C49A55] border-[#C49A55]/40"
                          : "bg-[#0E0E0E] text-[#6F6D68] border-[#242424]"
                      }`}
                    >
                      {anm.severity}
                    </span>
                  </div>

                  <div className="text-[11px] text-[#A5A29C] font-sans pt-1">
                    <strong className="font-mono text-[#6F6D68] mr-1">Reason:</strong>
                    <span>{anm.reason}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link href={anm.actionUrl}>
                    <Button
                      variant={anm.severity === "HIGH" ? "danger" : "secondary"}
                      size="sm"
                      className="font-mono text-xs"
                    >
                      <span>{anm.actionLabel}</span>
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
