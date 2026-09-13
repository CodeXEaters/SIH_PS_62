"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Wrench, Calendar, CheckCircle2, AlertTriangle } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Badge, Button } from "@/components/ui";
import { assetsService } from "@/services/assets";
import { Asset } from "@/types";

export default function AssetMaintenancePage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    assetsService
      .getAllAssets()
      .then((data) => {
        setAssets(data || []);
      })
      .catch(console.warn)
      .finally(() => setIsLoading(false));
  }, []);
  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between border-b border-polar-border pb-5">
          <div>
            <Link
              href="/assets"
              className="inline-flex items-center gap-1 text-[10px] font-mono text-polar-cyan hover:underline mb-1"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Back to Assets</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              PREVENTIVE MAINTENANCE CALENDAR
            </h1>
            <p className="text-xs sm:text-sm text-polar-muted mt-0.5">
              Scheduled engine overhauls, hydraulic oil flushes, and antenna calibration cycles.
            </p>
          </div>
        </div>

        {/* Schedule Table */}
        <div className="rounded-lg border border-polar-border bg-polar-deep/90 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-polar-midnight/80 border-b border-polar-border text-polar-muted uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Asset</th>
                  <th className="py-3 px-4">Station</th>
                  <th className="py-3 px-4">Maintenance Task</th>
                  <th className="py-3 px-4">Spare Parts</th>
                  <th className="py-3 px-4">Condition</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-polar-border/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-polar-muted font-mono">
                      Loading maintenance calendar schedules...
                    </td>
                  </tr>
                ) : assets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-polar-muted font-mono">
                      No maintenance tasks scheduled.
                    </td>
                  </tr>
                ) : (
                  assets.map((asset) => (
                    <tr key={asset.id} className="hover:bg-polar-surface/50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-polar-snow">{asset.nextMaintenance}</td>
                      <td className="py-3.5 px-4">
                        <Link href={`/assets/${asset.id}`} className="font-bold text-polar-cyan hover:underline">
                          {asset.id}
                        </Link>
                        <span className="text-[10px] text-polar-muted block truncate max-w-xs">
                          {asset.name}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 uppercase font-bold text-polar-snow">{asset.stationSlug || asset.stationId}</td>
                      <td className="py-3.5 px-4 text-polar-muted font-sans text-[11px]">
                        500-hour filter and hydraulic fluid overhaul
                      </td>
                      <td className="py-3.5 px-4">
                        {asset.criticalSparePartsAvailable ? (
                          <span className="text-emerald-400 font-bold text-[10px]">IN STOCK</span>
                        ) : (
                          <span className="text-amber-400 font-bold text-[10px]">AWAITING SHIPMENT</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={asset.condition === "Operational" ? "success" : "warning"}>
                          {asset.condition}
                        </Badge>
                      </td>
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
