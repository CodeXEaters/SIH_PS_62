"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Clock, ShieldCheck, CheckCircle2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Badge, Button } from "@/components/ui";

export default function EmergencyHistoryPage() {
  const pastIncidents = [
    {
      code: "INCIDENT #EM-023",
      title: "Ka-32 Rotor De-Icing Telemetry Warning",
      date: "02 Jan 2027",
      location: "Prydz Bay Flight Sector",
      status: "RESOLVED",
      resolution: "Pilot aborted sortie to vessel helideck. Ground engineer replaced heating element.",
    },
    {
      code: "INCIDENT #EM-022",
      title: "Maitri Station Desalination Pump Blockage",
      date: "28 Dec 2026",
      location: "Lake Priyadarshini Pump House",
      status: "RESOLVED",
      resolution: "Spare diaphragm installed from Station Central Spares Bay.",
    },
  ];

  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between border-b border-polar-border pb-5">
          <div>
            <Link
              href="/emergency"
              className="inline-flex items-center gap-1 text-[10px] font-mono text-polar-cyan hover:underline mb-1"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Back to Active Emergency</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              INCIDENT RESPONSE HISTORY
            </h1>
            <p className="text-xs sm:text-sm text-polar-muted mt-0.5">
              Archived incident escalation debriefs, action logs, and SAR resolution summaries.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {pastIncidents.map((inc) => (
            <div key={inc.code} className="p-5 rounded-lg bg-polar-deep/80 border border-polar-border space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="font-bold text-polar-cyan">{inc.code}</span>
                <Badge variant="success">RESOLVED</Badge>
              </div>
              <h3 className="text-sm font-bold text-polar-snow font-sans">{inc.title}</h3>
              <div className="flex items-center gap-4 text-[11px] text-polar-muted">
                <span>Location: {inc.location}</span>
                <span>&bull;</span>
                <span>Date: {inc.date}</span>
              </div>
              <p className="text-polar-snow/90 font-sans pt-1">
                Resolution: {inc.resolution}
              </p>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
