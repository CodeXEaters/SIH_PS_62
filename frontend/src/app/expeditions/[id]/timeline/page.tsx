"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Clock, MapPin, CheckCircle2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Badge, Button } from "@/components/ui";
import { mockExpedition } from "@/data/mock";

export default function ExpeditionTimelinePage() {
  const exp = mockExpedition;

  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between border-b border-polar-border pb-5">
          <div>
            <Link
              href={`/expeditions/${exp.id}`}
              className="inline-flex items-center gap-1 text-[10px] font-mono text-polar-cyan hover:underline mb-1"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Back to Overview</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              EXPEDITION TIMELINE &bull; {exp.shortName}
            </h1>
            <p className="text-xs text-polar-muted mt-0.5">
              Historical and scheduled milestones for the 2026–2027 Antarctic campaign.
            </p>
          </div>
        </div>

        {/* Timeline Stream */}
        <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-polar-border">
          {exp.milestones.map((milestone, idx) => {
            const isDone = milestone.status === "COMPLETED";
            const isActive = milestone.status === "ACTIVE";
            return (
              <div key={milestone.id} className="relative">
                {/* Milestone Node Dot */}
                <div
                  className={`absolute -left-[27px] top-1.5 w-6 h-6 rounded-full border flex items-center justify-center text-[10px] font-mono font-bold ${
                    isDone
                      ? "bg-emerald-950 text-emerald-300 border-emerald-700"
                      : isActive
                      ? "bg-polar-cyan text-polar-navy border-white shadow-[0_0_15px_rgba(200,169,107,0.45)] animate-pulse"
                      : "bg-polar-deep text-polar-muted border-polar-border"
                  }`}
                >
                  {isDone ? "✓" : idx + 1}
                </div>

                <div className="p-5 rounded-lg bg-polar-deep/90 border border-polar-border space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <h3 className="text-base font-bold text-polar-snow">
                      {milestone.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-polar-gold">{milestone.date}</span>
                      <Badge variant={isDone ? "success" : isActive ? "info" : "outline"}>
                        {milestone.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-polar-cyan font-mono">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{milestone.location}</span>
                  </div>

                  <p className="text-xs text-polar-muted leading-relaxed pt-1">
                    {milestone.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
