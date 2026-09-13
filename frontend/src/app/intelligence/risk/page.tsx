"use client";

import React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { IntelligenceTabs } from "@/components/intelligence/IntelligenceTabs";
import { Button } from "@/components/ui";

export default function PolarRiskCenterPage() {
  const breakdown = [
    { name: "WEATHER", score: 78, level: "HIGH", detail: "Katabatic gusts reaching 42 kts; -24°C windchill" },
    { name: "SEA ICE", score: 84, level: "CRITICAL", detail: "Fast-ice fracture zone 300m west of vessel mooring" },
    { name: "CARGO", score: 68, level: "MODERATE", detail: "Atmospheric sensor consignment CRG-2026-001 delayed +18h" },
    { name: "PERSONNEL", score: 58, level: "MODERATE", detail: "Larsemann ridge party under low visibility protocol" },
    { name: "ASSETS", score: 38, level: "NOMINAL", detail: "98.4% tracked vehicle and generator availability" },
    { name: "INVENTORY", score: 82, level: "CRITICAL", detail: "Bharati Station polar diesel runway at 6.9 days" },
    { name: "TRANSPORT", score: 54, level: "MODERATE", detail: "Prydz Bay helicopter transfer window constrained" },
  ];

  return (
    <AppShell>
      <div className="space-y-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#242424] pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C8A96B]" />
              <span className="text-[10px] font-mono tracking-[0.25em] text-[#C8C8C5] uppercase font-semibold">
                INTELLIGENCE &bull; PROBABILISTIC ANALYSIS
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F5F3EE]">
              INTELLIGENCE
            </h1>
            <p className="text-xs sm:text-sm text-[#A5A29C] mt-1">
              Operational predictions, anomalies and recommendations.
            </p>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <IntelligenceTabs />

        {/* Hero Polar Operational Risk Panel */}
        <div className="p-8 rounded bg-[#101010] border border-[#242424] flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-xs font-mono font-bold tracking-[0.2em] text-[#6F6D68] uppercase block">
              POLAR OPERATIONAL RISK
            </span>
            <div className="flex items-baseline gap-4">
              <span className="text-5xl sm:text-6xl font-mono font-bold text-[#F5F3EE] tracking-tight">
                67
              </span>
              <span className="text-sm font-mono font-bold text-[#C8A96B] uppercase tracking-wider">
                MODERATE
              </span>
            </div>
            <p className="text-xs text-[#A5A29C] max-w-md">
              Synthesized composite risk across 7 operational vectors. Marine resupply and fuel reserves currently drive elevated friction.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/intelligence/predictions">
              <Button variant="secondary" size="sm" className="font-mono text-xs">
                View Predictions
              </Button>
            </Link>
            <Link href="/intelligence/what-if">
              <Button variant="primary" size="sm" className="font-mono text-xs">
                Run Simulation
              </Button>
            </Link>
          </div>
        </div>

        {/* Risk Breakdown: Monochrome & Muted Gold Visualization (No Colorful Radar) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#242424]">
            <span className="text-xs font-mono font-bold tracking-wider text-[#F5F3EE] uppercase">
              RISK BREAKDOWN BY OPERATIONAL VECTOR
            </span>
            <span className="text-[10px] font-mono text-[#6F6D68]">0 TO 100 SCALE</span>
          </div>

          <div className="rounded bg-[#0A0A0A] border border-[#242424] divide-y divide-[#242424]">
            {breakdown.map((item) => (
              <div key={item.name} className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#101010] transition-colors">
                <div className="space-y-1 w-full sm:w-1/3">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-[#F5F3EE] tracking-wider">
                      {item.name}
                    </span>
                    <span
                      className={`text-[9px] font-mono px-1 py-0.2 rounded border ${
                        item.level === "CRITICAL"
                          ? "bg-[#140808] text-[#B85C5C] border-[#B85C5C]/30"
                          : item.level === "HIGH"
                          ? "bg-[#141008] text-[#C49A55] border-[#C49A55]/30"
                          : item.level === "MODERATE"
                          ? "bg-[#121008] text-[#C8A96B] border-[#C8A96B]/30"
                          : "bg-[#0A100A] text-[#7FAF91] border-[#7FAF91]/30"
                      }`}
                    >
                      {item.level}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#6F6D68] block">{item.detail}</span>
                </div>

                <div className="flex-1 w-full sm:px-6">
                  {/* Monochrome / Gold Progress Bar */}
                  <div className="w-full h-1.5 bg-[#1C1C1C] rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        item.score >= 80
                          ? "bg-[#B85C5C]"
                          : item.score >= 60
                          ? "bg-[#C8A96B]"
                          : "bg-[#A5A29C]"
                      }`}
                      style={{ width: `${item.score}%` }}
                    />
                  </div>
                </div>

                <div className="text-right sm:w-20 font-mono text-xs font-bold text-[#F5F3EE]">
                  {item.score} / 100
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
