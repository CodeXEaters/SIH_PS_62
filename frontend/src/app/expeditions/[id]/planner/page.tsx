"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Plane,
  Anchor,
  Truck,
  Users,
  Box,
  Fuel,
  ArrowLeft,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Badge, Button, Card } from "@/components/ui";

export default function ExpeditionPlannerPage() {
  const [selectedPhase, setSelectedPhase] = useState("transport");

  const timelinePhases = [
    {
      id: "departure",
      title: "01 &bull; Expedition Mobilization & Departure",
      dates: "15 Oct – 15 Nov 2026",
      status: "COMPLETED",
      tasks: [
        { name: "Scientific personnel medical clearance sign-off", progress: 100, owner: "AIIMS Medical Board" },
        { name: "Cold-region survival training in Auli, Uttarakhand", progress: 100, owner: "ITBP / NCPOR" },
        { name: "Goa Central Depot container packing & sealing", progress: 100, owner: "NCPOR Logistics" },
      ],
    },
    {
      id: "cargo_cutoff",
      title: "02 &bull; Cargo Staging & Customs Cutoff",
      dates: "16 Nov – 04 Dec 2026",
      status: "COMPLETED",
      tasks: [
        { name: "Hazardous chemicals & lithium battery sea-freight booking", progress: 100, owner: "DG Shipping India" },
        { name: "Cape Town bonded harbor intake & RFID tagging", progress: 100, owner: "South African Port Agent" },
        { name: "MV Vasiliy Golovnin heavy crane loading", progress: 100, owner: "Vessel Master" },
      ],
    },
    {
      id: "transport",
      title: "03 &bull; Southern Ocean Transport & Ice Window",
      dates: "05 Dec 2026 – 10 Jan 2027",
      status: "ACTIVE",
      tasks: [
        { name: "Roaring Forties & Furious Fifties ocean crossing", progress: 100, owner: "Icebreaker Navigation" },
        { name: "Offshore fast-ice mooring in Prydz Bay (14km from Bharati)", progress: 100, owner: "Ship-to-Shore Team" },
        { name: "Ka-32 helicopter sling load transfers (Weather Hold)", progress: 45, owner: "Aviation Wing" },
      ],
    },
    {
      id: "movement",
      title: "04 &bull; Personnel Movement & Station Handover",
      dates: "11 Jan – 28 Jan 2027",
      status: "SCHEDULED",
      tasks: [
        { name: "Winter-over crew debrief & clinical check", progress: 0, owner: "Dr. Ananya Sen" },
        { name: "DROMLAN Basler BT-67 flight rotation to Maitri", progress: 0, owner: "Air Transport Ops" },
      ],
    },
    {
      id: "arrival",
      title: "05 &bull; Station Commissioning & Winter Lock-in",
      dates: "29 Jan – 15 Mar 2027",
      status: "SCHEDULED",
      tasks: [
        { name: "Full diesel bunkering to main station tanks", progress: 0, owner: "Bharati Fuel Team" },
        { name: "Final vessel departure before winter freeze-up", progress: 0, owner: "Ship Master" },
      ],
    },
  ];

  const constraints = [
    {
      category: "Weather & Katabatics",
      risk: "HIGH",
      detail: "Sustained winds >35 kts ground Ka-32 helicopters. Flight envelopes average 3.8 hours per day.",
      status: "Active Constraint",
      color: "text-amber-400 border-amber-800/40 bg-amber-950/20",
    },
    {
      category: "Vessel Cargo Capacity",
      risk: "NOMINAL",
      detail: "1,842 tonnes stowed. Deck capacity at 94% limit. Offload sequence must maintain ship stability.",
      status: "Monitored",
      color: "text-sky-400 border-sky-800/40 bg-sky-950/20",
    },
    {
      category: "Hazard Class Restrictions",
      risk: "CRITICAL",
      detail: "50,000L polar diesel transfer requires floating hose over 1.8m fast ice with crack sensor acoustic monitoring.",
      status: "Strict Protocol",
      color: "text-red-400 border-red-800/40 bg-red-950/20",
    },
    {
      category: "Aircraft Payload Limit",
      risk: "MEDIUM",
      detail: "Ka-32 external sling limit is 3,500 kg per sortie at -20°C density altitude.",
      status: "Payload Guarded",
      color: "text-amber-400 border-amber-800/40 bg-amber-950/20",
    },
    {
      category: "Personnel Availability",
      risk: "NOMINAL",
      detail: "124 personnel active. All hold certified polar survival and cold-injury triage certs.",
      status: "100% Certified",
      color: "text-emerald-400 border-emerald-800/40 bg-emerald-950/20",
    },
    {
      category: "Station Fuel Reserve",
      risk: "CRITICAL",
      detail: "Bharati current diesel: 6.9 days left. Resupply pumping from ship is the top operational priority.",
      status: "Priority #1",
      color: "text-red-400 border-red-800/40 bg-red-950/20",
    },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-polar-border pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link
                href="/expeditions/ISEA-46"
                className="inline-flex items-center gap-1 text-[10px] font-mono text-polar-cyan hover:underline"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Back to 46th ISEA</span>
              </Link>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              EXPEDITION PLANNING WORKSPACE
            </h1>
            <p className="text-xs sm:text-sm text-polar-muted mt-0.5">
              Constraint-driven visual scheduling across transport windows, payloads, and station reserves.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="warning" dot>
              Phase 3 Active (Weather Hold)
            </Badge>
          </div>
        </div>

        {/* Operational Constraints Panel */}
        <div className="p-5 rounded-lg bg-polar-deep/90 border border-polar-border shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono font-bold tracking-wider text-polar-snow uppercase">
              OPERATIONAL CONSTRAINTS &bull; REAL-TIME ENFORCEMENT
            </h2>
            <span className="text-[10px] font-mono text-polar-muted">
              6 Active Constraint Guards
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {constraints.map((c) => (
              <div key={c.category} className={`p-3.5 rounded-lg border ${c.color} text-xs space-y-1`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-polar-snow">{c.category}</span>
                  <span className="font-mono text-[10px] font-semibold uppercase">{c.status}</span>
                </div>
                <p className="text-[11px] text-polar-muted leading-relaxed">{c.detail}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Visual Scheduling Timeline Cards */}
        <div className="space-y-4">
          <h2 className="text-xs font-mono font-bold tracking-wider text-polar-snow uppercase">
            CAMPAIGN PHASES &amp; SCHEDULE EXECUTION
          </h2>

          <div className="space-y-3">
            {timelinePhases.map((phase) => (
              <div
                key={phase.id}
                className={`p-5 rounded-lg border transition-all ${
                  phase.status === "ACTIVE"
                    ? "bg-polar-deep border-polar-cyan/60 shadow-[0_0_20px_rgba(200,169,107,0.15)]"
                    : phase.status === "COMPLETED"
                    ? "bg-polar-deep/60 border-polar-border"
                    : "bg-polar-midnight/60 border-polar-border/60"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                        phase.status === "ACTIVE"
                          ? "bg-polar-cyan/20 text-polar-cyan border-polar-cyan"
                          : phase.status === "COMPLETED"
                          ? "bg-emerald-950/60 text-emerald-300 border-emerald-800"
                          : "bg-polar-surface text-polar-muted border-polar-border"
                      }`}
                    >
                      {phase.status}
                    </span>
                    <h3
                      className="text-sm font-bold text-polar-snow"
                      dangerouslySetInnerHTML={{ __html: phase.title }}
                    />
                  </div>
                  <span className="text-xs font-mono text-polar-muted">{phase.dates}</span>
                </div>

                {/* Sub-tasks */}
                <div className="space-y-2 mt-3 pt-3 border-t border-polar-border/60">
                  {phase.tasks.map((task) => (
                    <div
                      key={task.name}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-polar-cyan">&bull;</span>
                        <span className="text-polar-snow/90">{task.name}</span>
                        <span className="text-polar-muted text-[10px]">({task.owner})</span>
                      </div>
                      <div className="flex items-center gap-3 w-44 shrink-0">
                        <div className="flex-1 h-1.5 bg-polar-midnight rounded-full overflow-hidden">
                          <div
                            className="h-full bg-polar-cyan transition-all"
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-polar-muted w-8 text-right">
                          {task.progress}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
