"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, TrendingDown } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { AppShell } from "@/components/layout/AppShell";
import { Badge, Button } from "@/components/ui";
import { inventoryService } from "@/services/inventory";
import { InventoryItem } from "@/types";

export default function InventoryForecastPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    inventoryService
      .getAllInventory()
      .then((data) => {
        if (data && data.length > 0) {
          setItems(data);
          setSelectedItemId((prev) => (prev && data.some((i) => i.id === prev) ? prev : data[0].id));
        } else {
          setItems([]);
          setSelectedItemId("");
        }
      })
      .catch(console.warn)
      .finally(() => setIsLoading(false));
  }, []);

  const item = items.find((i) => i.id === selectedItemId) || items[0] || null;

  if (isLoading) {
    return (
      <AppShell>
        <div className="max-w-5xl mx-auto py-16 text-center">
          <p className="text-xs font-mono text-[#6F6D68] uppercase tracking-wider">
            Loading consumption and depletion forecasts...
          </p>
        </div>
      </AppShell>
    );
  }

  if (!item) {
    return (
      <AppShell>
        <div className="max-w-5xl mx-auto py-16 space-y-4 text-center">
          <div className="inline-block p-4 rounded-full bg-[#101010] border border-[#242424] text-[#B85C5C] mb-2">
            <TrendingDown className="w-8 h-8 mx-auto" />
          </div>
          <h2 className="text-xl font-bold font-mono text-[#F5F3EE]">NO INVENTORY DATA AVAILABLE</h2>
          <p className="text-xs font-mono text-[#A5A29C]">
            No inventory records registered for predictive depletion modeling.
          </p>
          <div className="pt-2">
            <Link href="/inventory">
              <Button variant="secondary" size="sm" className="font-mono text-xs">
                <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                <span>Return to Station Inventory</span>
              </Button>
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#242424] pb-6">
          <div>
            <Link
              href="/inventory"
              className="inline-flex items-center gap-1.5 text-[10px] font-mono text-[#C8A96B] hover:underline mb-2"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>RETURN TO STATION INVENTORY</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F5F3EE]">
              CONSUMPTION &amp; DEPLETION FORECAST
            </h1>
            <p className="text-xs sm:text-sm text-[#A5A29C] mt-1">
              Predictive burn models based on ambient sub-zero thermal loads and generator duties.
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-[#6F6D68]">SELECT SKU:</span>
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="bg-[#101010] border border-[#242424] rounded px-3 py-1.5 text-[#F5F3EE] text-xs font-mono focus:outline-none focus:border-[#C8A96B]"
            >
              {items.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.name} ({(inv.stationSlug || inv.stationId).toString().toUpperCase()})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Top Drivers in Flat Black Panels */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
          <div className="p-4 rounded bg-[#101010] border border-[#242424]">
            <span className="text-[10px] text-[#6F6D68] uppercase block">CURRENT RESERVE</span>
            <span className="text-2xl font-bold text-[#F5F3EE] mt-1 block">
              {item.currentStock.toLocaleString()} {item.unit}
            </span>
            <span className="text-[10px] text-[#A5A29C]">{item.storageLocation}</span>
          </div>

          <div className="p-4 rounded bg-[#101010] border border-[#242424]">
            <span className="text-[10px] text-[#6F6D68] uppercase block">DAILY BURN RATE</span>
            <span className="text-2xl font-bold text-[#F5F3EE] mt-1 block">
              {item.dailyConsumption} {item.unit}
            </span>
            <span className="text-[10px] text-[#A5A29C]">-19.4°C Ambient Load</span>
          </div>

          <div className="p-4 rounded bg-[#101010] border border-[#242424]">
            <span className="text-[10px] text-[#6F6D68] uppercase block">PREDICTED RUNWAY</span>
            <span className="text-2xl font-bold text-[#B85C5C] mt-1 block">
              {item.daysRemaining} Days
            </span>
            <span className="text-[10px] text-[#B85C5C]/80">14-Day Safe Limit</span>
          </div>

          <div className="p-4 rounded bg-[#101010] border border-[#242424]">
            <span className="text-[10px] text-[#6F6D68] uppercase block">RESUPPLY ETA</span>
            <span className="text-sm font-bold text-[#F5F3EE] mt-1.5 block truncate">
              {item.replenishmentETA}
            </span>
            <span className="text-[10px] text-[#7FAF91] block mt-1">45,000L Discharge Ready</span>
          </div>
        </div>

        {/* Forecast Chart: Off-White, Gray, Muted Gold (No Rainbow, No Blue) */}
        <div className="p-6 rounded bg-[#101010] border border-[#242424] space-y-4">
          <div className="flex items-center justify-between border-b border-[#242424] pb-3">
            <div>
              <span className="text-xs font-mono font-bold tracking-wider text-[#F5F3EE] uppercase">
                DEPLETION CURVE &bull; {item.name.toUpperCase()}
              </span>
              <p className="text-[11px] text-[#6F6D68] mt-0.5 font-mono">
                Muted red dashed line indicates mandatory station safety reserve
              </p>
            </div>
            <Badge variant={item.daysRemaining < 10 ? "danger" : "success"} dot>
              {item.status}
            </Badge>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={item.forecastHistory} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="#1F1F1F" />
                <XAxis dataKey="day" stroke="#6F6D68" fontSize={10} tickLine={false} />
                <YAxis stroke="#6F6D68" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0A0A0A",
                    borderColor: "#242424",
                    borderRadius: "4px",
                    fontSize: "11px",
                    color: "#F5F3EE",
                    fontFamily: "monospace",
                  }}
                />
                <ReferenceLine
                  y={item.minimumThreshold}
                  stroke="#B85C5C"
                  strokeDasharray="4 4"
                  label={{ value: "Safety Threshold", fill: "#B85C5C", fontSize: 10, position: "top" }}
                />
                <Line
                  type="monotone"
                  dataKey="projected"
                  name="Projected Stock"
                  stroke="#C8A96B"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#C8A96B" }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recommended Operational Action */}
        <div className="p-6 rounded bg-[#0A0A0A] border-l-2 border-[#C8A96B] border-y border-r border-[#242424] flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-[#C8A96B] uppercase tracking-wider block">
              RECOMMENDED OPERATIONAL ACTION
            </span>
            <p className="text-[#F5F3EE] font-sans text-xs leading-relaxed max-w-2xl">
              Expedite fuel hose layout over Prydz Bay fast ice as soon as katabatic gusts drop below 28 knots. Maintain Bharati heating circuit throttling from 22:00 to 05:00 UTC to preserve 320L buffer.
            </p>
          </div>

          <Link href="/intelligence/optimization" className="shrink-0">
            <Button variant="primary" size="sm" className="font-mono text-xs">
              Run Optimizer &rarr;
            </Button>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
