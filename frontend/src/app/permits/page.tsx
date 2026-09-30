"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Badge, Button } from "@/components/ui";
import { permitsService, Permit, PermitSummary } from "@/services/permits";
import {
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Shield,
  Plus,
  RefreshCw,
  X,
  Filter,
} from "lucide-react";

const PERMIT_TYPES = [
  "SCIENTIFIC_RESEARCH",
  "WASTE_MANAGEMENT",
  "WILDLIFE_ACCESS",
  "DRONE_OPERATIONS",
  "FUEL_STORAGE",
  "CREVASSE_ZONE_ENTRY",
];

const STATIONS = [
  { id: 1, name: "NCPOR Goa" },
  { id: 2, name: "Cape Town Transit Hub" },
  { id: 3, name: "Maitri Station" },
  { id: 4, name: "Bharati Station" },
  { id: 5, name: "Field Camp Alpha" },
  { id: 6, name: "Field Camp Echo" },
];

export default function PermitsPage() {
  const [permits, setPermits] = useState<Permit[]>([]);
  const [summary, setSummary] = useState<PermitSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [stationFilter, setStationFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [formNumber, setFormNumber] = useState("");
  const [formType, setFormType] = useState("SCIENTIFIC_RESEARCH");
  const [formAuthority, setFormAuthority] = useState("NCPOR / Ministry of Earth Sciences");
  const [formStationId, setFormStationId] = useState(4);
  const [formIssueDate, setFormIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [formExpiryDate, setFormExpiryDate] = useState(
    new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [formOfficer, setFormOfficer] = useState("");
  const [formConditions, setFormConditions] = useState("");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [permitsData, summaryData] = await Promise.all([
        permitsService.getPermits(),
        permitsService.getPermitSummary(),
      ]);
      setPermits(permitsData || []);
      setSummary(summaryData);
    } catch (err) {
      console.warn("Failed to fetch permits data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreatePermit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formOfficer.trim()) {
      setErrorMsg("Responsible Officer is required");
      return;
    }
    if (new Date(formExpiryDate) < new Date(formIssueDate)) {
      setErrorMsg("Expiry Date must be after Issue Date");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await permitsService.createPermit({
        permit_number: formNumber.trim() ? formNumber.trim() : undefined,
        permit_type: formType,
        issuing_authority: formAuthority,
        station_id: formStationId,
        expedition_id: "46-isea",
        issue_date: new Date(formIssueDate).toISOString(),
        expiry_date: new Date(formExpiryDate).toISOString(),
        responsible_officer: formOfficer.trim(),
        conditions: formConditions.trim() || undefined,
        status: "APPROVED",
      });
      setIsModalOpen(false);
      setFormNumber("");
      setFormOfficer("");
      setFormConditions("");
      await fetchData();
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to issue permit");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusUpdate = async (id: number, newStatus: string) => {
    try {
      await permitsService.updatePermitStatus(id, newStatus);
      await fetchData();
    } catch (err: any) {
      alert(`Status update failed: ${err.message}`);
    }
  };

  const filteredPermits = permits.filter((p) => {
    if (statusFilter !== "ALL" && p.status !== statusFilter) return false;
    if (stationFilter !== "ALL" && p.station_id !== Number(stationFilter)) return false;
    if (typeFilter !== "ALL" && p.permit_type !== typeFilter) return false;
    return true;
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "success";
      case "EXPIRING":
        return "warning";
      case "EXPIRED":
        return "danger";
      case "PENDING":
        return "info";
      default:
        return "neutral";
    }
  };

  const calculateDaysRemaining = (expiryDateStr: string) => {
    const expiry = new Date(expiryDateStr);
    const now = new Date();
    const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <AppShell>
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#242424] pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Shield className="w-4 h-4 text-[#7FAF91]" />
              <span className="text-[10px] font-mono tracking-[0.25em] text-[#C8C8C5] uppercase font-semibold">
                ANTARCTIC TREATY &bull; ENVIRONMENTAL PROTOCOL COMPLIANCE
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F5F3EE]">
              PERMIT COMPLIANCE REGISTER
            </h1>
            <p className="text-xs sm:text-sm text-[#A5A29C] mt-1">
              Scientific research authorizations, waste retrograde manifests, and ASPA/ASMA access permits.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              disabled={isLoading}
              className="border-[#333] hover:border-[#555] text-xs font-mono"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
              REFRESH
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className="bg-[#2D6A4F] hover:bg-[#3B8A65] text-xs font-mono text-white"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              REGISTER PERMIT
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-[#141414] border border-[#242424] p-4 rounded-lg">
              <div className="text-[10px] font-mono text-[#888] uppercase">Total Permits</div>
              <div className="text-2xl font-bold font-mono text-[#F5F3EE] mt-1">{summary.total}</div>
              <div className="text-[10px] text-[#A5A29C] mt-1">Active portfolio</div>
            </div>
            <div className="bg-[#141414] border border-[#242424] p-4 rounded-lg">
              <div className="text-[10px] font-mono text-[#7FAF91] uppercase flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Approved
              </div>
              <div className="text-2xl font-bold font-mono text-[#7FAF91] mt-1">{summary.approved}</div>
              <div className="text-[10px] text-[#A5A29C] mt-1">Clear for operations</div>
            </div>
            <div className="bg-[#141414] border border-[#242424] p-4 rounded-lg">
              <div className="text-[10px] font-mono text-[#E0A96D] uppercase flex items-center gap-1">
                <Clock className="w-3 h-3" /> Expiring Soon
              </div>
              <div className="text-2xl font-bold font-mono text-[#E0A96D] mt-1">{summary.expiring_soon}</div>
              <div className="text-[10px] text-[#A5A29C] mt-1">&lt; 30-day window</div>
            </div>
            <div className="bg-[#141414] border border-[#242424] p-4 rounded-lg">
              <div className="text-[10px] font-mono text-[#E06D6D] uppercase flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Expired
              </div>
              <div className="text-2xl font-bold font-mono text-[#E06D6D] mt-1">{summary.expired}</div>
              <div className="text-[10px] text-[#A5A29C] mt-1">Action required</div>
            </div>
            <div className="bg-[#141414] border border-[#242424] p-4 rounded-lg">
              <div className="text-[10px] font-mono text-[#8EB8E5] uppercase">Pending</div>
              <div className="text-2xl font-bold font-mono text-[#8EB8E5] mt-1">{summary.pending}</div>
              <div className="text-[10px] text-[#A5A29C] mt-1">Awaiting review</div>
            </div>
          </div>
        )}

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3 bg-[#141414] border border-[#242424] p-3 rounded-lg text-xs">
          <div className="flex items-center gap-1 text-[#888] font-mono mr-2">
            <Filter className="w-3.5 h-3.5" />
            <span>FILTERS:</span>
          </div>

          <div className="flex items-center gap-1.5 font-mono">
            <span className="text-[#6F6D68]">STATUS:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#1C1C1C] border border-[#333] text-[#F5F3EE] rounded px-2.5 py-1 text-xs focus:outline-none focus:border-[#7FAF91]"
            >
              <option value="ALL">ALL STATUSES</option>
              <option value="APPROVED">APPROVED</option>
              <option value="EXPIRING">EXPIRING (&lt;30D)</option>
              <option value="EXPIRED">EXPIRED</option>
              <option value="PENDING">PENDING</option>
              <option value="SUSPENDED">SUSPENDED</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 font-mono">
            <span className="text-[#6F6D68]">STATION:</span>
            <select
              value={stationFilter}
              onChange={(e) => setStationFilter(e.target.value)}
              className="bg-[#1C1C1C] border border-[#333] text-[#F5F3EE] rounded px-2.5 py-1 text-xs focus:outline-none focus:border-[#7FAF91]"
            >
              <option value="ALL">ALL STATIONS</option>
              {STATIONS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 font-mono">
            <span className="text-[#6F6D68]">TYPE:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-[#1C1C1C] border border-[#333] text-[#F5F3EE] rounded px-2.5 py-1 text-xs focus:outline-none focus:border-[#7FAF91]"
            >
              <option value="ALL">ALL TYPES</option>
              {PERMIT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>

          <div className="ml-auto text-xs font-mono text-[#888]">
            Showing <span className="text-[#F5F3EE]">{filteredPermits.length}</span> permits
          </div>
        </div>

        {/* Permits Table */}
        <div className="bg-[#141414] border border-[#242424] rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#1C1C1C] border-b border-[#242424] text-[10px] font-mono text-[#888] uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Permit No</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Issuing Authority</th>
                  <th className="px-4 py-3">Station</th>
                  <th className="px-4 py-3">Validity Window</th>
                  <th className="px-4 py-3">Responsible</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#242424]">
                {filteredPermits.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-[#888]">
                      No permits found matching current filters.
                    </td>
                  </tr>
                ) : (
                  filteredPermits.map((p) => {
                    const daysRemaining = calculateDaysRemaining(p.expiry_date);
                    const stationName =
                      STATIONS.find((s) => s.id === p.station_id)?.name || `Station #${p.station_id || "All"}`;

                    return (
                      <tr key={p.id} className="hover:bg-[#1A1A1A] transition-colors">
                        <td className="px-4 py-3 font-mono font-medium text-[#F5F3EE]">
                          <div className="flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-[#8EB8E5]" />
                            <span>{p.permit_number}</span>
                          </div>
                          {p.expedition_id && (
                            <span className="text-[10px] text-[#6F6D68]">Exp: {p.expedition_id}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-[11px] text-[#CCC]">
                            {p.permit_type.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#A5A29C] max-w-[160px] truncate" title={p.issuing_authority}>
                          {p.issuing_authority}
                        </td>
                        <td className="px-4 py-3 text-[#CCC] font-mono">{stationName}</td>
                        <td className="px-4 py-3">
                          <div className="font-mono text-[11px] text-[#CCC]">
                            {new Date(p.expiry_date).toLocaleDateString()}
                          </div>
                          <div className="text-[10px]">
                            {daysRemaining < 0 ? (
                              <span className="text-[#E06D6D]">Expired {Math.abs(daysRemaining)}d ago</span>
                            ) : daysRemaining <= 30 ? (
                              <span className="text-[#E0A96D]">{daysRemaining} days left</span>
                            ) : (
                              <span className="text-[#7FAF91]">{daysRemaining} days valid</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[#A5A29C]">{p.responsible_officer}</td>
                        <td className="px-4 py-3">
                          <Badge variant={getStatusBadgeVariant(p.status) as any}>
                            {p.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {p.status === "PENDING" && (
                              <button
                                onClick={() => handleStatusUpdate(p.id, "APPROVED")}
                                className="px-2 py-0.5 text-[10px] font-mono rounded bg-[#2D6A4F]/30 text-[#7FAF91] hover:bg-[#2D6A4F]/60"
                              >
                                APPROVE
                              </button>
                            )}
                            {p.status === "APPROVED" && (
                              <button
                                onClick={() => handleStatusUpdate(p.id, "SUSPENDED")}
                                className="px-2 py-0.5 text-[10px] font-mono rounded bg-[#E06D6D]/20 text-[#E06D6D] hover:bg-[#E06D6D]/40"
                              >
                                SUSPEND
                              </button>
                            )}
                            {p.status === "SUSPENDED" && (
                              <button
                                onClick={() => handleStatusUpdate(p.id, "APPROVED")}
                                className="px-2 py-0.5 text-[10px] font-mono rounded bg-[#2D6A4F]/30 text-[#7FAF91] hover:bg-[#2D6A4F]/60"
                              >
                                REINSTATE
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Register / Issue Permit */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#141414] border border-[#282828] rounded-xl max-w-xl w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#242424] pb-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-[#7FAF91]" />
                  <h2 className="text-lg font-bold text-[#F5F3EE]">Issue / Register Compliance Permit</h2>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-[#888] hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {errorMsg && (
                <div className="p-3 bg-[#E06D6D]/10 border border-[#E06D6D]/40 rounded text-xs text-[#E06D6D]">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleCreatePermit} className="space-y-4 text-xs font-sans">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono text-[#888] mb-1">
                      PERMIT NUMBER (OPTIONAL)
                    </label>
                    <input
                      type="text"
                      placeholder="Auto-generated if blank"
                      value={formNumber}
                      onChange={(e) => setFormNumber(e.target.value)}
                      className="w-full bg-[#1C1C1C] border border-[#333] rounded px-3 py-1.5 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#7FAF91]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-[#888] mb-1">
                      PERMIT TYPE
                    </label>
                    <select
                      value={formType}
                      onChange={(e) => setFormType(e.target.value)}
                      className="w-full bg-[#1C1C1C] border border-[#333] rounded px-3 py-1.5 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#7FAF91]"
                    >
                      {PERMIT_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t.replace(/_/g, " ")}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono text-[#888] mb-1">
                      ISSUING AUTHORITY
                    </label>
                    <input
                      type="text"
                      value={formAuthority}
                      onChange={(e) => setFormAuthority(e.target.value)}
                      className="w-full bg-[#1C1C1C] border border-[#333] rounded px-3 py-1.5 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#7FAF91]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-[#888] mb-1">
                      STATION JURISDICTION
                    </label>
                    <select
                      value={formStationId}
                      onChange={(e) => setFormStationId(Number(e.target.value))}
                      className="w-full bg-[#1C1C1C] border border-[#333] rounded px-3 py-1.5 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#7FAF91]"
                    >
                      {STATIONS.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono text-[#888] mb-1">
                      ISSUE DATE
                    </label>
                    <input
                      type="date"
                      value={formIssueDate}
                      onChange={(e) => setFormIssueDate(e.target.value)}
                      className="w-full bg-[#1C1C1C] border border-[#333] rounded px-3 py-1.5 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#7FAF91]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-[#888] mb-1">
                      EXPIRY DATE
                    </label>
                    <input
                      type="date"
                      value={formExpiryDate}
                      onChange={(e) => setFormExpiryDate(e.target.value)}
                      className="w-full bg-[#1C1C1C] border border-[#333] rounded px-3 py-1.5 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#7FAF91]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-[#888] mb-1">
                    RESPONSIBLE OFFICER
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Anand Sen / Chief Logistics Officer"
                    value={formOfficer}
                    onChange={(e) => setFormOfficer(e.target.value)}
                    className="w-full bg-[#1C1C1C] border border-[#333] rounded px-3 py-1.5 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#7FAF91]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-[#888] mb-1">
                    PERMIT CONDITIONS & SAFEGUARDS
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Minimum 100m standoff distance from seal colonies; zero fuel discharge protocol."
                    value={formConditions}
                    onChange={(e) => setFormConditions(e.target.value)}
                    className="w-full bg-[#1C1C1C] border border-[#333] rounded px-3 py-1.5 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#7FAF91]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-[#242424]">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsModalOpen(false)}
                    className="text-xs font-mono"
                  >
                    CANCEL
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={isSubmitting}
                    className="bg-[#2D6A4F] hover:bg-[#3B8A65] text-white text-xs font-mono"
                  >
                    {isSubmitting ? "REGISTERING..." : "REGISTER PERMIT"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
