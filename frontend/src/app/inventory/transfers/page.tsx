"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowLeftRight, Fuel, CheckCircle2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Badge, Button } from "@/components/ui";

export default function InventoryTransfersPage() {
  const transfers = [
    {
      id: "TRF-0012",
      item: "Aviation Turbine Fuel (Jet A-1)",
      quantity: "3,200 Liters",
      from: "MV Vasiliy Golovnin Fuel Bay",
      to: "Bharati Station Helipad Tanks",
      status: "COMPLETED",
      timestamp: "07 Jan 2027, 14:00 UTC",
      officer: "Lt. Col. Vikramaditya Rathore",
    },
    {
      id: "TRF-0013",
      item: "Freeze-Dried MRE Rations",
      quantity: "600 Packs",
      from: "Bharati Station Central Larder",
      to: "Team Alpha Field Sledge (AST-BHR-018)",
      status: "COMPLETED",
      timestamp: "09 Jan 2027, 18:30 UTC",
      officer: "Omkar Joshi",
    },
    {
      id: "TRF-0014",
      item: "Polar Grade Low-Sulfur Diesel",
      quantity: "50,000 Liters",
      from: "MV Vasiliy Golovnin Bulk Tank #2",
      to: "Bharati Station Fuel Farm",
      status: "PENDING_PUMPING",
      timestamp: "Scheduled for tomorrow",
      officer: "Chief Engr. Suresh Nair",
    },
  ];

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between border-b border-polar-border pb-5">
          <div>
            <Link
              href="/inventory"
              className="inline-flex items-center gap-1 text-[10px] font-mono text-polar-cyan hover:underline mb-1"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Back to Inventory</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              INTER-STATION INVENTORY TRANSFERS
            </h1>
            <p className="text-xs sm:text-sm text-polar-muted mt-0.5">
              Authorized transfers between vessels, stationary fuel farms, and traverse teams.
            </p>
          </div>
        </div>

        {/* Transfers Table */}
        <div className="rounded-lg border border-polar-border bg-polar-deep/90 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-polar-midnight/80 border-b border-polar-border text-polar-muted uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Transfer ID</th>
                  <th className="py-3 px-4">Item Transferred</th>
                  <th className="py-3 px-4">Quantity</th>
                  <th className="py-3 px-4">Origin &rarr; Destination</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Authorizing Officer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-polar-border/60">
                {transfers.map((trf) => (
                  <tr key={trf.id} className="hover:bg-polar-surface/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-polar-cyan">{trf.id}</td>
                    <td className="py-3.5 px-4 text-polar-snow font-medium">{trf.item}</td>
                    <td className="py-3.5 px-4 font-bold text-polar-snow">{trf.quantity}</td>
                    <td className="py-3.5 px-4 text-polar-muted">
                      {trf.from} &rarr; <span className="text-polar-snow">{trf.to}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={trf.status === "COMPLETED" ? "success" : "gold"}>
                        {trf.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-polar-muted">{trf.officer}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
