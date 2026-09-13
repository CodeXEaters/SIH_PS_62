"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Compass,
  Calendar,
  Clock,
  ArrowRight,
  Users,
  Box,
  Truck,
  Radio,
  CheckCircle2,
  Anchor,
  Plane,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Badge, Button, Card } from "@/components/ui";
import { mockExpedition } from "@/data/mock";
import { expeditionService } from "@/services/expedition";
import { Expedition } from "@/types";

export default function ExpeditionOverviewPage() {
  const [exp, setExp] = useState<Expedition>(mockExpedition);

  useEffect(() => {
    expeditionService.getActiveExpedition().then((data) => {
      if (data) setExp(data);
    }).catch(console.warn);
  }, []);

  const flowNodes = [
    { name: "Goa (NCPOR)", type: "Origin & HQ", status: "COMPLETED", date: "15 Nov 2026" },
    { name: "Cape Town", type: "Staging Port", status: "COMPLETED", date: "04 Dec 2026" },
    { name: "Vessel (MV Vasiliy Golovnin)", type: "Ocean Transit", status: "COMPLETED", date: "18 Dec 2026" },
    { name: "Antarctica (Fast Ice)", type: "Offshore Mooring", status: "ACTIVE", date: "08 Jan 2027" },
    { name: "Bharati / Maitri", type: "Station Bases", status: "PENDING", date: "Scheduled" },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-polar-border pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-polar-cyan font-bold">
                EXPEDITION OVERVIEW &bull; {exp.id}
              </span>
              <span className="text-polar-muted">&bull;</span>
              <Badge variant="success" dot>
                {exp.status}
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {exp.name}
            </h1>
            <p className="text-xs sm:text-sm text-polar-muted mt-0.5">
              Leader: <span className="text-polar-snow font-medium">{exp.leader}</span> &bull; Vessel:{" "}
              <span className="text-polar-snow font-medium">{exp.vessel}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href={`/expeditions/${exp.id}/planner`}>
              <Button variant="primary" size="sm" className="gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Expedition Planner</span>
              </Button>
            </Link>
            <Link href={`/expeditions/${exp.id}/timeline`}>
              <Button variant="secondary" size="sm" className="gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Timeline</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Operational Flow: Goa → Cape Town → Vessel → Antarctica → Maitri/Bharati */}
        <div className="p-6 rounded-lg bg-polar-deep/90 border border-polar-border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-mono font-bold tracking-wider text-polar-snow uppercase">
              OPERATIONAL FLOW &bull; INTERCONTINENTAL SUPPLY CHAIN
            </h3>
            <span className="text-[10px] font-mono text-polar-cyan">
              Stage 4 of 5 Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {flowNodes.map((node, i) => (
              <div
                key={node.name}
                className={`p-3.5 rounded-lg border text-xs font-mono relative ${
                  node.status === "COMPLETED"
                    ? "bg-emerald-950/20 border-emerald-800/40 text-emerald-300"
                    : node.status === "ACTIVE"
                    ? "bg-polar-cyan/15 border-polar-cyan text-white shadow-[0_0_15px_rgba(200,169,107,0.2)] animate-pulse"
                    : "bg-polar-midnight/60 border-polar-border/60 text-polar-muted"
                }`}
              >
                <div className="flex items-center justify-between mb-1 text-[10px]">
                  <span>0{i + 1}</span>
                  <span>{node.status}</span>
                </div>
                <div className="font-bold text-sm text-polar-snow truncate">{node.name}</div>
                <div className="text-[10px] text-polar-muted mt-0.5">{node.type}</div>
                <div className="text-[9px] text-polar-cyan mt-2">{node.date}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Core Readiness & Domain Overview Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link
            href="/personnel"
            className="p-5 rounded-lg bg-polar-deep/80 border border-polar-border hover:border-sky-500/50 transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-polar-muted uppercase">Personnel</span>
              <Users className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-extrabold font-mono text-white group-hover:text-sky-300">
              {exp.personnelCount}
            </div>
            <p className="text-[11px] text-polar-muted mt-1">100% Medical Cleared</p>
          </Link>

          <Link
            href="/cargo"
            className="p-5 rounded-lg bg-polar-deep/80 border border-polar-border hover:border-polar-cyan/50 transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-polar-muted uppercase">Cargo</span>
              <Box className="w-4 h-4 text-polar-cyan" />
            </div>
            <div className="text-2xl font-extrabold font-mono text-white group-hover:text-polar-cyan">
              {exp.cargoTonnage} t
            </div>
            <p className="text-[11px] text-polar-muted mt-1">1 Delayed Item Flagged</p>
          </Link>

          <Link
            href="/assets"
            className="p-5 rounded-lg bg-polar-deep/80 border border-polar-border hover:border-amber-500/50 transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-polar-muted uppercase">Assets</span>
              <Truck className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-extrabold font-mono text-white group-hover:text-amber-300">
              326
            </div>
            <p className="text-[11px] text-polar-muted mt-1">98% Operational Uptime</p>
          </Link>

          <Link
            href="/missions"
            className="p-5 rounded-lg bg-polar-deep/80 border border-polar-border hover:border-polar-teal/50 transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-polar-muted uppercase">Active Traverses</span>
              <Radio className="w-4 h-4 text-polar-teal" />
            </div>
            <div className="text-2xl font-extrabold font-mono text-white group-hover:text-polar-teal">
              {exp.activeMissionsCount}
            </div>
            <p className="text-[11px] text-polar-muted mt-1">Team Alpha Under Watch</p>
          </Link>
        </div>

        {/* Upcoming Milestones */}
        <div className="p-6 rounded-lg bg-polar-deep/80 border border-polar-border space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold tracking-wider text-polar-snow uppercase">
              EXPEDITION MILESTONES &bull; 46TH ISEA
            </h3>
            <span className="text-[10px] font-mono text-polar-muted">
              Updated from NCPOR Flight Operations
            </span>
          </div>

          <div className="divide-y divide-polar-border/60">
            {exp.milestones.map((m) => (
              <div key={m.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold shrink-0 mt-0.5 ${
                      m.status === "COMPLETED"
                        ? "bg-emerald-950 text-emerald-300 border border-emerald-700"
                        : m.status === "ACTIVE"
                        ? "bg-polar-cyan/20 text-polar-cyan border border-polar-cyan"
                        : "bg-polar-midnight text-polar-muted border border-polar-border"
                    }`}
                  >
                    {m.status === "COMPLETED" ? "✓" : "○"}
                  </div>
                  <div>
                    <h4 className="font-bold text-polar-snow">{m.title}</h4>
                    <p className="text-polar-muted text-[11px] mt-0.5">{m.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0 sm:text-right font-mono">
                  <span className="text-polar-cyan">{m.location}</span>
                  <span className="text-polar-muted">{m.date}</span>
                  <Badge variant={m.status === "COMPLETED" ? "success" : m.status === "ACTIVE" ? "info" : "outline"}>
                    {m.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
