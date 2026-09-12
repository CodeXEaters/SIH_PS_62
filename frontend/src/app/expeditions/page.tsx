"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Calendar } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Badge, Button } from "@/components/ui";

export default function ExpeditionsListPage() {
  const corridorNodes = [
    { name: "GOA", detail: "NCPOR Central Logistics Depot", status: "COMPLETED" },
    { name: "CAPE TOWN", detail: "Berth 4 Cold-Storage Staging", status: "COMPLETED" },
    { name: "VESSEL", detail: "Charter Icebreaker Vasiliy Golovnin", status: "COMPLETED" },
    { name: "ANTARCTICA", detail: "Prydz Bay Offshore Fast-Ice Mooring", status: "ACTIVE" },
    { name: "MAITRI / BHARATI", detail: "Schirmacher Oasis & Larsemann Hills", status: "PENDING" },
  ];

  const milestones = [
    { title: "NCPOR Expedition Flag-off", date: "15 Nov 2026", loc: "Goa, India", done: true },
    { title: "Vessel Loading & Bunkering", date: "04 Dec 2026", loc: "Cape Town Port", done: true },
    { title: "Southern Ocean Crossing", date: "22 Dec 2026", loc: "Roaring Forties", done: true },
    { title: "Fast-Ice Arrival & Offshore Mooring", date: "08 Jan 2027", loc: "Prydz Bay", done: true },
    { title: "Bharati Fuel Discharge Sortie", date: "CURRENT", loc: "Larsemann Coast", done: false },
    { title: "Inland Science Traverse", date: "24 Jan 2027", loc: "Polar Plateau", done: false },
  ];

  return (
    <AppShell>
      <div className="space-y-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#242424] pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7FAF91]" />
              <span className="text-[10px] font-mono tracking-[0.25em] text-[#C8C8C5] uppercase font-semibold">
                MISSION DOSSIER &bull; POLAR PROGRAM
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F5F3EE]">
              EXPEDITIONS
            </h1>
            <p className="text-xs sm:text-sm text-[#A5A29C] mt-1">
              Antarctic campaign dossiers, corridor milestones, and expedition planning.
            </p>
          </div>

          <Link href="/expeditions/ISEA-46/planner">
            <Button variant="primary" size="sm" className="gap-2 font-mono text-xs">
              <Calendar className="w-3.5 h-3.5" />
              <span>46th ISEA Planner</span>
            </Button>
          </Link>
        </div>

        {/* 46th ISEA Mission Dossier Card */}
        <div className="p-6 sm:p-8 rounded bg-[#101010] border border-[#242424] space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-[#242424] pb-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold tracking-widest text-[#6F6D68] uppercase">
                  DOSSIER #ISEA-46
                </span>
                <span className="text-[#303030]">&bull;</span>
                <Badge variant="success" dot>
                  ACTIVE
                </Badge>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold font-mono text-[#F5F3EE] mt-1">
                46th ISEA
              </h2>
              <p className="text-xs text-[#A5A29C] font-sans mt-0.5">
                46th Indian Scientific Expedition to Antarctica &bull; Season 2026-2027
              </p>
            </div>

            <div className="text-left sm:text-right font-mono text-xs text-[#6F6D68]">
              <span>COMMANDER: </span>
              <span className="text-[#F5F3EE] font-bold">Dr. Rajesh Sharan</span>
            </div>
          </div>

          {/* Corridor Milestone Progression: GOA ↓ CAPE TOWN ↓ VESSEL ↓ ANTARCTICA ↓ MAITRI / BHARATI */}
          <div className="space-y-3 font-mono text-xs">
            <span className="text-xs font-bold tracking-wider text-[#F5F3EE] uppercase block">
              CORRIDOR TRANSIT PROGRESSION
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {corridorNodes.map((node, i) => (
                <div
                  key={node.name}
                  className={`p-4 rounded border flex flex-col justify-between ${
                    node.status === "ACTIVE"
                      ? "bg-[#141008] border-[#C8A96B] text-[#C8A96B]"
                      : node.status === "COMPLETED"
                      ? "bg-[#0A0A0A] border-[#242424] text-[#F5F3EE]"
                      : "bg-[#050505] border-[#1C1C1C] text-[#6F6D68]"
                  }`}
                >
                  <div>
                    <span className="text-[10px] text-[#6F6D68] block">0{i + 1}</span>
                    <span className="text-sm font-bold mt-1 block">{node.name}</span>
                    <span className="text-[10px] font-sans mt-1 block text-[#A5A29C] line-clamp-2">
                      {node.detail}
                    </span>
                  </div>

                  <div className="mt-4 pt-2 border-t border-[#242424] text-[9px]">
                    {node.status === "ACTIVE" ? (
                      <span className="font-bold text-[#C8A96B]">● ACTIVE STAGE</span>
                    ) : node.status === "COMPLETED" ? (
                      <span className="text-[#7FAF91]">✓ COMPLETED</span>
                    ) : (
                      <span>PENDING</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Operational Milestones List */}
          <div className="space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[#242424]">
              <span className="text-xs font-bold tracking-wider text-[#F5F3EE] uppercase">
                OPERATIONAL MILESTONES
              </span>
              <span className="text-[10px] text-[#6F6D68]">SEASON TIMELINE</span>
            </div>

            <div className="rounded bg-[#0A0A0A] border border-[#242424] divide-y divide-[#242424]">
              {milestones.map((m) => (
                <div key={m.title} className="p-3.5 flex items-center justify-between hover:bg-[#111111] transition-colors">
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${m.done ? 'bg-[#7FAF91]' : m.date === 'CURRENT' ? 'bg-[#C8A96B] animate-pulse' : 'bg-[#303030]'}`} />
                    <div>
                      <span className="font-bold text-[#F5F3EE]">{m.title}</span>
                      <span className="text-[10px] text-[#6F6D68] ml-2 font-normal">{m.loc}</span>
                    </div>
                  </div>
                  <span className={`text-[11px] ${m.date === 'CURRENT' ? 'text-[#C8A96B] font-bold' : 'text-[#6F6D68]'}`}>
                    {m.date}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Links */}
          <div className="pt-2 flex items-center gap-3 font-mono text-xs">
            <Link href="/expeditions/ISEA-46/timeline">
              <Button variant="secondary" size="sm" className="gap-1.5">
                <span>View Full Timeline</span>
                <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
