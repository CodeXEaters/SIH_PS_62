"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Truck,
  Search,
  Wrench,
  Activity,
  Battery,
  Fuel,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Badge, Button, Input } from "@/components/ui";
import { mockAssets } from "@/data/mock";
import { assetsService } from "@/services/assets";
import { Asset, AssetCondition } from "@/types";

export default function AssetsPage() {
  const [assetsList, setAssetsList] = useState<Asset[]>(mockAssets);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [conditionFilter, setConditionFilter] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);

  const fetchAssets = () => {
    setIsLoading(true);
    assetsService
      .getAllAssets()
      .then((data) => {
        if (data && data.length > 0) {
          setAssetsList(data);
        }
      })
      .catch((err) => console.warn("Failed to fetch assets:", err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const categories = [
    "Vehicles",
    "Generators",
    "Communication Equipment",
    "Scientific Equipment",
    "Medical Equipment",
  ];

  const filteredAssets = assetsList.filter((a) => {
    const matchesSearch =
      a.id.toLowerCase().includes(search.toLowerCase()) ||
      a.name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter === "ALL" || a.category === categoryFilter;
    const matchesCond = conditionFilter === "ALL" || a.condition === conditionFilter;
    return matchesSearch && matchesCat && matchesCond;
  });

  const getConditionBadge = (cond: AssetCondition) => {
    switch (cond) {
      case "Operational":
        return <Badge variant="success" dot>{cond}</Badge>;
      case "Maintenance Due":
        return <Badge variant="warning" dot>{cond}</Badge>;
      case "Under Repair":
        return <Badge variant="danger" dot>{cond}</Badge>;
      case "Offline":
      default:
        return <Badge variant="default" dot>{cond}</Badge>;
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-polar-border pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-polar-cyan font-bold">
                PHYSICAL ASSET FLEET
              </span>
              <span className="text-polar-muted">&bull;</span>
              <span className="text-[10px] font-mono text-emerald-400">
                326 TOTAL REGISTERED UNITS
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              ASSET MANAGEMENT
            </h1>
            <p className="text-xs sm:text-sm text-polar-muted mt-0.5">
              Heavy polar vehicles, Caterpillar prime generators, radomes, and deep drilling masts.
            </p>
          </div>

          <Link href="/assets/maintenance">
            <Button variant="secondary" size="sm" className="gap-1.5">
              <Wrench className="w-3.5 h-3.5" />
              <span>Maintenance Schedule</span>
            </Button>
          </Link>
        </div>

        {/* Filter Toolbar */}
        <div className="p-4 rounded-lg bg-polar-deep/90 border border-polar-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="w-full sm:w-80">
            <Input
              type="text"
              placeholder="Search asset ID (AST-BHR-018), name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto text-xs font-mono">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-polar-muted">Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-polar-midnight border border-polar-border rounded px-2.5 py-1 text-polar-snow text-xs focus:outline-none"
              >
                <option value="ALL">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-polar-muted">Condition:</span>
              <select
                value={conditionFilter}
                onChange={(e) => setConditionFilter(e.target.value)}
                className="bg-polar-midnight border border-polar-border rounded px-2.5 py-1 text-polar-snow text-xs focus:outline-none"
              >
                <option value="ALL">All Conditions</option>
                <option value="Operational">Operational</option>
                <option value="Maintenance Due">Maintenance Due</option>
                <option value="Under Repair">Under Repair</option>
                <option value="Offline">Offline</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table: Asset ID, Type, Station, Condition, Utilization, Next Maintenance */}
        <div className="rounded-lg border border-polar-border bg-polar-deep/90 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-polar-midnight/80 border-b border-polar-border text-polar-muted uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Asset ID</th>
                  <th className="py-3 px-4">Name &amp; Type</th>
                  <th className="py-3 px-4">Station</th>
                  <th className="py-3 px-4">Condition</th>
                  <th className="py-3 px-4">Utilization</th>
                  <th className="py-3 px-4">Hours</th>
                  <th className="py-3 px-4">Next Maintenance</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-polar-border/60">
                {filteredAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-polar-surface/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-polar-cyan">
                      <Link href={`/assets/${asset.id}`} className="hover:underline">
                        {asset.id}
                      </Link>
                    </td>

                    <td className="py-3.5 px-4 font-sans max-w-xs">
                      <span className="font-bold text-polar-snow block">{asset.name}</span>
                      <span className="text-[10px] text-polar-muted font-mono">{asset.category}</span>
                    </td>

                    <td className="py-3.5 px-4 uppercase font-bold text-polar-snow">
                      {asset.stationId}
                    </td>

                    <td className="py-3.5 px-4">
                      {getConditionBadge(asset.condition)}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-polar-midnight rounded-full overflow-hidden">
                          <div
                            className="h-full bg-polar-cyan"
                            style={{ width: `${asset.utilizationPct}%` }}
                          />
                        </div>
                        <span className="font-bold text-polar-snow">{asset.utilizationPct}%</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-polar-muted">
                      {asset.operatingHours} hrs
                    </td>

                    <td className="py-3.5 px-4 text-polar-snow">
                      {asset.nextMaintenance}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Link href={`/assets/${asset.id}`}>
                        <Button variant="outline" size="sm" className="h-7 text-xs px-2.5">
                          <span>Inspect</span>
                          <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </Link>
                    </td>
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
