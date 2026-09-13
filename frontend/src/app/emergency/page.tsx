"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Edit3,
  RefreshCw,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui";
import { emergencyService } from "@/services/emergency";
import { EmergencyIncident } from "@/types";

export default function EmergencyCommandPage() {
  const [incident, setIncident] = useState<EmergencyIncident | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [decision, setDecision] = useState<"PENDING" | "APPROVED" | "MODIFIED" | "REJECTED">("PENDING");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    emergencyService.getActiveIncident()
      .then((inc) => {
        if (isMounted && inc) {
          setIncident(inc);
          setDecision(inc.humanDecision || "PENDING");
          if (inc.humanDecision === "APPROVED") {
            setStatusMessage(`✓ DISPATCH ORDER APPROVED: ${inc.recommendedResponse?.primaryAssetName || "Rescue Unit"} deployed. ${inc.decisionNotes || ""}`);
          } else if (inc.humanDecision === "MODIFIED") {
            setStatusMessage(`⚠️ DISPATCH MODIFIED: ${inc.decisionNotes || "Parameters adjusted by commander."}`);
          } else if (inc.humanDecision === "REJECTED") {
            setStatusMessage(`✕ DISPATCH REJECTED: ${inc.decisionNotes || "Mission cancelled."}`);
          }
        }
      })
      .catch((err) => console.warn("Failed to load active emergency:", err))
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => { isMounted = false; };
  }, []);

  const handleDecision = async (action: "APPROVED" | "MODIFIED" | "REJECTED") => {
    setIsSubmitting(true);
    try {
      const incidentId = incident?.id || "1";
      const notes = action === "APPROVED" 
        ? "Commander approved AI rescue dispatch order via Ridge Route 2."
        : action === "MODIFIED"
        ? "Commander modified deployment parameters to account for ice conditions."
        : "Commander rejected dispatch order; ordered team to shelter in place.";
      
      const updated = await emergencyService.updateDecision(incidentId, action, notes);
      setIncident(updated);
      setDecision(action);
      if (action === "APPROVED") {
        setStatusMessage(`✓ DISPATCH ORDER APPROVED: ${updated.recommendedResponse?.primaryAssetName || "Rescue Unit"} deployed. Database status updated to DISPATCHED.`);
      } else if (action === "MODIFIED") {
        setStatusMessage("⚠️ DISPATCH MODIFIED: Parameters adjusted and logged in database.");
      } else {
        setStatusMessage("✕ DISPATCH REJECTED: Team ordered to shelter in place. Incident updated in database.");
      }
    } catch (err: any) {
      console.error("Emergency decision error:", err);
      setDecision(action);
      setStatusMessage(`⚠️ Local decision recorded (${action}). Backend sync error: ${err?.message || "Check connection"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#242424] pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`w-2 h-2 rounded-full ${incident ? "bg-[#B85C5C] animate-pulse" : "bg-[#7FAF91]"}`} />
              <span className="text-[10px] font-mono tracking-[0.25em] text-[#B85C5C] uppercase font-bold">
                {incident ? `ACTIVE INCIDENT • ${incident.incidentCode}` : "EMERGENCY STANDBY • NOMINAL"}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F5F3EE]">
              EMERGENCY COMMAND
            </h1>
            <p className="text-xs sm:text-sm text-[#A5A29C] mt-1">
              {incident?.title || "Search and rescue coordination, personnel distress telemetry, and AI dispatch decision support."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setIsLoading(true);
                emergencyService.getActiveIncident().then(setIncident).finally(() => setIsLoading(false));
              }}
              className="gap-2 font-mono text-xs"
              title="Refresh incident telemetry"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </Button>
            <Link href="/emergency/history">
              <Button variant="secondary" size="sm" className="gap-2 font-mono text-xs">
                <Clock className="w-3.5 h-3.5" />
                <span>Incident History</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* 3-Column Layout: Left (Map) | Center (Incident Details) | Right (Response Recommendation) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* 1. Map on Left (4 Columns) */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#242424]">
              <span className="text-xs font-mono font-bold tracking-wider text-[#F5F3EE] uppercase">
                INCIDENT SECTOR MAP
              </span>
              <span className="text-[10px] font-mono text-[#B85C5C]">
                {incident?.locationName ? incident.locationName.toUpperCase() : "SECTOR 4 RIDGE"}
              </span>
            </div>

            <div className="aspect-square w-full rounded bg-[#050505] border border-[#242424] relative overflow-hidden flex items-center justify-center select-none">
              {/* Polar Coordinate Rings */}
              <div className="absolute w-44 h-44 rounded-full border border-[#1A1A1A]" />
              <div className="absolute w-28 h-28 rounded-full border border-dashed border-[#B85C5C]/40" />
              <div className="absolute w-12 h-12 rounded-full border border-[#242424]" />

              {/* Target Marker: Casualty */}
              <div className="absolute top-[38%] left-[45%] flex flex-col items-center">
                <span className="w-3 h-3 rounded-full bg-[#B85C5C] ring-4 ring-[#B85C5C]/30 animate-pulse" />
                <span className="mt-1 px-1.5 py-0.2 rounded bg-[#0A0A0A] border border-[#B85C5C]/50 text-[8px] font-mono font-bold text-[#F5F3EE]">
                  {incident?.affectedPersonnel?.[0]?.name ? incident.affectedPersonnel[0].name.toUpperCase() : "CASUALTY SOS"}
                </span>
              </div>

              {/* Base Marker: Station */}
              <div className="absolute bottom-[22%] right-[25%] flex flex-col items-center">
                <span className="w-2.5 h-2.5 rounded-full bg-[#C8A96B]" />
                <span className="mt-1 px-1.5 py-0.2 rounded bg-[#0A0A0A] border border-[#242424] text-[8px] font-mono text-[#C8A96B]">
                  {incident?.stationName ? incident.stationName.toUpperCase() : "BHARATI"}
                </span>
              </div>

              {/* Vector Line: Route 2 */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <line x1="72%" y1="75%" x2="47%" y2="42%" stroke="#C8A96B" strokeWidth="1.5" strokeDasharray="3 3" />
              </svg>

              <div className="absolute bottom-2 left-2 text-[9px] font-mono text-[#6F6D68]">
                ROUTE 2 &bull; 87 KM &bull; ETA 1h 45m
              </div>
            </div>
          </div>

          {/* 2. Incident Details Center (4 Columns) */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#242424]">
              <span className="text-xs font-mono font-bold tracking-wider text-[#F5F3EE] uppercase">
                INCIDENT DETAILS
              </span>
              <span className="text-[10px] font-mono text-[#B85C5C] font-bold">
                {incident?.severity || "CRITICAL"}
              </span>
            </div>

            <div className="p-5 rounded bg-[#101010] border border-[#242424] space-y-4 font-mono text-xs">
              <div className="space-y-1">
                <span className="text-[10px] text-[#6F6D68] uppercase block">PERSONNEL AFFECTED</span>
                <span className="text-2xl font-bold text-[#F5F3EE] block">
                  {incident?.affectedPersonnel?.length ? String(incident.affectedPersonnel.length).padStart(2, "0") : "01"}
                </span>
                <span className="text-[11px] text-[#A5A29C] block">
                  {incident?.affectedPersonnel?.map((p) => p.name).join(", ") || "Field Specialist"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#242424]">
                <div>
                  <span className="text-[10px] text-[#6F6D68] uppercase block">DISTANCE</span>
                  <span className="text-lg font-bold text-[#F5F3EE] mt-0.5 block">87 KM</span>
                  <span className="text-[10px] text-[#A5A29C]">From {incident?.stationName || "Bharati"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#6F6D68] uppercase block">STATUS</span>
                  <span className="text-lg font-bold text-[#B85C5C] mt-0.5 block">
                    {decision === "APPROVED" ? "DISPATCHED" : decision === "REJECTED" ? "CANCELLED" : "ACTIVE"}
                  </span>
                  <span className="text-[10px] text-[#A5A29C]">Live SOS Beacon</span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#242424]">
                <span className="text-[10px] text-[#6F6D68] uppercase block">TERRAIN CONTEXT</span>
                <span className="text-sm font-bold text-[#C49A55] mt-0.5 block truncate">
                  {incident?.locationName || "CREVASSE ZONE • STRONG WINDS"}
                </span>
                <span className="text-[10px] text-[#A5A29C] mt-0.5 block">
                  {incident?.weatherConditions ? `${incident.weatherConditions.temperatureC}°C • ${incident.weatherConditions.windSpeedKts} kts Wind` : "-24°C Windchill • Blowing Snow"}
                </span>
              </div>
            </div>
          </div>

          {/* 3. Response Recommendation Right (4 Columns) */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#242424]">
              <span className="text-xs font-mono font-bold tracking-wider text-[#F5F3EE] uppercase">
                RECOMMENDED RESPONSE
              </span>
              <span className="text-[10px] font-mono text-[#7FAF91]">
                {decision === "APPROVED" ? "DISPATCHED" : "READY"}
              </span>
            </div>

            <div className="p-5 rounded bg-[#101010] border border-[#242424] space-y-4 font-mono text-xs">
              <div>
                <span className="text-[10px] text-[#6F6D68] uppercase block">NEAREST RESPONSE UNIT</span>
                <span className="text-sm font-bold text-[#F5F3EE] mt-1 block">
                  {incident?.recommendedResponse?.primaryAssetName || "PistenBully Polar Rescue Unit"}
                </span>
                <span className="text-[10px] text-[#A5A29C] block">
                  Stationed at {incident?.stationName || "Bharati Station"} Depot
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#242424]">
                <div>
                  <span className="text-[10px] text-[#6F6D68] uppercase block">ESTIMATED TRANSIT</span>
                  <span className="text-base font-bold text-[#7FAF91] mt-0.5 block">
                    {incident?.recommendedResponse?.estimatedTransitHours ? `${incident.recommendedResponse.estimatedTransitHours}h` : "1h 45m"}
                  </span>
                  <span className="text-[10px] text-[#A5A29C]">Direct Terrain Route</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#6F6D68] uppercase block">ROUTE RISK</span>
                  <span className="text-base font-bold text-[#C49A55] mt-0.5 block">
                    {incident?.recommendedResponse?.routeRiskScore ? `${incident.recommendedResponse.routeRiskScore}/100` : "MODERATE"}
                  </span>
                  <span className="text-[10px] text-[#A5A29C]">Assessed via Sat-Radar</span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#242424]">
                <span className="text-[10px] text-[#6F6D68] uppercase block">MEDICAL CAPABILITY</span>
                <span className="text-xs font-bold text-[#F5F3EE] mt-0.5 block">Hypothermia Trauma Pod</span>
                <span className="text-[10px] text-[#A5A29C] mt-0.5 block">O2, Defibrillator, Thermal Blankets Staged</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: AI RECOMMENDATION & HUMAN APPROVAL (Visually Obvious) */}
        <div className="p-6 rounded bg-[#0A0A0A] border-l-2 border-[#C8A96B] border-y border-r border-[#242424] space-y-4 font-mono text-xs">
          <div>
            <span className="text-[10px] font-bold text-[#C8A96B] uppercase tracking-wider block mb-1">
              AI RECOMMENDATION
            </span>
            <p className="text-sm sm:text-base font-sans font-medium text-[#F5F3EE]">
              “{incident?.recommendedResponse?.contingencyPlan || "Deploy Team Bravo via Route 2. Standby medical bay at Bharati Station for hypothermia triage."}”
            </p>
          </div>

          {statusMessage && (
            <div className="p-3 rounded bg-[#101010] border border-[#242424] text-xs font-mono text-[#7FAF91]">
              {statusMessage}
            </div>
          )}

          {/* HUMAN APPROVAL (Visually Obvious) */}
          <div className="pt-4 border-t border-[#242424] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold tracking-wider text-[#F5F3EE] block">
                HUMAN COMMAND APPROVAL
              </span>
              <span className="text-[11px] text-[#A5A29C]">
                Officer in charge must authorize physical deployment order.
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="primary"
                size="md"
                onClick={() => handleDecision("APPROVED")}
                disabled={isSubmitting || decision === "APPROVED"}
                className="font-mono text-xs px-6 py-2 font-bold"
              >
                {isSubmitting ? "PROCESSING..." : "APPROVE"}
              </Button>

              <Button
                variant="secondary"
                size="md"
                onClick={() => handleDecision("MODIFIED")}
                disabled={isSubmitting}
                className="font-mono text-xs px-5 py-2"
              >
                MODIFY
              </Button>

              <Button
                variant="danger"
                size="md"
                onClick={() => handleDecision("REJECTED")}
                disabled={isSubmitting || decision === "REJECTED"}
                className="font-mono text-xs px-5 py-2"
              >
                REJECT
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
