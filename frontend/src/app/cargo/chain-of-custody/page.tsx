"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileSpreadsheet, ShieldCheck, CheckCircle2, Search, Hash } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Badge, Button, Input } from "@/components/ui";
import { mockChainOfCustody, mockCargoItems } from "@/data/mock";

export default function ChainOfCustodyPage() {
  const [selectedCargoId, setSelectedCargoId] = useState<string>("CRG-ANT-004821");

  const filtered = mockChainOfCustody.filter(
    (c) => !selectedCargoId || c.cargoId === selectedCargoId
  );

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
              {mockCargoItems.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.id} ({c.destination})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Audit Stream */}
        <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-polar-border">
          {filtered.map((record, idx) => (
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
      </div>
    </AppShell>
  );
}
