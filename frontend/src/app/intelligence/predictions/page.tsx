"use client";

import React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { IntelligenceTabs } from "@/components/intelligence/IntelligenceTabs";
import { Button } from "@/components/ui";
import { ArrowRight } from "lucide-react";

export default function PredictionsPage() {
  const predictions = [
    {
      type: "CARGO DELAY",
      target: "CRG-ANT-004821 (Atmospheric Lidar Pod)",
      confidence: "68%",
      impact: "+18h Estimated Delay",
      factors: [
        "Weather: 38-knot katabatic winds at Prydz Bay heli-deck",
        "Transport dependency: Ka-32 flight clearance window",
        "Payload constraints: Sling weight exceeds sub-zero high-wind envelope",
      ],
      recommendation: "Move non-critical cargo to next available transport window. Stage Lidar inside vessel Hold 2 climate bay.",
      actionUrl: "/cargo/CRG-ANT-004821",
    },
    {
      type: "INVENTORY STOCKOUT",
      target: "Bharati Station Polar Diesel (Day Tank 1)",
      confidence: "94%",
      impact: "Depletion in 6.9 Days",
      factors: [
        "Weather: Ambient -19.4°C boiler heating load",
        "Transport dependency: Fast-ice crack delaying marine floating hose",
        "Payload constraints: Tank reserve below 14-day safety threshold",
      ],
      recommendation: "Deploy acoustic ice-thickness survey team. Throttle auxiliary station heating loads by 15% from 22:00 to 05:00 UTC.",
      actionUrl: "/inventory/forecast",
    },
    {
      type: "ASSET CLOGGING ANOMALY",
      target: "Caterpillar 3406 Prime Generator Unit #1",
      confidence: "78%",
      impact: "Overhaul Window Expiry within 36h",
      factors: [
        "Weather: Sub-zero viscosity load on injector manifold",
        "Transport dependency: Spare fuel filter staged at coastal cache",
        "Payload constraints: Fuel injector differential pressure elevated to 2.4 bar",
      ],
      recommendation: "Switch primary load to Backup Generator Cummins QSM11 and dispatch filter kit via morning shuttle.",
      actionUrl: "/assets/AST-BHR-009",
    },
    {
      type: "TRAVERSE WHITEOUT RISK",
      target: "Team Alpha (MSN-ANT-024) Radar Traverse",
      confidence: "91%",
      impact: "Zero-Visibility Ground Blizzard",
      factors: [
        "Weather: 52-knot katabatic squall inbound from Polar Plateau",
        "Transport dependency: PistenBully AST-BHR-004 staging distance 87 km",
        "Payload constraints: 14-minute telemetry heartbeat loss",
      ],
      recommendation: "Instruct Team Alpha to hunker down inside heated pod. Standby rescue team Bravo for emergency traverse.",
      actionUrl: "/emergency",
    },
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
                INTELLIGENCE &bull; EMPIRICAL FORECASTS
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F5F3EE]">
              PREDICTIONS
            </h1>
            <p className="text-xs sm:text-sm text-[#A5A29C] mt-1">
              Statistical predictions of logistical friction, fuel burn, and environmental thresholds.
            </p>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <IntelligenceTabs />

        {/* Predictions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {predictions.map((p) => (
            <div
              key={p.type + p.target}
              className="p-6 rounded bg-[#101010] border border-[#242424] space-y-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between border-b border-[#242424] pb-3">
                  <span className="text-xs font-mono font-bold tracking-wider text-[#F5F3EE] uppercase">
                    {p.type}
                  </span>
                  <span className="text-xs font-mono font-bold text-[#C8A96B]">
                    {p.confidence} CONFIDENCE
                  </span>
                </div>

                <div className="my-3">
                  <span className="text-xs font-sans text-[#F5F3EE] font-semibold block">
                    {p.target}
                  </span>
                  <span className="text-[11px] font-mono text-[#B85C5C] font-bold mt-0.5 block">
                    Impact: {p.impact}
                  </span>
                </div>

                {/* Factors */}
                <div className="space-y-1.5 text-xs font-mono text-[#A5A29C] my-3">
                  <span className="text-[10px] text-[#6F6D68] uppercase font-bold block">
                    DRIVING FACTORS:
                  </span>
                  {p.factors.map((f, i) => (
                    <div key={i} className="flex items-start gap-2 text-[11px]">
                      <span className="text-[#6F6D68]">&bull;</span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>

                {/* Thin Gold Recommendation Line */}
                <div className="p-3.5 rounded bg-[#121008] border-l-2 border-[#C8A96B] space-y-1 text-xs font-mono">
                  <span className="text-[9px] font-bold text-[#C8A96B] uppercase tracking-wider block">
                    RECOMMENDATION:
                  </span>
                  <p className="text-[#F5F3EE] text-[11px] leading-relaxed">
                    {p.recommendation}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-[#242424] flex items-center justify-between">
                <span className="text-[10px] font-mono text-[#6F6D68]">AI Inferred Model</span>
                <Link href={p.actionUrl}>
                  <Button variant="secondary" size="sm" className="font-mono text-xs">
                    <span>Inspect</span>
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
