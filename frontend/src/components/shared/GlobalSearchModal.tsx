"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Box, Users, Truck, Compass, MapPin, X, ArrowRight } from "lucide-react";
import { useAppStore } from "@/store";
import { mockCargoItems, mockPersonnel, mockAssets, mockMissions, mockStations } from "@/data/mock";

export const GlobalSearchModal: React.FC = () => {
  const router = useRouter();
  const { searchOpen, setSearchOpen } = useAppStore();
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(!searchOpen);
      }
      if (e.key === "Escape" && searchOpen) {
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchOpen, setSearchOpen]);

  if (!searchOpen) return null;

  const q = query.toLowerCase().trim();

  const filteredCargo = q
    ? mockCargoItems.filter(
        (c) =>
          c.id.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.destination.toLowerCase().includes(q)
      )
    : mockCargoItems.slice(0, 2);

  const filteredPersonnel = q
    ? mockPersonnel.filter(
        (p) =>
          p.id.toLowerCase().includes(q) ||
          p.name.toLowerCase().includes(q) ||
          p.role.toLowerCase().includes(q)
      )
    : mockPersonnel.slice(0, 2);

  const filteredAssets = q
    ? mockAssets.filter(
        (a) =>
          a.id.toLowerCase().includes(q) ||
          a.name.toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q)
      )
    : mockAssets.slice(0, 2);

  const filteredMissions = q
    ? mockMissions.filter(
        (m) =>
          m.id.toLowerCase().includes(q) ||
          m.title.toLowerCase().includes(q) ||
          m.location.toLowerCase().includes(q)
      )
    : mockMissions.slice(0, 2);

  const filteredStations = q
    ? mockStations.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.locationName.toLowerCase().includes(q)
      )
    : mockStations;

  const handleSelect = (url: string) => {
    setSearchOpen(false);
    setQuery("");
    router.push(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4">
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity"
        onClick={() => setSearchOpen(false)}
      />

      <div className="relative w-full max-w-2xl rounded-lg border border-polar-border bg-polar-deep shadow-2xl z-10 overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-polar-border bg-polar-midnight/90">
          <Search className="w-5 h-5 text-polar-cyan mr-3 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search cargo ID, personnel, assets, missions, stations... (e.g. CRG-ANT-004821)"
            className="w-full bg-transparent text-sm text-polar-snow placeholder:text-polar-muted focus:outline-none"
            autoFocus
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-polar-muted hover:text-white p-1">
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="text-[10px] font-mono text-polar-muted ml-2 px-1.5 py-0.5 rounded border border-polar-border">
            ESC
          </span>
        </div>

        {/* Categorized Results */}
        <div className="overflow-y-auto p-4 space-y-5 text-xs">
          {/* Cargo Section */}
          {filteredCargo.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-polar-cyan font-mono uppercase tracking-widest text-[10px] mb-2">
                <Box className="w-3.5 h-3.5" />
                <span>Cargo &bull; {filteredCargo.length}</span>
              </div>
              <div className="space-y-1">
                {filteredCargo.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(`/cargo/${item.id}`)}
                    className="w-full flex items-center justify-between p-2 rounded hover:bg-polar-surface/80 text-left transition-colors group"
                  >
                    <div>
                      <span className="font-mono font-bold text-polar-snow group-hover:text-polar-cyan mr-2">
                        {item.id}
                      </span>
                      <span className="text-polar-muted">{item.description}</span>
                    </div>
                    <span className="text-[10px] text-polar-muted font-mono shrink-0 ml-2">
                      {item.status} &rarr;
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Personnel Section */}
          {filteredPersonnel.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-sky-300 font-mono uppercase tracking-widest text-[10px] mb-2">
                <Users className="w-3.5 h-3.5" />
                <span>Personnel &bull; {filteredPersonnel.length}</span>
              </div>
              <div className="space-y-1">
                {filteredPersonnel.map((person) => (
                  <button
                    key={person.id}
                    onClick={() => handleSelect(`/personnel/${person.id}`)}
                    className="w-full flex items-center justify-between p-2 rounded hover:bg-polar-surface/80 text-left transition-colors group"
                  >
                    <div>
                      <span className="font-mono font-bold text-polar-snow group-hover:text-polar-cyan mr-2">
                        {person.id}
                      </span>
                      <span className="text-polar-snow font-medium mr-2">{person.name}</span>
                      <span className="text-polar-muted">({person.role})</span>
                    </div>
                    <span className="text-[10px] text-polar-muted font-mono shrink-0 ml-2">
                      {person.location}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Missions Section */}
          {filteredMissions.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-polar-teal font-mono uppercase tracking-widest text-[10px] mb-2">
                <Compass className="w-3.5 h-3.5" />
                <span>Field Missions &bull; {filteredMissions.length}</span>
              </div>
              <div className="space-y-1">
                {filteredMissions.map((mission) => (
                  <button
                    key={mission.id}
                    onClick={() => handleSelect(`/missions/${mission.id}`)}
                    className="w-full flex items-center justify-between p-2 rounded hover:bg-polar-surface/80 text-left transition-colors group"
                  >
                    <div>
                      <span className="font-mono font-bold text-polar-snow group-hover:text-polar-cyan mr-2">
                        {mission.id}
                      </span>
                      <span className="text-polar-snow font-medium">{mission.title}</span>
                    </div>
                    <span className="text-[10px] text-amber-300 font-mono shrink-0 ml-2">
                      {mission.riskLevel} Risk
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stations Section */}
          {filteredStations.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-polar-gold font-mono uppercase tracking-widest text-[10px] mb-2">
                <MapPin className="w-3.5 h-3.5" />
                <span>Research Stations</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {filteredStations.map((station) => (
                  <button
                    key={station.id}
                    onClick={() => handleSelect(`/operations/map?station=${station.id}`)}
                    className="flex items-center justify-between p-2.5 rounded bg-polar-midnight/60 border border-polar-border hover:border-polar-gold/60 text-left transition-all group"
                  >
                    <div>
                      <span className="text-xs font-bold text-polar-snow block group-hover:text-polar-gold">
                        {station.name}
                      </span>
                      <span className="text-[10px] text-polar-muted">{station.locationName}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-polar-muted group-hover:text-polar-gold group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
