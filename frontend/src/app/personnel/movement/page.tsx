"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Footprints, ShieldCheck, MapPin } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Badge, Button } from "@/components/ui";
import { personnelService } from "@/services/personnel";
import { Personnel } from "@/types";

export default function PersonnelMovementPage() {
  const [personnelList, setPersonnelList] = useState<Personnel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    personnelService
      .getAllPersonnel()
      .then((data) => {
        setPersonnelList(data || []);
      })
      .catch(console.warn)
      .finally(() => setIsLoading(false));
  }, []);

  const allMovements = personnelList.flatMap((p) =>
    p.movementHistory.map((m) => ({
      ...m,
      personnelId: p.id,
      personnelName: p.name,
      role: p.role,
    }))
  );

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-polar-border pb-5">
          <div>
            <Link
              href="/personnel"
              className="inline-flex items-center gap-1 text-[10px] font-mono text-polar-cyan hover:underline mb-1"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Back to Personnel Roster</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              PERSONNEL MOVEMENT &amp; ROTATION LOGS
            </h1>
            <p className="text-xs sm:text-sm text-polar-muted mt-0.5">
              Authorized inter-station transfers, flight sorties, and ice sheet traverses.
            </p>
          </div>
        </div>

        {/* Movements Table */}
        <div className="rounded-lg border border-polar-border bg-polar-deep/90 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-polar-midnight/80 border-b border-polar-border text-polar-muted uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Personnel</th>
                  <th className="py-3 px-4">Transit Path</th>
                  <th className="py-3 px-4">Transport Mode</th>
                  <th className="py-3 px-4">Authorizing Officer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-polar-border/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-polar-muted font-mono">
                      Loading personnel movement records...
                    </td>
                  </tr>
                ) : allMovements.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-polar-muted font-mono">
                      No personnel movement logs recorded.
                    </td>
                  </tr>
                ) : (
                  allMovements.map((move, idx) => (
                    <tr key={idx} className="hover:bg-polar-surface/50 transition-colors">
                      <td className="py-3 px-4 text-polar-muted">{move.timestamp}</td>
                      <td className="py-3 px-4">
                        <Link
                          href={`/personnel/${move.personnelId}`}
                          className="font-bold text-polar-snow hover:text-polar-cyan"
                        >
                          {move.personnelName}
                        </Link>
                        <span className="text-[10px] text-polar-muted block">
                          {move.personnelId} &bull; {move.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-polar-cyan font-bold">
                        {move.from} &rarr; {move.to}
                      </td>
                      <td className="py-3 px-4 text-polar-snow/90">{move.mode}</td>
                      <td className="py-3 px-4 text-polar-muted">{move.authorizedBy}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
