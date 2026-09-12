"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  TrendingDown,
  Search,
  ArrowLeftRight,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Badge, Button, Input } from "@/components/ui";
import { mockInventory } from "@/data/mock";

export default function InventoryPage() {
  const [search, setSearch] = useState("");
  const [stationFilter, setStationFilter] = useState("ALL");

  const filtered = mockInventory.filter((i) => {
    const matchesSearch =
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.id.toLowerCase().includes(search.toLowerCase()) ||
      i.category.toLowerCase().includes(search.toLowerCase());
    const matchesStation = stationFilter === "ALL" || i.stationId === stationFilter;
    return matchesSearch && matchesStation;
  });

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#242424] pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#B85C5C]" />
              <span className="text-[10px] font-mono tracking-[0.25em] text-[#C49A55] uppercase font-semibold">
                LIFE SUPPORT &bull; CRITICAL RESOURCE AUDIT
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F5F3EE]">
              STATION INVENTORY &amp; RESERVES
            </h1>
            <p className="text-xs sm:text-sm text-[#A5A29C] mt-1">
              Scientific resource management: cryogenic gases, generator fuels, food stores, and medical oxygen.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link href="/inventory/forecast">
              <Button variant="primary" size="sm" className="gap-2 font-mono text-xs">
                <TrendingDown className="w-3.5 h-3.5" />
                <span>Burn Rate Forecast</span>
              </Button>
            </Link>
            <Link href="/inventory/transfers">
              <Button variant="secondary" size="sm" className="gap-2 font-mono text-xs">
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>Transfers</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Scientific Resource Card: DIESEL BHARATI Example from Prompt */}
        <div className="p-6 rounded bg-[#0A0A0A] border-l-2 border-[#C8A96B] border-y border-r border-[#242424] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#242424] pb-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold tracking-wider text-[#F5F3EE]">
                DIESEL &bull; BHARATI STATION
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#140808] text-[#B85C5C] border border-[#B85C5C]/30 font-bold">
                CRITICAL
              </span>
            </div>
            <span className="text-[10px] font-mono text-[#6F6D68]">
              RE-SUPPLY CORRIDOR PRIORITY 1
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div>
              <span className="text-[10px] text-[#6F6D68] uppercase block">CURRENT RESERVE</span>
              <span className="text-2xl font-bold text-[#F5F3EE] mt-1 block">1,240 L</span>
              <span className="text-[10px] text-[#A5A29C] mt-0.5 block">Polar Grade A-1</span>
            </div>

            <div>
              <span className="text-[10px] text-[#6F6D68] uppercase block">DAILY BURN RATE</span>
              <span className="text-2xl font-bold text-[#F5F3EE] mt-1 block">180 L/day</span>
              <span className="text-[10px] text-[#A5A29C] mt-0.5 block">Main Station Generators</span>
            </div>

            <div>
              <span className="text-[10px] text-[#6F6D68] uppercase block">RUNWAY REMAINING</span>
              <span className="text-2xl font-bold text-[#B85C5C] mt-1 block">6.9 DAYS</span>
              <span className="text-[10px] text-[#B85C5C]/80 mt-0.5 block">Below 14-day threshold</span>
            </div>

            <div className="flex flex-col justify-end">
              <Link href="/inventory/forecast">
                <Button variant="gold" size="sm" className="w-full font-mono text-xs">
                  Inspect Burn Model &rarr;
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-4 rounded bg-[#0A0A0A] border border-[#242424] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="w-full sm:w-80">
            <Input
              type="text"
              placeholder="Search consumable name, ID, category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-[#6F6D68]">STATION FILTER:</span>
            <select
              value={stationFilter}
              onChange={(e) => setStationFilter(e.target.value)}
              className="bg-[#101010] border border-[#242424] rounded px-3 py-1 text-[#F5F3EE] text-xs focus:outline-none focus:border-[#C8A96B]"
            >
              <option value="ALL">ALL STATIONS</option>
              <option value="bharati">BHARATI STATION</option>
              <option value="maitri">MAITRI STATION</option>
            </select>
          </div>
        </div>

        {/* Black Table with White Typography and Hairline Separators */}
        <div className="rounded bg-[#101010] border border-[#242424] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-[#242424] bg-[#0A0A0A] text-[#6F6D68] text-[9px] uppercase tracking-wider">
                  <th className="py-3 px-4">CONSUMABLE ITEM</th>
                  <th className="py-3 px-4">STATION</th>
                  <th className="py-3 px-4">CURRENT RESERVE</th>
                  <th className="py-3 px-4">DAILY BURN RATE</th>
                  <th className="py-3 px-4">DAYS REMAINING</th>
                  <th className="py-3 px-4">SAFETY THRESHOLD</th>
                  <th className="py-3 px-4">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#242424]/60 text-[#A5A29C]">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-[#111111] transition-colors">
                    <td className="py-3.5 px-4 font-sans">
                      <span className="font-bold text-[#F5F3EE] block">{item.name}</span>
                      <span className="text-[10px] text-[#6F6D68] font-mono block">
                        {item.id} &bull; {item.category}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 uppercase font-bold text-[#F5F3EE]">
                      {item.stationId}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-[#F5F3EE]">
                      {item.currentStock.toLocaleString()} {item.unit}
                    </td>

                    <td className="py-3.5 px-4 text-[#A5A29C]">
                      {item.dailyConsumption} {item.unit}/day
                    </td>

                    <td className="py-3.5 px-4 font-bold font-mono">
                      <span
                        className={
                          item.daysRemaining < 10
                            ? "text-[#B85C5C]"
                            : item.daysRemaining < 25
                            ? "text-[#C49A55]"
                            : "text-[#7FAF91]"
                        }
                      >
                        {item.daysRemaining} days
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-[#6F6D68]">
                      {item.safetyStockDays} days
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          item.status === "Critical"
                            ? "danger"
                            : item.status === "Low"
                            ? "warning"
                            : "success"
                        }
                        dot
                      >
                        {item.status}
                      </Badge>
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
