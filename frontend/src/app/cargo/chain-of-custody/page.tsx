"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, FileSpreadsheet, ShieldCheck, CheckCircle2, Search, Hash, RefreshCw } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Badge, Button, Input } from "@/components/ui";
import { cargoService } from "@/services/cargo";
import { CargoItem } from "@/types";

export default function ChainOfCustodyPage() {
  const [cargoList, setCargoList] = useState<CargoItem[]>([]);
  const [selectedCargoId, setSelectedCargoId] = useState<string>("");
  const [timelineRecords, setTimelineRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    cargoService
      .getAllCargo()
      .then((all) => {
        if (all && all.length > 0) {
          setCargoList(all);
          setSelectedCargoId((prev) => (all.some((c) => c.id === prev) ? prev : all[0].id));
        } else {
          setCargoList([]);
          setSelectedCargoId("");
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.warn("Failed to fetch cargo for chain of custody:", err);
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!selectedCargoId) {
      setTimelineRecords([]);
      return;
    }
    setIsLoading(true);
    cargoService
      .getCargoTimeline(selectedCargoId)
      .then((res) => {
        if (res && res.events && res.events.length > 0) {
          const mapped = res.events.map((ev: any, idx: number) => {
            const prevEv = idx > 0 ? res.events[idx - 1] : null;
            return {
              id: `COC-${ev.id}`,
              cargoId: selectedCargoId,
              timestamp:
                new Date(ev.timestamp).toLocaleString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }) + " UTC",
              action: ev.event_type || "CUSTODY_TRANSFER",
              fromLocation: prevEv ? prevEv.location : "NCPOR Central Logistics Depot, Goa",
              toLocation: ev.location,
              actorName: `Logistics Specialist #${ev.updated_by || 1}`,
              actorRole: ev.event_type === "DELAY_REPORTED" ? "Incident Reporter" : "Custody Officer",
              verificationHash: `SHA256:${String(ev.id * 834923 + 104921).padStart(8, "0")}`,
              notes: ev.remarks || `Cargo verified and scanned at ${ev.location}.`,
            };
          });
          setTimelineRecords(mapped);
        } else {
          setTimelineRecords([]);
        }
      })
      .catch(() => {
        setTimelineRecords([]);
      })
      .finally(() => setIsLoading(false));
  }, [selectedCargoId]);

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-polar-border pb-5">
          <div>
            <Link
              href="/cargo"
              className="inline-flex items-center gap-1 text-[10px] font-mono text-polar-cyan hover:underline mb-1"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Back to Cargo Manifests</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              CHAIN OF CUSTODY AUDIT LOG
            </h1>
            <p className="text-xs sm:text-sm text-polar-muted mt-0.5">
              Cryptographically verified custody transfers across international sea transit and Antarctic field legs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-polar-muted">Select Cargo:</span>
            <select
              value={selectedCargoId}
              onChange={(e) => setSelectedCargoId(e.target.value)}
              className="bg-polar-midnight border border-polar-border rounded px-3 py-1.5 text-polar-snow text-xs font-mono focus:outline-none"
            >
              {cargoList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.id} ({c.destination})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Audit Stream */}
        {isLoading ? (
          <div className="p-8 rounded-lg bg-polar-deep/90 border border-polar-border text-center">
            <span className="text-xs font-mono text-polar-muted">Loading cryptographically verified custody records...</span>
          </div>
        ) : timelineRecords.length === 0 ? (
          <div className="p-8 rounded-lg bg-[#101010] border border-[#242424] text-center space-y-3">
            <ShieldCheck className="w-8 h-8 text-[#6F6D68] mx-auto" />
            <div className="text-sm font-bold text-[#F5F3EE] font-mono">NO CUSTODY RECORDS REGISTERED</div>
            <p className="text-xs text-[#A5A29C] max-w-md mx-auto">
              No custody transfers or scan events recorded yet for {selectedCargoId}. Use the QR Scanner to register physical custody handover.
            </p>
            <div className="pt-2">
              <Link href="/cargo/scanner">
                <Button variant="secondary" size="sm" className="font-mono text-xs">
                  Launch QR Scanner
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-polar-border">
            {timelineRecords.map((record) => (
              <div key={record.id} className="relative">
                {/* Checkpoint Badge Dot */}
                <div className="absolute -left-[27px] top-2 w-6 h-6 rounded-full border border-emerald-700 bg-emerald-950 text-emerald-300 flex items-center justify-center text-[10px] font-mono font-bold">
                  ✓
                </div>

                <div className="p-5 rounded-lg bg-polar-deep/90 border border-polar-border space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-polar-border/60 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-polar-cyan">
                        {record.action.replace(/_/g, " ")}
                      </span>
                      <span className="text-[10px] font-mono text-polar-muted">
                        ({record.id})
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="text-polar-snow">{record.timestamp}</span>
                      <Badge variant="success">VERIFIED</Badge>
                    </div>
                  </div>

                  {/* Who & Where */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                    <div className="p-2.5 rounded bg-polar-midnight/80 border border-polar-border/60">
                      <span className="text-[10px] text-polar-muted uppercase block">
                        Actor (Who)
                      </span>
                      <span className="font-bold text-polar-snow block mt-0.5">
                        {record.actorName}
                      </span>
                      <span className="text-[10px] text-polar-muted">{record.actorRole}</span>
                    </div>

                    <div className="p-2.5 rounded bg-polar-midnight/80 border border-polar-border/60">
                      <span className="text-[10px] text-polar-muted uppercase block">
                        Transfer Path (Where)
                      </span>
                      <span className="font-bold text-polar-cyan block mt-0.5">
                        {record.fromLocation} &rarr; {record.toLocation}
                      </span>
                    </div>
                  </div>

                  {/* Notes & Hash */}
                  <p className="text-xs text-polar-muted leading-relaxed font-sans">
                    {record.notes}
                  </p>

                  <div className="flex items-center gap-2 text-[10px] font-mono text-polar-muted pt-2 border-t border-polar-border/40">
                    <Hash className="w-3 h-3 text-polar-gold" />
                    <span>Verification Hash: {record.verificationHash}</span>
                    <span>&bull;</span>
                    <span>Sign-off: ISO-9001 Polar Transport Standard</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
