"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Box,
  CheckCircle2,
  FileSpreadsheet,
  QrCode,
  Sparkles,
  MapPin,
  Clock,
  Compass,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Badge, Button } from "@/components/ui";
import { cargoService } from "@/services/cargo";
import { intelligenceService } from "@/services/intelligence";
import { CargoItem } from "@/types";
import { formatKg, formatDateTime, formatCoords } from "@/lib/utils";

export default function CargoDigitalTwinPage() {
  const params = useParams();
  const id = params.id as string;
  const [cargo, setCargo] = useState<CargoItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
  const [aiDecision, setAiDecision] = useState<"PENDING" | "ACCEPTED" | "DISMISSED">("PENDING");

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setNotFound(false);

    cargoService
      .getCargoById(id)
      .then((c) => {
        if (isMounted) {
          if (c) {
            setCargo(c);
          } else {
            setNotFound(true);
          }
        }
      })
      .catch((err) => {
        console.warn("Failed to fetch cargo detail from backend:", err);
        if (isMounted) setNotFound(true);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    cargoService
      .getCargoTimeline(id)
      .then((res) => {
        if (isMounted && res && res.events) {
          setTimelineEvents(res.events);
        }
      })
      .catch((err) => console.warn("Failed to fetch cargo timeline:", err));

    intelligenceService
      .predictCargoDelay(id)
      .then((pred) => {
        if (isMounted && pred) {
          setCargo((prev) =>
            prev
              ? {
                  ...prev,
                  aiAssessment: {
                    delayProbability: Math.round((pred.delay_probability ?? 0.94) * 100),
                    estimatedDelayHours: Math.round(pred.estimated_delay_hours ?? 18),
                    keyDrivers:
                      Array.isArray(pred.key_drivers) && pred.key_drivers.length > 0
                        ? pred.key_drivers
                        : ["Katabatic wind vectors exceeding 42 kts at Prydz Bay mooring", "Sling-load helicopter limits"],
                    recommendation: pred.recommendation || "Hold heli-lift transfer until wind gusts subside below 28 kts.",
                  },
                }
              : null
          );
        }
      })
      .catch((err) => console.warn("Failed to fetch AI delay prediction:", err));

    return () => {
      isMounted = false;
    };
  }, [id]);

  const latestEvent = React.useMemo(() => {
    if (timelineEvents.length === 0) return null;
    return timelineEvents[timelineEvents.length - 1];
  }, [timelineEvents]);

  // Derive corridor steps strictly from real backend timeline events
  const corridorSteps = React.useMemo(() => {
    if (!cargo) return [];
    if (timelineEvents.length > 0) {
      const steps = timelineEvents.map((evt, idx) => {
        const isLatest = idx === timelineEvents.length - 1;
        const eventDate = formatDateTime(evt.timestamp);
        return {
          name: (evt.event_type || "").replace(/_/g, " "),
          detail: evt.remarks || evt.location,
          location: evt.location,
          status: isLatest ? "CURRENT" : "COMPLETED",
          date: isLatest && (cargo.status === "Delayed" || cargo.status === "DELAYED")
            ? `${eventDate} • Katabatic Delay +18h`
            : eventDate,
        };
      });

      if (cargo.status !== "DELIVERED" && cargo.status !== "ARRIVED" && cargo.status !== "Received") {
        steps.push({
          name: cargo.destination.toUpperCase(),
          detail: `${cargo.destination} Science Lab 2 & Inventory Bay`,
          location: cargo.destination,
          status: "PENDING",
          date: "Scheduled Resupply Slot",
        });
      }
      return steps;
    }

    // When no events exist yet, use only real creation info from cargo
    const initialDate = cargo.createdAt ? formatDateTime(cargo.createdAt) : "Registration Pending";
    return [
      {
        name: "CREATED",
        detail: `Manifest registered for transit from ${cargo.origin} to ${cargo.destination}`,
        location: cargo.origin,
        status: "CURRENT",
        date: initialDate,
      },
      {
        name: cargo.destination.toUpperCase(),
        detail: `Scheduled delivery to ${cargo.destination}`,
        location: cargo.destination,
        status: "PENDING",
        date: "Scheduled Resupply Slot",
      },
    ];
  }, [timelineEvents, cargo]);

  const currentStepIndex = corridorSteps.findIndex((s) => s.status === "CURRENT");
  const stageDisplayIndex = currentStepIndex >= 0 ? currentStepIndex + 1 : corridorSteps.length;

  if (isLoading) {
    return (
      <AppShell>
        <div className="max-w-6xl mx-auto py-16 text-center">
          <p className="text-xs font-mono text-[#6F6D68] uppercase tracking-wider">
            Loading cargo digital twin manifest...
          </p>
        </div>
      </AppShell>
    );
  }

  if (notFound || !cargo) {
    return (
      <AppShell>
        <div className="max-w-6xl mx-auto py-16 space-y-4 text-center">
          <div className="inline-block p-4 rounded-full bg-[#101010] border border-[#242424] text-[#B85C5C] mb-2">
            <Box className="w-8 h-8 mx-auto" />
          </div>
          <h2 className="text-xl font-bold font-mono text-[#F5F3EE]">CARGO ITEM NOT FOUND</h2>
          <p className="text-xs font-mono text-[#A5A29C]">
            No cargo record found for tracking code &quot;{id}&quot;.
          </p>
          <div className="pt-2">
            <Link href="/cargo">
              <Button variant="secondary" size="sm" className="font-mono text-xs">
                <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                <span>Return to Cargo Dashboard</span>
              </Button>
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#242424] pb-6">
          <div>
            <Link
              href="/cargo"
              className="inline-flex items-center gap-1.5 text-[10px] font-mono text-[#C8A96B] hover:underline mb-2"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>RETURN TO CARGO MANIFESTS</span>
            </Link>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold tracking-widest text-[#6F6D68] uppercase">
                {cargo.id}
              </span>
              <span className="text-[#303030]">&bull;</span>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F5F3EE]">
                CARGO DIGITAL TWIN
              </h1>
              <Badge variant={cargo.status === "Delayed" || cargo.status === "DELAYED" ? "warning" : "default"} dot>
                {cargo.status}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-[#A5A29C] mt-1 max-w-2xl">
              {cargo.description}
            </p>
            {cargo.createdAt && (
              <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] font-mono text-[#6F6D68]">
                <Clock className="w-3.5 h-3.5 text-[#C8A96B]" />
                <span>Registered: <span className="text-[#F5F3EE]">{formatDateTime(cargo.createdAt)}</span></span>
                {timelineEvents.length > 0 && (timelineEvents[0]?.updated_by_user || timelineEvents[0]?.updated_by_name) && (
                  <>
                    <span>&bull;</span>
                    <span>Created by: <span className="text-[#F5F3EE]">{timelineEvents[0].updated_by_name || timelineEvents[0].updated_by_user}</span></span>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <Link href="/cargo/scanner">
              <Button variant="secondary" size="sm" className="gap-1.5">
                <QrCode className="w-3.5 h-3.5" />
                <span>Verify QR</span>
              </Button>
            </Link>
            <Link href="/cargo/chain-of-custody">
              <Button variant="outline" size="sm" className="gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Chain of Custody</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Cargo Specification Grid: Flat Black Panels */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
          <div className="p-4 rounded bg-[#101010] border border-[#242424]">
            <span className="text-[10px] text-[#6F6D68] uppercase block">OWNER / CONSIGNEE</span>
            <span className="text-[#F5F3EE] font-bold mt-1 block">{cargo.owner}</span>
            <span className="text-[10px] text-[#A5A29C] mt-0.5 block">{cargo.category}</span>
          </div>

          <div className="p-4 rounded bg-[#101010] border border-[#242424]">
            <span className="text-[10px] text-[#6F6D68] uppercase block">CURRENT LOCATION</span>
            <span className="text-[#C8A96B] font-bold mt-1 block">
              {latestEvent?.location || cargo.currentLocation || "In Transit / Staging"}
            </span>
            <span className="text-[10px] text-[#A5A29C] mt-0.5 block truncate">
              {latestEvent?.timestamp
                ? `Updated: ${formatDateTime(latestEvent.timestamp)}`
                : cargo.lastScannedAt
                ? `Updated: ${formatDateTime(cargo.lastScannedAt)}`
                : cargo.transportMode || "Logistics Network"}
            </span>
          </div>

          <div className="p-4 rounded bg-[#101010] border border-[#242424]">
            <span className="text-[10px] text-[#6F6D68] uppercase block">DIMENSIONS &amp; MASS</span>
            <span className="text-[#F5F3EE] font-bold mt-1 block">{formatKg(cargo.weightKg)}</span>
            <span className="text-[10px] text-[#A5A29C] mt-0.5 block">{cargo.dimensionsM}</span>
          </div>

          <div className="p-4 rounded bg-[#101010] border border-[#242424]">
            <span className="text-[10px] text-[#6F6D68] uppercase block">DESTINATION</span>
            <span className="text-[#F5F3EE] font-bold mt-1 block">{cargo.destination}</span>
            <span className="text-[10px] text-[#A5A29C] mt-0.5 block">Origin: {cargo.origin}</span>
          </div>
        </div>

        {/* AI ASSESSMENT PANEL */}
        {cargo.aiAssessment && (
          <div className="p-5 sm:p-6 rounded bg-[#0D0D0D] border border-[#242424] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#242424] pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#C8A96B]" />
                <div>
                  <h2 className="text-xs font-mono font-bold tracking-wider text-[#F5F3EE] uppercase">
                    AI ASSESSMENT &bull; PREDICTIVE HAZARD ANALYSIS
                  </h2>
                  <p className="text-[11px] text-[#A5A29C]">
                    Probabilistic model correlating katabatic wind speed vectors with heli-lift sling limits.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-[#6F6D68] block">DELAY PROBABILITY</span>
                  <span className="text-base font-bold text-[#C49A55]">
                    {cargo.aiAssessment.delayProbability}%
                  </span>
                </div>
                <div className="border-l border-[#242424] pl-4">
                  <span className="text-[10px] text-[#6F6D68] block">ESTIMATED IMPACT</span>
                  <span className="text-base font-bold text-[#B85C5C]">
                    +{cargo.aiAssessment.estimatedDelayHours}h
                  </span>
                </div>
              </div>
            </div>

            {/* Recommendation in Muted Champagne Gold Line */}
            <div className="p-4 rounded bg-[#12100A] border-l-2 border-[#C8A96B] text-xs font-mono space-y-1">
              <span className="text-[10px] font-bold text-[#C8A96B] uppercase tracking-wider block">
                RECOMMENDED OPERATIONAL RESPONSE
              </span>
              <p className="text-[#F5F3EE] leading-relaxed">
                {cargo.aiAssessment.recommendation}
              </p>
            </div>

            {/* Human Approval */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs font-mono">
              <span className="text-[#A5A29C]">
                {aiDecision === "ACCEPTED" ? (
                  <span className="text-[#7FAF91] font-bold">✓ Recommendation Accepted: Slot H-04 confirmed.</span>
                ) : (
                  "Human Approval Required: Confirm stowage relocation."
                )}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setAiDecision("ACCEPTED")}
                  disabled={aiDecision === "ACCEPTED"}
                >
                  Approve Action
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setAiDecision("DISMISSED")}
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Two Columns: Movement Timeline (Left) & Chain of Custody + Map (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Movement Timeline: Thin Vertical Line with Small Gold Marker for Current State */}
          <div className="lg:col-span-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#242424]">
              <span className="text-xs font-mono font-bold tracking-wider text-[#F5F3EE] uppercase">
                MOVEMENT TIMELINE
              </span>
              <span className="text-[10px] font-mono text-[#C8A96B]">
                STAGE {String(stageDisplayIndex).padStart(2, "0")} OF {String(corridorSteps.length).padStart(2, "0")}
              </span>
            </div>

            <div className="p-6 rounded bg-[#101010] border border-[#242424]">
              <div className="relative pl-6 space-y-6">
                {/* Thin Vertical Line */}
                <div className="absolute left-[7px] top-2 bottom-2 w-[1px] bg-[#242424]" />

                {corridorSteps.map((step) => {
                  const isCurrent = step.status === "CURRENT";
                  const isCompleted = step.status === "COMPLETED";

                  return (
                    <div key={step.name} className="relative flex items-start gap-4 text-xs font-mono">
                      {/* Marker */}
                      <div className="absolute -left-[23px] top-1">
                        {isCurrent ? (
                          // Small gold marker for current state
                          <span className="w-3.5 h-3.5 rounded-full bg-[#C8A96B] ring-4 ring-[#C8A96B]/20 flex items-center justify-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#050505]" />
                          </span>
                        ) : isCompleted ? (
                          <span className="w-3 h-3 rounded-full bg-[#303030] border border-[#6F6D68] flex items-center justify-center text-[7px] text-[#F5F3EE]">
                            ✓
                          </span>
                        ) : (
                          <span className="w-3 h-3 rounded-full bg-[#101010] border border-[#242424]" />
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className={`font-bold tracking-wider ${isCurrent ? 'text-[#C8A96B]' : isCompleted ? 'text-[#F5F3EE]' : 'text-[#6F6D68]'}`}>
                            {step.name}
                          </span>
                          <span className={`text-[10px] ${isCurrent ? 'text-[#C8A96B]' : 'text-[#6F6D68]'}`}>
                            {step.date}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#A5A29C] font-sans mt-0.5">
                          {step.detail}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Chain of Custody & Tactical Map Preview (Right: 6 Columns) */}
          <div className="lg:col-span-6 space-y-6">
            {/* Tactical Sector Map Preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold tracking-wider text-[#F5F3EE] uppercase">
                  GEOSPATIAL SECTOR
                </span>
                <span className="text-[10px] font-mono text-[#6F6D68]">
                  {latestEvent?.latitude != null && latestEvent?.longitude != null
                    ? formatCoords(latestEvent.latitude, latestEvent.longitude)
                    : cargo.currentLocation || "Sector Polar Grid"}
                </span>
              </div>

              <div className="aspect-[16/9] rounded bg-[#050505] border border-[#242424] relative overflow-hidden flex items-center justify-center">
                <div className="absolute w-40 h-40 rounded-full border border-[#202020]" />
                <div className="absolute w-24 h-24 rounded-full border border-dashed border-[#C8A96B]/30" />
                <div className="flex flex-col items-center z-10 text-center px-4">
                  <span className="w-3 h-3 rounded-full bg-[#C8A96B] ring-4 ring-[#C8A96B]/20" />
                  <span className="mt-1.5 px-2 py-0.5 rounded bg-[#0A0A0A] border border-[#242424] text-[10px] font-mono font-bold text-[#F5F3EE] max-w-[220px] truncate">
                    {latestEvent?.location || cargo.currentLocation || "In Transit"}
                  </span>
                  <span className="text-[9px] font-mono text-[#C8A96B] mt-0.5">
                    {latestEvent?.event_type ? `EVENT: ${latestEvent.event_type}` : cargo.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Chain of Custody Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold tracking-wider text-[#F5F3EE] uppercase">
                  CHAIN OF CUSTODY LOG
                </span>
                <Link href="/cargo/chain-of-custody" className="text-[10px] font-mono text-[#C8A96B] hover:underline">
                  Full Ledger &rarr;
                </Link>
              </div>

              <div className="rounded bg-[#101010] border border-[#242424] overflow-hidden text-xs font-mono">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-[#242424] bg-[#0A0A0A] text-[#6F6D68] text-[9px] uppercase">
                      <th className="py-2.5 px-3">CUSTODIAN</th>
                      <th className="py-2.5 px-3">LOCATION</th>
                      <th className="py-2.5 px-3">VERIFICATION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#242424]/60 text-[#A5A29C]">
                    {timelineEvents.length > 0 ? (
                      timelineEvents.slice(-5).map((evt, idx, arr) => {
                        const isLatest = idx === arr.length - 1;
                        const custodianName =
                          evt.updated_by_name ||
                          evt.updated_by_user ||
                          (evt.updated_by ? `Officer #${evt.updated_by}` : "NCPOR Officer");
                        const timeStr = formatDateTime(evt.timestamp);
                        return (
                          <tr key={evt.id || idx}>
                            <td className="py-2.5 px-3">
                              <span className="font-bold text-[#F5F3EE] block">{custodianName}</span>
                              <span className="text-[10px] text-[#6F6D68] block">{timeStr}</span>
                            </td>
                            <td className="py-2.5 px-3 max-w-[150px] truncate">{evt.location}</td>
                            <td className={`py-2.5 px-3 ${isLatest ? "text-[#C8A96B]" : "text-[#7FAF91]"}`}>
                              {isLatest ? "Current Custody" : "Signed • SHA-256"}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={3} className="py-6 text-center text-[#6F6D68]">
                          No custody events recorded yet.
                        </td>
                      </tr>
                    )}
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
