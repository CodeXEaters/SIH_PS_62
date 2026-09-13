"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Radio,
  Compass,
  Users,
  Wind,
  Truck,
  Wrench,
  AlertTriangle,
  Clock,
  ShieldAlert,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Badge, Button } from "@/components/ui";
import { mockMissions } from "@/data/mock";
import { missionsService } from "@/services/missions";
import { Mission } from "@/types";

export default function MissionDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [mission, setMission] = useState<Mission>(
    () => mockMissions.find((m) => m.id === id) || mockMissions[0]
  );

  useEffect(() => {
    let isMounted = true;
    missionsService.getMissionById(id).then((m) => {
      if (isMounted && m) setMission(m);
    }).catch(console.warn);
    return () => { isMounted = false; };
  }, [id]);

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#242424] pb-5">
          <div>
            <Link
              href="/missions"
              className="inline-flex items-center gap-1 text-[10px] font-mono text-[#C8A96B] hover:underline mb-1"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Back to Missions</span>
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#F5F3EE] tracking-tight font-mono">
                {mission.id}
              </h1>
              <Badge severity={mission.riskLevel} dot>
                {mission.riskLevel} RISK
              </Badge>
              <Badge variant={mission.status === "Active" ? "gold" : "default"}>
                {mission.status}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-[#A5A29C] mt-0.5 max-w-3xl">
              {mission.title}
            </p>
          </div>

          {mission.id === "MSN-ANT-024" && (
            <Link href="/emergency">
              <Button variant="danger" size="sm" className="gap-1.5 animate-pulse">
                <ShieldAlert className="w-4 h-4" />
                <span>Incident #EM-024</span>
              </Button>
            </Link>
          )}
        </div>

        {/* 4 Detail Panels: Team & Comms, Route & Weather, Assigned Equipment, Check-in Timeline */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Team & Communication Link */}
          <div className="p-5 rounded bg-[#101010] border border-[#242424] space-y-4">
            <h3 className="text-xs font-mono font-bold tracking-wider text-[#F5F3EE] uppercase">
              EXPEDITION TEAM &amp; TELEMETRY LINK
            </h3>

            <div className="space-y-2 text-xs font-mono">
              <div className="p-3 rounded bg-[#0A0A0A] border border-[#242424]">
                <span className="text-[10px] text-[#6F6D68] uppercase block">Traverse Commander</span>
                <span className="text-[#F5F3EE] font-bold block mt-0.5">{mission.teamLead}</span>
                <span className="text-[10px] text-[#C8A96B]">Total Field Crew: {mission.membersCount} Specialists</span>
              </div>

              <div className="p-3 rounded bg-[#0A0A0A] border border-[#242424]">
                <span className="text-[10px] text-[#6F6D68] uppercase block">Satellite Comms Status</span>
                <div className="flex items-center justify-between mt-1">
                  <span className={mission.telemetryStatus === "DROPOUT" ? "text-[#B85C5C] font-bold" : "text-[#7FAF91]"}>
                    {mission.telemetryStatus}
                  </span>
                  <span className="text-[#6F6D68] text-[10px]">{mission.lastTelemetryTime}</span>
                </div>
                {mission.telemetryDropMinutes && (
                  <p className="text-[#B85C5C] text-[10px] mt-1">
                    Warning: Iridium burst transceiver dropped carrier frequency 14 minutes ago.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Route & Polar Weather Window */}
          <div className="p-5 rounded bg-[#101010] border border-[#242424] space-y-4">
            <h3 className="text-xs font-mono font-bold tracking-wider text-[#F5F3EE] uppercase">
              ROUTE COORDINATES &amp; WEATHER WINDOW
            </h3>

            <div className="space-y-2 text-xs font-mono">
              <div className="p-3 rounded bg-[#0A0A0A] border border-[#242424]">
                <span className="text-[10px] text-[#6F6D68] uppercase block">Destination Waypoint</span>
                <span className="text-[#F5F3EE] font-bold block mt-0.5">{mission.location}</span>
                <span className="text-[10px] text-[#C8A96B]">Base: {(mission.stationSlug || mission.stationId).toString().toUpperCase()}</span>
              </div>

              <div className="p-3 rounded bg-[#0A0A0A] border border-[#242424]">
                <span className="text-[10px] text-[#6F6D68] uppercase block">Meteorological Threat Summary</span>
                <p className="text-[#A5A29C] text-[11px] mt-1 font-sans">
                  {mission.weatherRiskSummary}
                </p>
              </div>
            </div>
          </div>

          {/* Assigned Equipment & Vehicles */}
          <div className="p-5 rounded bg-[#101010] border border-[#242424] space-y-4">
            <h3 className="text-xs font-mono font-bold tracking-wider text-[#F5F3EE] uppercase">
              ASSIGNED VEHICLES &amp; HARDWARE
            </h3>

            <div className="space-y-2 text-xs font-mono">
              <div className="p-3 rounded bg-[#0A0A0A] border border-[#242424]">
                <span className="text-[10px] text-[#6F6D68] uppercase block">Traverse Vehicles</span>
                {mission.assignedVehicles.map((v) => (
                  <Link key={v} href={`/assets/${v}`} className="text-[#C8A96B] font-bold block hover:underline mt-0.5">
                    {v} (PistenBully 300 Heavy Sledge)
                  </Link>
                ))}
              </div>

              <div className="p-3 rounded bg-[#0A0A0A] border border-[#242424]">
                <span className="text-[10px] text-[#6F6D68] uppercase block">Scientific &amp; Survival Kits</span>
                <ul className="space-y-1 text-[#A5A29C] mt-1">
                  {mission.assignedEquipment.map((eq) => (
                    <li key={eq} className="flex items-center gap-1.5">
                      <span className="text-[#C8A96B]">&bull;</span>
                      <span>{eq}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Mission Waypoints Progression */}
          <div className="p-5 rounded bg-[#101010] border border-[#242424] space-y-4">
            <h3 className="text-xs font-mono font-bold tracking-wider text-[#F5F3EE] uppercase">
              GPS WAYPOINT TRAIL
            </h3>

            <div className="space-y-2 text-xs font-mono">
              {mission.coordinates.map((coord, idx) => (
                <div key={idx} className="p-2.5 rounded bg-[#0A0A0A] border border-[#242424] flex items-center justify-between">
                  <span className="text-[#6F6D68]">WP-0{idx + 1}:</span>
                  <span className="text-[#F5F3EE] font-bold">
                    {coord.lat.toFixed(4)}°S, {coord.lng.toFixed(4)}°E
                  </span>
                  <span className="text-[10px] text-[#C8A96B] font-medium">
                    {idx === mission.coordinates.length - 1 ? "Current Sector" : "Reached"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
