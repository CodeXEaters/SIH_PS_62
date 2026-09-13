"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowLeftRight, Fuel, CheckCircle2, RefreshCw } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Badge, Button } from "@/components/ui";
import { inventoryService } from "@/services/inventory";

export default function InventoryTransfersPage() {
  const [transfers, setTransfers] = useState<Array<{
    id: string;
    item: string;
    quantity: string;
    from: string;
    to: string;
    status: string;
    timestamp: string;
    officer: string;
    notes?: string;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    inventoryService.getInventoryTransfers()
      .then((data) => {
        if (isMounted) setTransfers(data);
      })
      .catch((err) => console.warn("Failed to load inventory transfers:", err))
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => { isMounted = false; };
  }, []);

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
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-polar-muted">
                      <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-polar-cyan" />
                      <span>Loading authorized inter-station transfers from database...</span>
                    </td>
                  </tr>
                ) : transfers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-polar-muted">
                      <span>No inter-station inventory transfers logged.</span>
                    </td>
                  </tr>
                ) : (
                  transfers.map((trf) => (
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
