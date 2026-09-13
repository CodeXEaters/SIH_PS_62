"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search, ArrowRight } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Badge, Button, Input } from "@/components/ui";
import { personnelService } from "@/services/personnel";
import { Personnel } from "@/types";

function normalizeStatusParam(param: string | null | undefined): string {
  if (!param) return "ALL";
  const s = param.toLowerCase().trim();
  if (s === "active-deployed" || s === "active_deployed" || s === "active-and-mission" || s === "deployed") {
    return "active-deployed";
  }
  if (s === "active") return "Active";
  if (s === "on-mission" || s === "on_mission" || s === "on mission") return "On Mission";
  if (s === "at-station" || s === "at_station" || s === "at station") return "At Station";
  if (s === "in-transit" || s === "in_transit" || s === "in transit") return "In Transit";
  if (s === "emergency") return "Emergency";
  return "ALL";
}

function PersonnelContent() {
  const searchParams = useSearchParams();
  const rawStatus = searchParams?.get("status");

  const [personnelList, setPersonnelList] = useState<Personnel[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(() => normalizeStatusParam(rawStatus));
  const [stationFilter, setStationFilter] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setStatusFilter(normalizeStatusParam(rawStatus));
  }, [rawStatus]);

  const handleStatusFilterChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (newStatus === "ALL") {
        url.searchParams.delete("status");
      } else {
        url.searchParams.set("status", newStatus);
      }
      window.history.replaceState(null, "", url.toString());
    }
  };

  const fetchPersonnel = () => {
    setIsLoading(true);
    personnelService
      .getAllPersonnel()
      .then((data) => {
        setPersonnelList(data || []);
      })
      .catch((err) => console.warn("Failed to fetch personnel:", err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchPersonnel();
  }, []);

  const filtered = personnelList.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase()) ||
      p.role.toLowerCase().includes(search.toLowerCase()) ||
      p.team.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = (() => {
      if (statusFilter === "ALL") return true;
      const s = String(p.status ?? "").toUpperCase().trim();
      if (statusFilter === "active-deployed") {
        return s === "ACTIVE" || s === "ON MISSION" || s === "ON_MISSION";
      }
      return p.status === statusFilter || s === statusFilter.toUpperCase().trim();
    })();

    const matchesStation =
      stationFilter === "ALL" ||
      p.stationSlug === stationFilter ||
      String(p.stationId) === stationFilter;

    return matchesSearch && matchesStatus && matchesStation;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#242424] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#7FAF91]" />
            <span className="text-[10px] font-mono tracking-[0.25em] text-[#C8C8C5] uppercase font-semibold">
              EXPEDITION REGISTRY &bull; 46TH ISEA
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F5F3EE]">
            PERSONNEL
          </h1>
          <p className="text-xs sm:text-sm text-[#A5A29C] mt-1">
            Official expedition roster: medical clearances, survival certifications, and check-in logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/personnel/movement">
            <Button variant="secondary" size="sm" className="font-mono text-xs">
              <span>Movement Logs</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded bg-[#0A0A0A] border border-[#242424] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-80">
          <Input
            type="text"
            placeholder="Search personnel by name, ID, scientific role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="text-[#6F6D68]">STATION:</span>
            <select
              value={stationFilter}
              onChange={(e) => setStationFilter(e.target.value)}
              className="bg-[#101010] border border-[#242424] rounded px-2.5 py-1 text-[#F5F3EE] text-xs focus:outline-none focus:border-[#C8A96B]"
            >
              <option value="ALL">ALL</option>
              <option value="bharati">BHARATI</option>
              <option value="maitri">MAITRI</option>
              <option value="transit">TRANSIT</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[#6F6D68]">STATUS:</span>
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilterChange(e.target.value)}
              className="bg-[#101010] border border-[#242424] rounded px-2.5 py-1 text-[#F5F3EE] text-xs focus:outline-none focus:border-[#C8A96B]"
            >
              <option value="ALL">ALL</option>
              <option value="active-deployed">ACTIVE + ON MISSION</option>
              <option value="Active">ACTIVE</option>
              <option value="On Mission">ON MISSION</option>
              <option value="At Station">AT STATION</option>
              <option value="In Transit">IN TRANSIT</option>
              <option value="Emergency">EMERGENCY</option>
            </select>
          </div>
        </div>
      </div>

      {/* Serious Expedition Registry Table */}
      <div className="rounded bg-[#101010] border border-[#242424] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[#242424] bg-[#0A0A0A] text-[#6F6D68] text-[9px] uppercase tracking-wider">
                <th className="py-3 px-4">NAME</th>
                <th className="py-3 px-4">ROLE</th>
                <th className="py-3 px-4">TEAM</th>
                <th className="py-3 px-4">LOCATION</th>
                <th className="py-3 px-4">STATUS</th>
                <th className="py-3 px-4">MEDICAL</th>
                <th className="py-3 px-4">TRAINING</th>
                <th className="py-3 px-4">LAST CHECK-IN</th>
                <th className="py-3 px-4 text-right">DOSSIER</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#242424]/60 text-[#A5A29C]">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-[#6F6D68] font-mono">
                    LOADING EXPEDITION PERSONNEL ROSTER...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-[#6F6D68] font-mono">
                    NO PERSONNEL RECORDS FOUND
                  </td>
                </tr>
              ) : (
                filtered.map((person) => (
                  <tr key={person.id} className="hover:bg-[#111111] transition-colors">
                    <td className="py-3.5 px-4 font-sans font-bold text-[#F5F3EE] whitespace-nowrap">
                      {person.name}
                      <span className="block font-mono text-[10px] text-[#6F6D68] font-normal">
                        {person.id}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-sans text-[#F5F3EE]">
                      {person.role}
                    </td>

                    <td className="py-3.5 px-4 text-[#A5A29C]">
                      {person.team}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[#C8A96B] font-medium">
                      {person.location}
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          person.status === "Emergency"
                            ? "danger"
                            : person.status === "On Mission"
                            ? "warning"
                            : "success"
                        }
                        dot
                      >
                        {person.status}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 text-[#7FAF91] font-bold">
                      {person.medicalClearance}
                    </td>

                    <td className="py-3.5 px-4 text-[#A5A29C]">
                      {person.trainingStatus.replace("_", " ")}
                    </td>

                    <td className="py-3.5 px-4 text-[#6F6D68]">
                      {person.lastCheckIn}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Link href={`/personnel/${person.id}`}>
                        <Button variant="secondary" size="sm" className="font-mono text-xs h-7 px-2">
                          <span>View</span>
                          <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function PersonnelPage() {
  return (
    <AppShell>
      <Suspense
        fallback={
          <div className="p-8 text-center text-[#6F6D68] font-mono">
            LOADING EXPEDITION PERSONNEL ROSTER...
          </div>
        }
      >
        <PersonnelContent />
      </Suspense>
    </AppShell>
  );
}
