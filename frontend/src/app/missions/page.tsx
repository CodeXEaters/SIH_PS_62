"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Badge, Button } from "@/components/ui";
import { mockMissions } from "@/data/mock";
import { ArrowRight } from "lucide-react";

export default function MissionsPage() {
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filtered = mockMissions.filter(
    (m) => statusFilter === "ALL" || m.status === statusFilter
  );

  return (
    <AppShell>
      <div className="space-y-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#242424] pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7FAF91]" />
              <span className="text-[10px] font-mono tracking-[0.25em] text-[#C8C8C5] uppercase font-semibold">
                TRAVERSE OPERATIONS &bull; 46TH ISEA
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F5F3EE]">
              FIELD MISSIONS
            </h1>
            <p className="text-xs sm:text-sm text-[#A5A29C] mt-1">
              Field science parties, glaciological traverses, and deep ice drilling sorties.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-[#6F6D68]">STATUS:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#101010] border border-[#242424] rounded px-3 py-1 text-[#F5F3EE] text-xs focus:outline-none focus:border-[#C8A96B]"
            >
              <option value="ALL">ALL MISSIONS</option>
              <option value="Active">ACTIVE</option>
              <option value="Planned">PLANNED</option>
              <option value="Completed">COMPLETED</option>
              <option value="Emergency">EMERGENCY</option>
            </select>
          </div>
        </div>

        {/* Mission Cards: Black surfaces with thin borders */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((m) => (
            <div
              key={m.id}
              className="p-6 rounded bg-[#101010] border border-[#242424] hover:border-[#383838] transition-colors space-y-4 font-mono text-xs flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Header of card */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono text-[#C8A96B] font-bold block">
                      {m.id}
                    </span>
                    <h3 className="text-sm font-bold text-[#F5F3EE] mt-0.5">
                      {m.title}
                    </h3>
                  </div>
                  <Badge
                    severity={
                      m.riskLevel === "CRITICAL"
                        ? "CRITICAL"
                        : m.riskLevel === "HIGH"
                        ? "HIGH"
                        : "LOW"
                    }
                    dot
                  >
                    {m.status}
                  </Badge>
                </div>

                {/* PURPOSE */}
                <div>
                  <span className="text-[9px] text-[#6F6D68] uppercase block">PURPOSE</span>
                  <p className="text-xs font-sans text-[#F5F3EE] font-medium mt-0.5 leading-relaxed">
                    {m.purpose}
                  </p>
                </div>

                {/* 2-Column Attributes: TEAM, LOCATION, RISK, RETURN */}
                <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                  <div>
                    <span className="text-[9px] text-[#6F6D68] uppercase block">TEAM</span>
                    <span className="text-[#A5A29C] font-sans mt-0.5 block">{m.teamLead}</span>
                    <span className="text-[10px] text-[#6F6D68] font-mono">Crew: {m.membersCount} Specialists</span>
                  </div>

                  <div>
                    <span className="text-[9px] text-[#6F6D68] uppercase block">LOCATION</span>
                    <span className="text-[#C8A96B] font-mono font-bold mt-0.5 block truncate" title={m.location}>{m.location}</span>
                    <span className="text-[10px] text-[#6F6D68] font-mono">Base: {m.stationId.toUpperCase()}</span>
                  </div>

                  <div>
                    <span className="text-[9px] text-[#6F6D68] uppercase block">RISK</span>
                    <span
                      className={`font-bold mt-0.5 block ${
                        m.riskLevel === "CRITICAL"
                          ? "text-[#B85C5C]"
                          : m.riskLevel === "HIGH"
                          ? "text-[#C49A55]"
                          : "text-[#7FAF91]"
                      }`}
                    >
                      {m.riskLevel}
                    </span>
                  </div>

                  <div>
                    <span className="text-[9px] text-[#6F6D68] uppercase block">ESTIMATED RETURN</span>
                    <span className="text-[#F5F3EE] mt-0.5 block">{m.expectedReturn}</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-[#242424] flex items-center justify-between">
                <span className="text-[10px] text-[#6F6D68]">Vehicle: {m.assignedVehicles?.join(", ") || "None"}</span>
                <Link href={`/missions/${m.id}`}>
                  <Button variant="secondary" size="sm" className="font-mono text-xs">
                    <span>Dossier</span>
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
