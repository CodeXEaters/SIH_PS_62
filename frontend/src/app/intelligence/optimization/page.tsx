"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { IntelligenceTabs } from "@/components/intelligence/IntelligenceTabs";
import { Button } from "@/components/ui";

export default function OptimizationPage() {
  const [applied, setApplied] = useState(false);

  const constraints = [
    { name: "CARGO CAPACITY", limit: "3,500 kg max / helicopter flight" },
    { name: "WEATHER", limit: "Katabatic wind limit < 28 kts" },
    { name: "FUEL", limit: "Minimum station diesel reserve: 10,000 L" },
    { name: "DEADLINE", limit: "Offload window expires in 5.5 days" },
    { name: "STATION RESERVE", limit: "Maintain 30-day life-support buffer" },
  ];

  const allocations = [
    {
      item: "Bulk Polar Diesel",
      current: "4,200 L",
      recommended: "6,500 L",
      difference: "+2,300 L (+54%)",
      impact: "Eliminates 6.9-day Bharati stockout threat",
    },
    {
      item: "Science Cryo-Cylinders",
      current: "1,800 kg",
      recommended: "1,200 kg",
      difference: "-600 kg (-33%)",
      impact: "Defers non-critical payload to Flight #03",
    },
    {
      item: "Generator 2 Overhaul Spares",
      current: "480 kg",
      recommended: "480 kg",
      difference: "0 kg (0%)",
      impact: "Required for Caterpillar 3406 maintenance",
    },
    {
      item: "Emergency Frozen Rations",
      current: "850 kg",
      recommended: "1,400 kg",
      difference: "+550 kg (+64%)",
      impact: "Pre-positions 2-month winter reserve",
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
                INTELLIGENCE &bull; MULTI-CONSTRAINT SOLVER
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F5F3EE]">
              OPTIMIZATION
            </h1>
            <p className="text-xs sm:text-sm text-[#A5A29C] mt-1">
              Deterministic allocation under extreme physical and logistical constraints.
            </p>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <IntelligenceTabs />

        {/* Main Analytical Layout */}
        <div className="p-6 sm:p-8 rounded bg-[#101010] border border-[#242424] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#242424] pb-4">
            <div>
              <span className="text-[10px] font-mono text-[#6F6D68] uppercase tracking-widest block">
                SCENARIO SOLVER
              </span>
              <h2 className="text-lg font-bold font-mono text-[#F5F3EE] mt-0.5">
                OPTIMIZE BHARATI RESUPPLY
              </h2>
            </div>
            <span className="text-xs font-mono text-[#C8A96B] font-semibold">
              ● OPTIMAL FEASIBLE SOLUTION FOUND
            </span>
          </div>

          {/* Constraints Grid */}
          <div className="space-y-3">
            <span className="text-xs font-mono font-bold tracking-wider text-[#F5F3EE] uppercase block">
              CONSTRAINTS
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono">
              {constraints.map((c) => (
                <div key={c.name} className="p-3 rounded bg-[#0A0A0A] border border-[#242424] space-y-1">
                  <span className="text-[9px] text-[#6F6D68] uppercase block">{c.name}</span>
                  <span className="text-[11px] text-[#F5F3EE] font-medium block">{c.limit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Allocation & Comparison Table */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold tracking-wider text-[#F5F3EE] uppercase">
                RECOMMENDED ALLOCATION
              </span>
              <span className="text-[11px] font-mono text-[#7FAF91]">
                Total Variance: +2,250 kg &bull; Risk: -42%
              </span>
            </div>

            <div className="rounded bg-[#0A0A0A] border border-[#242424] overflow-hidden">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-[#242424] text-[#6F6D68] text-[9px] uppercase tracking-wider">
                    <th className="py-3 px-4">PAYLOAD ITEM</th>
                    <th className="py-3 px-4">CURRENT</th>
                    <th className="py-3 px-4 text-[#C8A96B]">RECOMMENDED</th>
                    <th className="py-3 px-4">DIFFERENCE</th>
                    <th className="py-3 px-4">IMPACT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#242424]/60 text-[#A5A29C]">
                  {allocations.map((a) => (
                    <tr key={a.item} className="hover:bg-[#111111] transition-colors">
                      <td className="py-3 px-4 font-bold text-[#F5F3EE]">
                        {a.item}
                      </td>
                      <td className="py-3 px-4">
                        {a.current}
                      </td>
                      <td className="py-3 px-4 font-bold text-[#F5F3EE]">
                        {a.recommended}
                      </td>
                      <td className="py-3 px-4">
                        <span className={a.difference.startsWith('+') ? 'text-[#7FAF91] font-bold' : a.difference.startsWith('-') ? 'text-[#C49A55]' : 'text-[#6F6D68]'}>
                          {a.difference}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[11px] text-[#A5A29C]">
                        {a.impact}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Bar */}
          <div className="pt-4 border-t border-[#242424] flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs">
            <span className="text-[#A5A29C]">
              {applied ? (
                <span className="text-[#7FAF91] font-bold">✓ Manifest updated. Re-scheduled dispatch transmitted to Cape Town agent.</span>
              ) : (
                "Human Approval: Review and commit recommended resupply allocation."
              )}
            </span>

            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setApplied(true)}
                disabled={applied}
              >
                Approve Allocation
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
