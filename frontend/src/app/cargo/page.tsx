"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Search,
  QrCode,
  FileSpreadsheet,
  ArrowRight,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Badge, Button, Input } from "@/components/ui";
import { mockCargoItems } from "@/data/mock";

export default function CargoDashboardPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const filteredCargo = mockCargoItems.filter((c) => {
    const matchesSearch =
      c.id.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase()) ||
      c.owner.toLowerCase().includes(search.toLowerCase()) ||
      c.destination.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#242424] pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C8A96B]" />
              <span className="text-[10px] font-mono tracking-[0.25em] text-[#C8C8C5] uppercase font-semibold">
                LOGISTICS MANAGEMENT &bull; 46TH ISEA
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F5F3EE]">
              CARGO &amp; MANIFEST DASHBOARD
            </h1>
            <p className="text-xs sm:text-sm text-[#A5A29C] mt-1">
              Multi-modal tracking from Goa and Cape Town to Maitri and Bharati stations.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link href="/cargo/scanner">
              <Button variant="primary" size="sm" className="gap-2 font-mono text-xs">
                <QrCode className="w-3.5 h-3.5" />
                <span>QR Scanner</span>
              </Button>
            </Link>
            <Link href="/cargo/chain-of-custody">
              <Button variant="secondary" size="sm" className="gap-2 font-mono text-xs">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Chain of Custody</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-4 rounded bg-[#0A0A0A] border border-[#242424] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="w-full sm:w-80">
            <Input
              type="text"
              placeholder="Filter by Cargo ID, description, consignee..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-[#6F6D68]">STATUS:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#101010] border border-[#242424] rounded px-3 py-1 text-[#F5F3EE] text-xs focus:outline-none focus:border-[#C8A96B]"
            >
              <option value="ALL">ALL STATUSES</option>
              <option value="Delayed">DELAYED</option>
              <option value="In Transit">IN TRANSIT</option>
              <option value="Received">RECEIVED</option>
            </select>
          </div>
        </div>

        {/* Extremely Clean Data Table: CARGO ID | DESCRIPTION | DESTINATION | STATUS | ETA | RISK */}
        <div className="rounded bg-[#101010] border border-[#242424] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-[#242424] bg-[#0A0A0A] text-[#6F6D68] text-[9px] uppercase tracking-wider">
                  <th className="py-3 px-4">CARGO ID</th>
                  <th className="py-3 px-4">DESCRIPTION</th>
                  <th className="py-3 px-4">DESTINATION</th>
                  <th className="py-3 px-4">STATUS</th>
                  <th className="py-3 px-4">ETA</th>
                  <th className="py-3 px-4">RISK</th>
                  <th className="py-3 px-4 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#242424]/60 text-[#A5A29C]">
                {filteredCargo.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-[#111111] transition-colors cursor-pointer"
                    onClick={() => window.location.href = `/cargo/${item.id}`}
                  >
                    <td className="py-3.5 px-4 font-bold text-[#F5F3EE] whitespace-nowrap">
                      {item.id}
                    </td>

                    <td className="py-3.5 px-4 font-sans text-[#F5F3EE] max-w-[240px] truncate">
                      {item.description}
                      <span className="block font-mono text-[10px] text-[#6F6D68]">
                        {item.owner} &bull; {item.weightKg} kg
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-[#F5F3EE]">
                      {item.destination}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="flex items-center gap-1.5">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            item.status === "Delayed"
                              ? "bg-[#C49A55]"
                              : item.status === "Received"
                              ? "bg-[#7FAF91]"
                              : "bg-[#C8C8C5]"
                          }`}
                        />
                        <span>{item.status.toUpperCase()}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-[#6F6D68]">
                      {item.eta}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={
                          item.riskLevel === "CRITICAL"
                            ? "text-[#B85C5C] font-bold"
                            : item.riskLevel === "HIGH"
                            ? "text-[#C49A55]"
                            : "text-[#6F6D68]"
                        }
                      >
                        {item.riskLevel}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <Link href={`/cargo/${item.id}`}>
                        <Button variant="secondary" size="sm" className="font-mono text-xs h-7 px-2">
                          <span>Twin</span>
                          <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
