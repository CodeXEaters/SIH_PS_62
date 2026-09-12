"use client";

import React, { useState } from "react";
import { Settings, Users, Shield, Server, Database, Save, CheckCircle2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Badge, Button, Input } from "@/components/ui";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"roles" | "users" | "stations" | "config">("roles");
  const [savedMessage, setSavedMessage] = useState(false);

  const roles = [
    { name: "COMMANDER", desc: "Full tactical authority: incident approvals, resupply allocation sign-off, personnel movement." },
    { name: "LOGISTICS_OFFICER", desc: "Cargo check-in, customs manifest sign-off, QR scanning, transport slot assignments." },
    { name: "SCIENTIST", desc: "Mission logging, equipment status updates, telemetry logging." },
    { name: "MEDICAL_OFFICER", desc: "Physical clearance updates, clinical telemetry monitoring, medical supply inventories." },
  ];

  const users = [
    { name: "Dr. Arvind Sharan", role: "COMMANDER", email: "arvind.sharan@ncpor.res.in", station: "Bharati" },
    { name: "Lt. Col. Vikramaditya Rathore", role: "LOGISTICS_OFFICER", email: "vikram.rathore@ncpor.res.in", station: "Vessel Transit" },
    { name: "Dr. Ananya Sen", role: "MEDICAL_OFFICER", email: "ananya.sen@aiims.edu", station: "Bharati" },
    { name: "Dr. Pradeep Mukherjee", role: "SCIENTIST", email: "p.mukherjee@iig.res.in", station: "Bharati" },
  ];

  const stations = [
    { name: "Bharati Station", lat: "-69.4081°S", lng: "76.1872°E", capacity: 47, status: "OPERATIONAL" },
    { name: "Maitri Station", lat: "-70.7658°S", lng: "11.7358°E", capacity: 65, status: "OPERATIONAL" },
  ];

  const handleSave = () => {
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-polar-border pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-polar-cyan font-bold">
                SYSTEM CONFIGURATION
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              ADMINISTRATION &amp; ACCESS CONTROL
            </h1>
            <p className="text-xs sm:text-sm text-polar-muted mt-0.5">
              Role permissions, station telemetry endpoints, and offline database parameters.
            </p>
          </div>

          <Button variant="primary" size="sm" onClick={handleSave} className="gap-1.5 font-mono text-xs">
            <Save className="w-3.5 h-3.5" />
            <span>Save Configuration</span>
          </Button>
        </div>

        {savedMessage && (
          <div className="p-3 rounded bg-emerald-950/60 border border-emerald-800 text-xs font-mono text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>System parameters saved successfully to local and remote sync registers.</span>
          </div>
        )}

        {/* Tab Controls */}
        <div className="flex items-center gap-2 border-b border-polar-border pb-2 text-xs font-mono">
          <button
            onClick={() => setActiveTab("roles")}
            className={`px-3 py-1.5 rounded transition-all ${
              activeTab === "roles"
                ? "bg-polar-deep text-polar-cyan font-bold border border-polar-cyan/40"
                : "text-polar-muted hover:text-polar-snow"
            }`}
          >
            Roles &amp; Permissions
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`px-3 py-1.5 rounded transition-all ${
              activeTab === "users"
                ? "bg-polar-deep text-polar-cyan font-bold border border-polar-cyan/40"
                : "text-polar-muted hover:text-polar-snow"
            }`}
          >
            Authorized Users
          </button>
          <button
            onClick={() => setActiveTab("stations")}
            className={`px-3 py-1.5 rounded transition-all ${
              activeTab === "stations"
                ? "bg-polar-deep text-polar-cyan font-bold border border-polar-cyan/40"
                : "text-polar-muted hover:text-polar-snow"
            }`}
          >
            Station Coordinates
          </button>
          <button
            onClick={() => setActiveTab("config")}
            className={`px-3 py-1.5 rounded transition-all ${
              activeTab === "config"
                ? "bg-polar-deep text-polar-cyan font-bold border border-polar-cyan/40"
                : "text-polar-muted hover:text-polar-snow"
            }`}
          >
            System Endpoints
          </button>
        </div>

        {/* Tab Content */}
        <div className="space-y-4">
          {activeTab === "roles" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {roles.map((r) => (
                <div key={r.name} className="p-5 rounded-lg bg-polar-deep/80 border border-polar-border space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs font-mono text-polar-cyan">{r.name}</span>
                    <Badge variant="outline">ROLE</Badge>
                  </div>
                  <p className="text-xs text-polar-muted leading-relaxed font-sans">{r.desc}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === "users" && (
            <div className="rounded-lg border border-polar-border bg-polar-deep/90 overflow-hidden text-xs font-mono">
              <table className="w-full text-left">
                <thead className="bg-polar-midnight/80 border-b border-polar-border text-[10px] uppercase text-polar-muted">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Station Location</th>
                    <th className="py-3 px-4">Email</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-polar-border/60">
                  {users.map((u) => (
                    <tr key={u.email} className="hover:bg-polar-surface/50">
                      <td className="py-3.5 px-4 font-bold text-polar-snow font-sans">{u.name}</td>
                      <td className="py-3.5 px-4 text-polar-cyan">{u.role}</td>
                      <td className="py-3.5 px-4">{u.station}</td>
                      <td className="py-3.5 px-4 text-polar-muted">{u.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "stations" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {stations.map((st) => (
                <div key={st.name} className="p-5 rounded-lg bg-polar-deep/80 border border-polar-border space-y-2 text-xs font-mono">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-polar-snow text-sm font-sans">{st.name}</h3>
                    <Badge variant="success">{st.status}</Badge>
                  </div>
                  <div className="space-y-1 text-polar-muted pt-1">
                    <div>Coordinates: <span className="text-polar-cyan">{st.lat}, {st.lng}</span></div>
                    <div>Capacity: <span className="text-polar-snow">{st.capacity} Personnel</span></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "config" && (
            <div className="p-6 rounded-lg bg-polar-deep/90 border border-polar-border space-y-4 text-xs font-mono">
              <h3 className="text-xs font-bold uppercase tracking-wider text-polar-snow font-mono">
                API &amp; WEBSOCKET CONFIGURATION
              </h3>

              <div className="space-y-3 max-w-xl">
                <div>
                  <label className="text-[10px] text-polar-muted block uppercase mb-1">
                    FastAPI Endpoint Base URL
                  </label>
                  <Input defaultValue="http://localhost:8000/api/v1" readOnly />
                </div>

                <div>
                  <label className="text-[10px] text-polar-muted block uppercase mb-1">
                    Iridium Telemetry WebSocket URL
                  </label>
                  <Input defaultValue="ws://localhost:8000/ws" readOnly />
                </div>

                <div>
                  <label className="text-[10px] text-polar-muted block uppercase mb-1">
                    Offline Database Persistence
                  </label>
                  <div className="p-2.5 rounded bg-polar-midnight/80 border border-polar-border text-emerald-400">
                    IndexedDB Dexie &bull; Active &bull; Version 1.0.0
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
