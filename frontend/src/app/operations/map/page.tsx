"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Compass,
  Layers,
  MapPin,
  Ship,
  Plane,
  Truck,
  Box,
  ArrowRight,
  ShieldAlert,
  Search,
  Maximize2,
  RefreshCw,
  X,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Badge, Button, Drawer } from "@/components/ui";
import { mockTrackingEntities, TacticalTrackingEntity, trackingService } from "@/services/tracking";
import { useWebSocket } from "@/hooks/useWebSocket";
import { formatCoords } from "@/lib/utils";

export default function OperationsMapPage() {
  const [trackingEntities, setTrackingEntities] = useState<TacticalTrackingEntity[]>(mockTrackingEntities);
  const [selectedEntity, setSelectedEntity] = useState<TacticalTrackingEntity | null>(
    mockTrackingEntities[0] // Bharati Station initially selected
  );
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    trackingService.getTrackingEntities().then((entities) => {
      if (entities && entities.length > 0) {
        setTrackingEntities(entities);
        setSelectedEntity(entities[0]);
      }
    }).catch(console.warn);
  }, []);

  // Listen for live telemetry updates over WebSocket
  useWebSocket({
    channel: "tracking",
    onMessage: () => {
      trackingService.getTrackingEntities().then((entities) => {
        if (entities && entities.length > 0) {
          setTrackingEntities(entities);
        }
      }).catch(() => {});
    },
  });

  // Active Map Layers
  const [layers, setLayers] = useState({
    stations: true,
    vessels: true,
    aircraft: true,
    vehicles: true,
    cargo: true,
    weather: true,
    seaIce: true,
  });

  const toggleLayer = (layer: keyof typeof layers) => {
    setLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  };

  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Filter entities by active layers
  const visibleEntities = trackingEntities.filter((e) => {
    if (e.type === "STATION" && !layers.stations) return false;
    if (e.type === "VESSEL" && !layers.vessels) return false;
    if (e.type === "AIRCRAFT" && !layers.aircraft) return false;
    if (e.type === "VEHICLE" && !layers.vehicles) return false;
    if (e.type === "CARGO" && !layers.cargo) return false;
    return true;
  });

  return (
    <AppShell>
      <div className="h-[calc(100vh-80px)] flex flex-col space-y-4">
        {/* Map Header & Tactical Layer Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0A0A0A] border border-[#242424] p-3.5 rounded shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C8A96B]" />
              <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#C8C8C5] font-semibold">
                POLAR PROJECTION &bull; 70°S
              </span>
              <span className="text-[#303030]">&bull;</span>
              <span className="text-[10px] font-mono text-[#7FAF91]">
                ● AIS &amp; IRIDIUM FEEDS LIVE
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-[#F5F3EE] tracking-tight">
              ANTARCTIC HIGH-LATITUDE OPERATIONS MAP
            </h1>
          </div>

          {/* Layer Toggles in Monochrome / Gold */}
          <div className="flex items-center gap-1.5 flex-wrap text-[11px] font-mono">
            <span className="text-[#6F6D68] text-[10px] uppercase mr-1">LAYERS:</span>
            {[
              { id: "stations", label: "STATIONS" },
              { id: "vessels", label: "VESSELS" },
              { id: "aircraft", label: "AIR" },
              { id: "vehicles", label: "TRAVERSE" },
              { id: "cargo", label: "CARGO" },
              { id: "weather", label: "BLIZZARD" },
              { id: "seaIce", label: "SEA ICE" },
            ].map((layer) => {
              const active = layers[layer.id as keyof typeof layers];
              return (
                <button
                  key={layer.id}
                  onClick={() => toggleLayer(layer.id as keyof typeof layers)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-all ${
                    active
                      ? "bg-[#16130C] border-[#C8A96B]/50 text-[#C8A96B]"
                      : "bg-[#0A0A0A] border-[#242424] text-[#6F6D68] hover:text-[#A5A29C]"
                  }`}
                >
                  {layer.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Map Canvas Workspace: High-end Navigation Instrument */}
        <div className="flex-1 rounded border border-[#242424] bg-[#050505] relative overflow-hidden flex select-none">
          <div
            ref={mapContainerRef}
            className="w-full h-full relative overflow-hidden bg-[#050505] polar-grid-bg flex items-center justify-center select-none"
          >
            {/* Antarctic Cartographic Projection Vector Rings */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none opacity-40"
              viewBox="0 0 1000 700"
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Polar Coordinate Grid Rings */}
              <circle cx="500" cy="450" r="380" stroke="#202020" strokeWidth="1" fill="none" />
              <circle cx="500" cy="450" r="260" stroke="#202020" strokeWidth="1" strokeDasharray="3 3" fill="none" />
              <circle cx="500" cy="450" r="140" stroke="#202020" strokeWidth="1" fill="none" />
              <circle cx="500" cy="450" r="40" stroke="#C8A96B" strokeWidth="1" strokeOpacity="0.3" fill="none" />

              {/* Geographic Longitude Radials */}
              <line x1="500" y1="70" x2="500" y2="830" stroke="#1C1C1C" strokeWidth="0.8" />
              <line x1="120" y1="450" x2="880" y2="450" stroke="#1C1C1C" strokeWidth="0.8" />
              <line x1="230" y1="180" x2="770" y2="720" stroke="#1C1C1C" strokeWidth="0.8" />

              {/* Antarctic Coastline Contour (Dark Charcoal / Graphite Fill & Hairline Stroke) */}
              <path
                d="M 280 280 Q 350 210 460 220 T 620 250 T 740 340 T 780 480 T 690 620 T 480 660 T 320 580 T 240 440 Z"
                fill="#0E0E0E"
                stroke="#282828"
                strokeWidth="1.2"
              />

              {/* Fast Ice Belt (Subtle Muted Boundary) */}
              {layers.seaIce && (
                <path
                  d="M 260 260 Q 350 180 480 190 T 660 230 T 800 330 T 820 500 T 720 650 T 460 690 T 290 610 T 210 440 Z"
                  fill="none"
                  stroke="#383838"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
              )}

              {/* Shipping Route Corridor (Cape Town to Bharati: Muted Champagne Gold) */}
              <path
                d="M 380 60 Q 480 140 570 240 T 620 300"
                fill="none"
                stroke="#C8A96B"
                strokeOpacity="0.6"
                strokeWidth="1.5"
                strokeDasharray="3 4"
              />
            </svg>

            {/* Weather Blown Blizzard Warning Boundary (Muted Red) */}
            {layers.weather && (
              <div className="absolute top-[32%] right-[22%] w-56 h-36 rounded-full bg-[#140808]/40 border border-[#B85C5C]/40 blur-xs pointer-events-none flex items-center justify-center">
                <span className="text-[9px] font-mono text-[#B85C5C] font-bold tracking-widest uppercase bg-[#050505]/90 px-2 py-0.5 rounded border border-[#B85C5C]/50">
                  BLIZZARD &bull; 42kt GUSTS
                </span>
              </div>
            )}

            {/* Tactical Markers (Interactive Overlay) */}
            <div className="absolute inset-0">
              {/* 1. Bharati Station (-69.4°S 76.2°E) - Muted Gold Beacon */}
              {layers.stations && (
                <button
                  onClick={() => {
                    const entity = trackingEntities.find(e => e.id === "STAT-4" || e.name.toLowerCase().includes("bharati")) || mockTrackingEntities[0];
                    setSelectedEntity(entity);
                    setDrawerOpen(true);
                  }}
                  className="absolute top-[42%] left-[62%] -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                  title="Bharati Station"
                >
                  <div className="relative flex flex-col items-center">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#C8A96B] ring-4 ring-[#C8A96B]/20" />
                    <span className="mt-1 px-1.5 py-0.2 rounded bg-[#0A0A0A] border border-[#242424] text-[9px] font-mono font-bold text-[#F5F3EE] whitespace-nowrap">
                      BHARATI
                    </span>
                  </div>
                </button>
              )}

              {/* 2. Maitri Station (-70.7°S 11.7°E) - Muted Gold Beacon */}
              {layers.stations && (
                <button
                  onClick={() => {
                    const entity = trackingEntities.find(e => e.id === "STAT-3" || e.name.toLowerCase().includes("maitri")) || mockTrackingEntities[1];
                    setSelectedEntity(entity);
                    setDrawerOpen(true);
                  }}
                  className="absolute top-[46%] left-[34%] -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                  title="Maitri Station"
                >
                  <div className="relative flex flex-col items-center">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#C8A96B] ring-4 ring-[#C8A96B]/20" />
                    <span className="mt-1 px-1.5 py-0.2 rounded bg-[#0A0A0A] border border-[#242424] text-[9px] font-mono font-bold text-[#F5F3EE] whitespace-nowrap">
                      MAITRI
                    </span>
                  </div>
                </button>
              )}

              {/* 3. Expedition Vessel: MV Vasundhara - Silver Ship */}
              {layers.vessels && (
                <button
                  onClick={() => {
                    const entity = trackingEntities.find(e => e.type === "VESSEL" || e.name.toLowerCase().includes("vasundhara") || e.name.toLowerCase().includes("vessel")) || mockTrackingEntities[2];
                    setSelectedEntity(entity);
                    setDrawerOpen(true);
                  }}
                  className="absolute top-[30%] left-[58%] -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                  title="Expedition Vessel"
                >
                  <div className="flex flex-col items-center">
                    <div className="w-6 h-6 rounded bg-[#101010] border border-[#C8A96B] flex items-center justify-center">
                      <Ship className="w-3.5 h-3.5 text-[#C8A96B]" />
                    </div>
                    <span className="mt-1 px-1.5 py-0.2 rounded bg-[#0A0A0A] border border-[#242424] text-[8px] font-mono text-[#C8C8C5]">
                      VASUNDHARA
                    </span>
                  </div>
                </button>
              )}

              {/* 4. Personnel Traverse: Team Alpha - White Marker */}
              <button
                onClick={() => {
                  const entity = trackingEntities.find(e => e.type === "TEAM" || e.name.toLowerCase().includes("alpha") || e.name.toLowerCase().includes("traverse")) || mockTrackingEntities[4];
                  setSelectedEntity(entity);
                  setDrawerOpen(true);
                }}
                className="absolute top-[52%] left-[64%] -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                title="Team Alpha Field Party"
              >
                <div className="flex flex-col items-center">
                  <span className="w-2 h-2 rounded-full bg-[#FFFFFF] ring-2 ring-[#FFFFFF]/30" />
                  <span className="mt-1 px-1 py-0.2 rounded bg-[#0A0A0A] border border-[#242424] text-[8px] font-mono text-[#FFFFFF]">
                    TEAM ALPHA
                  </span>
                </div>
              </button>

              {/* 5. Cargo Lot: CRG-2026-001 - Gray Marker */}
              {layers.cargo && (
                <button
                  onClick={() => {
                    const entity = trackingEntities.find(e => e.type === "CARGO" || e.id.includes("CRG")) || mockTrackingEntities[5];
                    setSelectedEntity(entity);
                    setDrawerOpen(true);
                  }}
                  className="absolute top-[33%] left-[59%] -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                  title="Cargo Pod"
                >
                  <div className="flex flex-col items-center">
                    <span className="w-2 h-2 bg-[#A5A29C] rounded-xs" />
                    <span className="mt-1 px-1 py-0.2 rounded bg-[#0A0A0A] border border-[#242424] text-[8px] font-mono text-[#A5A29C]">
                      CRG-2026-001
                    </span>
                  </div>
                </button>
              )}
            </div>

            {/* Bottom Left Instrument Overlay: Polar Nav Legend */}
            <div className="absolute bottom-4 left-4 p-3 rounded bg-[#0A0A0A]/90 border border-[#242424] backdrop-blur-md text-[10px] font-mono space-y-1">
              <div className="text-[#6F6D68] uppercase text-[9px] tracking-wider mb-1">MAP TELEMETRY</div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#C8A96B]" />
                <span className="text-[#F5F3EE]">Stations (Maitri &amp; Bharati)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-0.5 bg-[#C8A96B]" />
                <span className="text-[#A5A29C]">Maritime Corridors</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#FFFFFF]" />
                <span className="text-[#F5F3EE]">Personnel Field Parties</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-[#A5A29C]" />
                <span className="text-[#A5A29C]">Tracked Cargo Lots</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#B85C5C]" />
                <span className="text-[#B85C5C]">Katabatic Blizzard Boundary</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tactical Detail Drawer for Selected Entity */}
        <Drawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          title={selectedEntity?.name || "ENTITY DETAILS"}
          subtitle={selectedEntity?.id}
        >
          {selectedEntity && (
            <div className="space-y-5 font-mono text-xs">
              <div className="p-3 rounded bg-[#101010] border border-[#242424] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[#6F6D68]">TYPE</span>
                  <span className="text-[#F5F3EE] font-bold">{selectedEntity.type}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6F6D68]">COORDINATES</span>
                  <span className="text-[#C8A96B]">{formatCoords(selectedEntity.lat, selectedEntity.lng)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6F6D68]">STATUS</span>
                  <Badge variant={selectedEntity.status === "OPERATIONAL" ? "success" : "warning"} dot>
                    {selectedEntity.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6F6D68]">LAST SATELLITE PING</span>
                  <span className="text-[#A5A29C]">{selectedEntity.lastPing}</span>
                </div>
              </div>

              {selectedEntity.description && (
                <p className="text-xs font-sans text-[#A5A29C] leading-relaxed">
                  {selectedEntity.description}
                </p>
              )}

              <div className="pt-3 border-t border-[#242424] flex items-center justify-between">
                <Link href={selectedEntity.type === "CARGO" ? "/cargo/CRG-2026-001" : selectedEntity.type === "STATION" ? "/inventory" : "/personnel"}>
                  <Button variant="primary" size="sm" className="gap-1.5 font-mono text-xs">
                    <span>Open Detailed Dossier</span>
                    <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </Drawer>
      </div>
    </AppShell>
  );
}
