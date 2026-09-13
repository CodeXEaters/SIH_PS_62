"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Truck,
  Wrench,
  Battery,
  Fuel,
  Activity,
  Calendar,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Badge, Button, Card } from "@/components/ui";
import { assetsService } from "@/services/assets";
import { Asset } from "@/types";

export default function AssetDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [asset, setAsset] = useState<Asset | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setNotFound(false);
    assetsService
      .getAssetById(id)
      .then((a) => {
        if (isMounted) {
          if (a) setAsset(a);
          else setNotFound(true);
        }
      })
      .catch((err) => {
        console.warn("Failed to fetch asset:", err);
        if (isMounted) setNotFound(true);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [id]);

  if (isLoading) {
    return (
      <AppShell>
        <div className="max-w-4xl mx-auto py-16 text-center">
          <p className="text-xs font-mono text-polar-muted uppercase tracking-wider">
            Loading asset telemetry profile...
          </p>
        </div>
      </AppShell>
    );
  }

  if (notFound || !asset) {
    return (
      <AppShell>
        <div className="max-w-4xl mx-auto py-16 space-y-4 text-center">
          <div className="inline-block p-4 rounded-full bg-polar-deep border border-polar-border text-amber-400 mb-2">
            <Truck className="w-8 h-8 mx-auto" />
          </div>
          <h2 className="text-xl font-bold font-mono text-white">ASSET RECORD NOT FOUND</h2>
          <p className="text-xs font-mono text-polar-muted">
            No equipment or vehicle found with identifier &quot;{id}&quot;.
          </p>
          <div className="pt-2">
            <Link href="/assets">
              <Button variant="secondary" size="sm" className="font-mono text-xs">
                <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                <span>Return to Asset Registry</span>
              </Button>
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between border-b border-polar-border pb-5">
          <div>
            <Link
              href="/assets"
              className="inline-flex items-center gap-1 text-[10px] font-mono text-polar-cyan hover:underline mb-1"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Back to Asset Registry</span>
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-mono">
                {asset.id}
              </h1>
              <Badge variant={asset.condition === "Operational" ? "success" : "warning"} dot>
                {asset.condition}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-polar-muted mt-0.5">
              {asset.name} &bull; Station: <span className="uppercase text-polar-snow font-bold">{asset.stationSlug || asset.stationId}</span>
            </p>
          </div>
        </div>

        {/* Telemetry Gauge Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-lg bg-polar-deep/80 border border-polar-border">
            <span className="text-[10px] font-mono text-polar-muted uppercase block">Engine Operating Hours</span>
            <span className="text-2xl font-extrabold font-mono text-white mt-1 block">
              {asset.operatingHours} hrs
            </span>
            <span className="text-[10px] text-polar-muted">Cumulative duty clock</span>
          </div>

          <div className="p-4 rounded-lg bg-polar-deep/80 border border-polar-border">
            <span className="text-[10px] font-mono text-polar-muted uppercase block">Fleet Utilization</span>
            <span className="text-2xl font-extrabold font-mono text-polar-cyan mt-1 block">
              {asset.utilizationPct}%
            </span>
            <span className="text-[10px] text-polar-muted">Duty load rating</span>
          </div>

          <div className="p-4 rounded-lg bg-polar-deep/80 border border-polar-border">
            <span className="text-[10px] font-mono text-polar-muted uppercase block">Fuel / Energy Status</span>
            <span className="text-2xl font-extrabold font-mono text-amber-300 mt-1 block">
              {asset.fuelLevelPct ?? 85}%
            </span>
            <span className="text-[10px] text-polar-muted">Arctic low-viscosity mix</span>
          </div>

          <div className="p-4 rounded-lg bg-polar-deep/80 border border-polar-border">
            <span className="text-[10px] font-mono text-polar-muted uppercase block">Battery Health</span>
            <span className="text-2xl font-extrabold font-mono text-emerald-400 mt-1 block">
              {asset.batteryHealthPct ?? 95}%
            </span>
            <span className="text-[10px] text-polar-muted">Cold-cranking capacity</span>
          </div>
        </div>

        {/* Maintenance History & Parts Status */}
        <div className="p-6 rounded-lg bg-polar-deep/90 border border-polar-border space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold tracking-wider text-polar-snow uppercase">
              PREVENTIVE MAINTENANCE &amp; SPARES
            </h3>
            <span className="text-xs font-mono text-polar-gold">
              Due: {asset.nextMaintenance}
            </span>
          </div>

          <div className="p-4 rounded bg-polar-midnight/80 border border-polar-border/60 text-xs font-mono space-y-2">
            <div className="flex justify-between">
              <span className="text-polar-muted">Last Service Executed:</span>
              <span className="text-polar-snow">{asset.lastMaintenance}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-polar-muted">Critical Spare Parts In Station:</span>
              <span className={asset.criticalSparePartsAvailable ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                {asset.criticalSparePartsAvailable ? "✓ IN STOCK" : "⚠️ KIT IN TRANSIT (CRG-2026-001)"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
