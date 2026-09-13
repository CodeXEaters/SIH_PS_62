"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Box,
  Truck,
  Database,
  Radio,
  Compass,
  ArrowRight,
  Thermometer,
  Wind,
  Eye,
  RefreshCw,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Badge, Button } from "@/components/ui";
import { mockAttentionItems, mockStations, mockCargoItems } from "@/data/mock";
import { stationsService } from "@/services/stations";
import { cargoService } from "@/services/cargo";
import { personnelService } from "@/services/personnel";
import { assetsService } from "@/services/assets";
import { missionsService } from "@/services/missions";
import { intelligenceService } from "@/services/intelligence";
import { reportsService } from "@/services/reports";
import { Station, CargoItem, AttentionItem } from "@/types";

export default function DashboardPage() {
  const [stations, setStations] = useState<Station[]>(mockStations);
  const [cargoItems, setCargoItems] = useState<CargoItem[]>(mockCargoItems);
  const [attentionItems, setAttentionItems] = useState<AttentionItem[]>(mockAttentionItems);
  const [kpiData, setKpiData] = useState({
    personnel: "12",
    cargo: "5",
    assets: "10",
    inventory: "94%",
    missions: "04",
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    Promise.allSettled([
      stationsService.getAllStations(),
      cargoService.getAllCargo(),
      personnelService.getAllPersonnel(),
      assetsService.getAllAssets(),
      missionsService.getAllMissions(),
      intelligenceService.getAttentionItems(),
      reportsService.getPerformanceSummary(),
    ]).then(([stationsRes, cargoRes, personnelRes, assetsRes, missionsRes, intelRes, reportsRes]) => {
      if (!isMounted) return;

      if (stationsRes.status === "fulfilled" && stationsRes.value && stationsRes.value.length > 0) {
        setStations(stationsRes.value);
      }
      if (cargoRes.status === "fulfilled" && cargoRes.value && cargoRes.value.length > 0) {
        setCargoItems(cargoRes.value);
      }
      if (intelRes.status === "fulfilled" && intelRes.value && intelRes.value.length > 0) {
        setAttentionItems(intelRes.value);
      }

      const pCount = personnelRes.status === "fulfilled" && personnelRes.value ? String(personnelRes.value.length) : "12";
      const cCount = cargoRes.status === "fulfilled" && cargoRes.value ? String(cargoRes.value.length) : "5";
      const aCount = assetsRes.status === "fulfilled" && assetsRes.value ? String(assetsRes.value.length) : "10";
      const mCount = missionsRes.status === "fulfilled" && missionsRes.value ? String(missionsRes.value.length).padStart(2, "0") : "04";
      const invPct = reportsRes.status === "fulfilled" && reportsRes.value && reportsRes.value.expeditionReadinessPct
        ? `${Math.round(reportsRes.value.expeditionReadinessPct)}%`
        : "94%";

      setKpiData({
        personnel: pCount,
        cargo: cCount,
        assets: aCount,
        inventory: invPct,
        missions: mCount,
      });

      setIsLoading(false);
    });

    return () => { isMounted = false; };
  }, []);

  const kpis = [
    {
      label: "PERSONNEL",
      value: kpiData.personnel,
      status: "DEPLOYED",
      subtext: "Stations & Traverse",
      href: "/personnel",
    },
    {
      label: "CARGO",
      value: kpiData.cargo,
      status: "TRACKED",
      subtext: "Containers & Units",
      href: "/cargo",
    },
    {
      label: "ASSETS",
      value: kpiData.assets,
      status: "OPERATIONAL",
      subtext: "Vehicles & Generators",
      href: "/assets",
    },
    {
      label: "INVENTORY",
      value: kpiData.inventory,
      status: "READY",
      subtext: "Life Support Reserve",
      href: "/inventory",
    },
    {
      label: "MISSIONS",
      value: kpiData.missions,
      status: "ACTIVE",
      subtext: "Field Science Traverses",
      href: "/missions",
    },
  ];

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Dashboard Header: EXPEDITION COMMAND CENTER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#242424] pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7FAF91]" />
              <span className="text-[10px] font-mono tracking-[0.25em] text-[#C8C8C5] uppercase font-semibold">
                NCPOR OPERATIONAL COMMAND &bull; 46TH ISEA
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F5F3EE]">
              EXPEDITION COMMAND CENTER
            </h1>
            <p className="text-xs sm:text-sm text-[#A5A29C] mt-1">
              A live operational picture across people, cargo, assets and missions.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link href="/operations/map">
              <Button variant="primary" size="sm" className="gap-2 font-mono text-xs">
                <Compass className="w-3.5 h-3.5" />
                <span>Operations Map</span>
              </Button>
            </Link>
            <Link href="/cargo/scanner">
              <Button variant="secondary" size="sm" className="font-mono text-xs">
                <span>Scan QR</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* KPI Section: Flat Black Panels with Thin Separators */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {kpis.map((kpi) => (
            <Link
              key={kpi.label}
              href={kpi.href}
              className="p-5 rounded bg-[#101010] border border-[#242424] hover:border-[#383838] transition-colors flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-medium tracking-widest text-[#6F6D68] uppercase">
                  {kpi.label}
                </span>
                <span className="text-[9px] font-mono text-[#A5A29C]">
                  {kpi.status}
                </span>
              </div>

              <div className="my-3">
                <div className="text-3xl sm:text-4xl font-mono font-bold text-[#F5F3EE] tracking-tight">
                  {kpi.value}
                </div>
                <div className="text-[10px] font-mono text-[#6F6D68] mt-1 truncate">
                  {kpi.subtext}
                </div>
              </div>

              <div className="pt-2 border-t border-[#242424] flex items-center justify-between text-[10px] font-mono text-[#6F6D68] group-hover:text-[#F5F3EE] transition-colors">
                <span>View Details</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          ))}
        </div>

        {/* ATTENTION REQUIRED (Most Important Section) */}
        <div className="rounded bg-[#0A0A0A] border border-[#242424] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#242424] flex items-center justify-between bg-[#070707]">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-[#B85C5C]" />
              <h2 className="text-xs font-mono font-bold tracking-[0.2em] text-[#F5F3EE] uppercase">
                ATTENTION REQUIRED
              </h2>
            </div>
            <span className="text-[11px] font-mono text-[#A5A29C]">
              {attentionItems.length} Items Requiring Action
            </span>
          </div>

          <div className="divide-y divide-[#242424]">
            {attentionItems.slice(0, 4).map((item, idx) => {
              const numStr = String(idx + 1).padStart(2, "0");
              const isCrit = item.severity === "CRITICAL";
              const isHigh = item.severity === "HIGH";
              const isLow = item.severity === "LOW";
              const colorClass = isCrit || isHigh ? "text-[#B85C5C]" : isLow ? "text-[#7FAF91]" : "text-[#C49A55]";
              const badgeBorderClass = isCrit || isHigh
                ? "bg-[#140808] text-[#B85C5C] border-[#B85C5C]/30"
                : isLow
                ? "bg-[#0A140D] text-[#7FAF91] border-[#7FAF91]/30"
                : "bg-[#161208] text-[#C49A55] border-[#C49A55]/30";
              const buttonVariant = isCrit ? "danger" : "secondary";

              return (
                <div
                  key={item.id || idx}
                  className="p-5 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#101010] transition-colors"
                >
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-mono font-bold ${colorClass}`}>{numStr}</span>
                      <span className="text-xs font-mono font-bold tracking-wider text-[#F5F3EE] uppercase">
                        {item.title}
                      </span>
                      {item.location && (
                        <span className="text-[10px] font-mono text-[#6F6D68]">&bull; {item.location}</span>
                      )}
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border uppercase ${badgeBorderClass}`}>
                        {item.severity}
                      </span>
                    </div>
                    <p className="text-xs text-[#A5A29C] leading-relaxed">
                      {item.reason}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <Link href={item.actionUrl || "/dashboard"}>
                      <Button variant={buttonVariant} size="sm" className="font-mono text-xs">
                        <span>{item.actionLabel || "REVIEW"}</span>
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Two-Column Grid: Station Telemetry & Active Shipments Table */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Station Telemetry (5 Columns) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold tracking-wider text-[#F5F3EE] uppercase">
                STATION TELEMETRY
              </span>
              <span className="text-[10px] font-mono text-[#7FAF91]">● SATELLITE LINK ACTIVE</span>
            </div>

            <div className="space-y-3">
              {stations.map((station) => (
                <div
                  key={station.id}
                  className="p-4 rounded bg-[#101010] border border-[#242424] space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-[#F5F3EE]">{station.name}</h4>
                      <span className="text-[10px] font-mono text-[#6F6D68]">{station.locationName}</span>
                    </div>
                    <Badge variant={station.status === "OPERATIONAL" ? "success" : "warning"} dot>
                      {station.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                    <div className="p-2 rounded bg-[#0A0A0A] border border-[#242424]">
                      <div className="flex items-center justify-center gap-1 text-[#A5A29C] mb-0.5">
                        <Thermometer className="w-3 h-3 text-[#6F6D68]" />
                        <span className="text-[9px] uppercase">Temp</span>
                      </div>
                      <span className="font-bold text-[#F5F3EE]">
                        {station.weather.temperatureC}°C
                      </span>
                    </div>

                    <div className="p-2 rounded bg-[#0A0A0A] border border-[#242424]">
                      <div className="flex items-center justify-center gap-1 text-[#A5A29C] mb-0.5">
                        <Wind className="w-3 h-3 text-[#6F6D68]" />
                        <span className="text-[9px] uppercase">Wind</span>
                      </div>
                      <span className="font-bold text-[#F5F3EE]">
                        {station.weather.windSpeedKts} kts
                      </span>
                    </div>

                    <div className="p-2 rounded bg-[#0A0A0A] border border-[#242424]">
                      <div className="flex items-center justify-center gap-1 text-[#A5A29C] mb-0.5">
                        <Eye className="w-3 h-3 text-[#6F6D68]" />
                        <span className="text-[9px] uppercase">Vis</span>
                      </div>
                      <span className="font-bold text-[#F5F3EE]">
                        {station.weather.visibilityKm} km
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-[#6F6D68] pt-1">
                    <span>Occupancy: {station.currentOccupancy}/{station.capacity}</span>
                    <span className={station.weather.blizzardRisk === "SEVERE" ? "text-[#B85C5C] font-bold" : "text-[#7FAF91]"}>
                      Blizzard Risk: {station.weather.blizzardRisk}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Cargo Corridors Data Table (7 Columns) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold tracking-wider text-[#F5F3EE] uppercase">
                ACTIVE CARGO CORRIDORS
              </span>
              <Link href="/cargo" className="text-[10px] font-mono text-[#C8A96B] hover:underline">
                All Cargo Manifests &rarr;
              </Link>
            </div>

            <div className="rounded bg-[#101010] border border-[#242424] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-[#242424] bg-[#0A0A0A] text-[#6F6D68] text-[9px] uppercase tracking-wider">
                      <th className="py-3 px-4">CARGO ID</th>
                      <th className="py-3 px-4">DESCRIPTION</th>
                      <th className="py-3 px-4">DESTINATION</th>
                      <th className="py-3 px-4">STATUS</th>
                      <th className="py-3 px-4">ETA</th>
                      <th className="py-3 px-4">RISK</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#242424]/60 text-[#A5A29C]">
                    {cargoItems.slice(0, 5).map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-[#111111] transition-colors cursor-pointer"
                        onClick={() => window.location.href = `/cargo/${item.id}`}
                      >
                        <td className="py-3 px-4 font-bold text-[#F5F3EE] whitespace-nowrap">
                          {item.id}
                        </td>
                        <td className="py-3 px-4 max-w-[180px] truncate text-[#A5A29C]">
                          {item.description}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-[#F5F3EE]">
                          {item.destination}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="flex items-center gap-1.5">
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                item.status === "Delayed"
                                  ? "bg-[#C49A55]"
                                  : item.status === "Received"
                                  ? "bg-[#7FAF91]"
                                  : "bg-[#C8C8C5]"
                              }`}
                            />
                            <span>{item.status.toUpperCase()}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-[#6F6D68]">
                          {item.eta}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={
                              item.riskLevel === "CRITICAL"
                                ? "text-[#B85C5C] font-bold"
                                : item.riskLevel === "HIGH"
                                ? "text-[#C49A55]"
                                : "text-[#6F6D68]"
                            }
                          >
                            {item.riskLevel}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
