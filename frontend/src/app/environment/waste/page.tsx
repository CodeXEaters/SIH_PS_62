"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Badge, Button } from "@/components/ui";
import { wasteService, WasteRecord, WasteSummary } from "@/services/waste";
import {
  Trash2,
  AlertTriangle,
  Ship,
  CheckCircle2,
  Plus,
  RefreshCw,
  X,
  Filter,
  Shield,
  Flame,
  Archive,
} from "lucide-react";

const WASTE_CATEGORIES = [
  "GENERAL",
  "HAZARDOUS",
  "BIOLOGICAL",
  "CHEMICAL",
  "RADIOACTIVE",
  "ELECTRONIC",
  "RECYCLABLE",
  "SCIENTIFIC",
];

const DISPOSAL_METHODS = [
  "RETROGRADE_SHIPMENT",
  "COMPACTED_STORAGE",
  "INCINERATION",
  "NEUTRALIZATION",
  "AUTOCLAVE",
  "MUNICIPAL_DISPOSAL_PORT",
];

const STATIONS = [
  { id: 4, name: "Bharati Station" },
  { id: 3, name: "Maitri Station" },
  { id: 2, name: "Cape Town Transit Hub" },
  { id: 5, name: "Field Camp Alpha" },
  { id: 6, name: "Field Camp Echo" },
  { id: 1, name: "NCPOR Goa" },
];

export default function WasteManagementPage() {
  const [wasteRecords, setWasteRecords] = useState<WasteRecord[]>([]);
  const [summary, setSummary] = useState<WasteSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stationFilter, setStationFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [hazardousOnly, setHazardousOnly] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [formStationId, setFormStationId] = useState(4);
  const [formCategory, setFormCategory] = useState("GENERAL");
  const [formQuantity, setFormQuantity] = useState("50");
  const [formUnit, setFormUnit] = useState("KG");
  const [formDisposalMethod, setFormDisposalMethod] = useState("RETROGRADE_SHIPMENT");
  const [formStorageLocation, setFormStorageLocation] = useState("Station Waste Compactor Vault");
  const [formHazardous, setFormHazardous] = useState(false);
  const [formNotes, setFormNotes] = useState("");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [records, sum] = await Promise.all([
        wasteService.getWasteRecords(),
        wasteService.getWasteSummary(),
      ]);
      setWasteRecords(records || []);
      setSummary(sum);
    } catch (err) {
      console.warn("Failed to fetch waste records:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(formQuantity);
    if (isNaN(qty) || qty <= 0) {
      setErrorMsg("Quantity must be a positive number");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await wasteService.createWasteRecord({
        station_id: formStationId,
        waste_category: formCategory,
        quantity: qty,
        unit: formUnit,
        disposal_method: formDisposalMethod,
        storage_location: formStorageLocation,
        hazardous: formHazardous,
        notes: formNotes.trim() || undefined,
        status: "STORED",
      });
      setIsModalOpen(false);
      setFormQuantity("50");
      setFormNotes("");
      await fetchData();
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to log waste record");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: number, nextStatus: string) => {
    try {
      await wasteService.updateWasteRecord(id, { status: nextStatus });
      await fetchData();
    } catch (err: any) {
      alert(`Update failed: ${err.message}`);
    }
  };

  const filteredRecords = wasteRecords.filter((r) => {
    if (stationFilter !== "ALL" && r.station_id !== Number(stationFilter)) return false;
    if (categoryFilter !== "ALL" && r.waste_category !== categoryFilter) return false;
    if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
    if (hazardousOnly && !r.hazardous) return false;
    return true;
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "DISPOSED":
        return "success";
      case "TRANSFERRED":
        return "info";
      case "TREATED":
        return "warning";
      case "STORED":
        return "neutral";
      default:
        return "neutral";
    }
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
                MADRID PROTOCOL &bull; ANNEX III WASTE MANAGEMENT
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F5F3EE]">
              ANTARCTIC WASTE REGISTER
            </h1>
            <p className="text-xs sm:text-sm text-[#A5A29C] mt-1">
              Zero-discharge environmental compliance tracking, hazardous segregation, and retrograde cargo manifest.
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
              LOG WASTE BATCH
            </Button>
          </div>
        </div>

        {/* KPI Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-[#141414] border border-[#242424] p-4 rounded-lg">
              <div className="text-[10px] font-mono text-[#888] uppercase flex items-center gap-1.5">
                <Trash2 className="w-3.5 h-3.5 text-[#A5A29C]" /> Total Logged Waste
              </div>
              <div className="text-2xl font-bold font-mono text-[#F5F3EE] mt-1">
                {summary.total_quantity_kg.toFixed(0)} <span className="text-xs text-[#888]">KG</span>
              </div>
              <div className="text-[10px] text-[#A5A29C] mt-1">{summary.total_records} logged batches</div>
            </div>

            <div className="bg-[#141414] border border-[#242424] p-4 rounded-lg">
              <div className="text-[10px] font-mono text-[#E06D6D] uppercase flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-[#E06D6D]" /> Hazardous Vault Storage
              </div>
              <div className="text-2xl font-bold font-mono text-[#E06D6D] mt-1">
                {summary.hazardous_stored_kg.toFixed(0)} <span className="text-xs text-[#888]">KG</span>
              </div>
              <div className="text-[10px] text-[#A5A29C] mt-1">Strict containment protocol</div>
            </div>

            <div className="bg-[#141414] border border-[#242424] p-4 rounded-lg">
              <div className="text-[10px] font-mono text-[#8EB8E5] uppercase flex items-center gap-1.5">
                <Ship className="w-3.5 h-3.5 text-[#8EB8E5]" /> Retrograde Pending
              </div>
              <div className="text-2xl font-bold font-mono text-[#8EB8E5] mt-1">
                {summary.retrograde_pending_kg.toFixed(0)} <span className="text-xs text-[#888]">KG</span>
              </div>
              <div className="text-[10px] text-[#A5A29C] mt-1">Scheduled for vessel return</div>
            </div>

            <div className="bg-[#141414] border border-[#242424] p-4 rounded-lg">
              <div className="text-[10px] font-mono text-[#7FAF91] uppercase flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#7FAF91]" /> Treaty Compliance
              </div>
              <div className="text-lg font-bold font-mono text-[#7FAF91] mt-1">
                {summary.compliance_status}
              </div>
              <div className="text-[10px] text-[#A5A29C] mt-1">Zero continent-discharge</div>
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
            <span className="text-[#6F6D68]">CATEGORY:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-[#1C1C1C] border border-[#333] text-[#F5F3EE] rounded px-2.5 py-1 text-xs focus:outline-none focus:border-[#7FAF91]"
            >
              <option value="ALL">ALL CATEGORIES</option>
              {WASTE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 font-mono">
            <span className="text-[#6F6D68]">STATUS:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#1C1C1C] border border-[#333] text-[#F5F3EE] rounded px-2.5 py-1 text-xs focus:outline-none focus:border-[#7FAF91]"
            >
              <option value="ALL">ALL STATUSES</option>
              <option value="STORED">STORED</option>
              <option value="SEGREGATED">SEGREGATED</option>
              <option value="TREATED">TREATED</option>
              <option value="TRANSFERRED">TRANSFERRED</option>
              <option value="DISPOSED">DISPOSED</option>
            </select>
          </div>

          <label className="flex items-center gap-1.5 font-mono text-xs text-[#CCC] cursor-pointer ml-2">
            <input
              type="checkbox"
              checked={hazardousOnly}
              onChange={(e) => setHazardousOnly(e.target.checked)}
              className="rounded bg-[#1C1C1C] border-[#333] text-[#E06D6D] focus:ring-0"
            />
            <span className="text-[#E06D6D]">HAZARDOUS ONLY</span>
          </label>

          <div className="ml-auto text-xs font-mono text-[#888]">
            Showing <span className="text-[#F5F3EE]">{filteredRecords.length}</span> batches
          </div>
        </div>

        {/* Waste Register Table */}
        <div className="bg-[#141414] border border-[#242424] rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#1C1C1C] border-b border-[#242424] text-[10px] font-mono text-[#888] uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Station</th>
                  <th className="px-4 py-3">Quantity</th>
                  <th className="px-4 py-3">Disposal Method</th>
                  <th className="px-4 py-3">Storage Vault / Location</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#242424]">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-[#888]">
                      No waste records match current filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((rec) => {
                    const stationName =
                      STATIONS.find((s) => s.id === rec.station_id)?.name || `Station #${rec.station_id}`;

                    return (
                      <tr key={rec.id} className="hover:bg-[#1A1A1A] transition-colors">
                        <td className="px-4 py-3 font-mono">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[#F5F3EE]">{rec.waste_category}</span>
                            {rec.hazardous && (
                              <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold rounded bg-[#E06D6D]/20 text-[#E06D6D] border border-[#E06D6D]/30">
                                HAZARD
                              </span>
                            )}
                          </div>
                          {rec.notes && (
                            <div className="text-[10px] text-[#777] max-w-[200px] truncate" title={rec.notes}>
                              {rec.notes}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-[#CCC]">{stationName}</td>
                        <td className="px-4 py-3 font-mono text-[#F5F3EE] font-bold">
                          {rec.quantity.toFixed(1)} {rec.unit}
                        </td>
                        <td className="px-4 py-3 font-mono text-[#A5A29C]">
                          {rec.disposal_method.replace(/_/g, " ")}
                        </td>
                        <td className="px-4 py-3 text-[#A5A29C]">{rec.storage_location}</td>
                        <td className="px-4 py-3">
                          <Badge variant={getStatusBadgeVariant(rec.status) as any}>
                            {rec.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {rec.status === "STORED" && (
                              <button
                                onClick={() => handleUpdateStatus(rec.id, "TRANSFERRED")}
                                className="px-2 py-0.5 text-[10px] font-mono rounded bg-[#8EB8E5]/20 text-[#8EB8E5] hover:bg-[#8EB8E5]/40"
                              >
                                RETROGRADE
                              </button>
                            )}
                            {rec.status === "TRANSFERRED" && (
                              <button
                                onClick={() => handleUpdateStatus(rec.id, "DISPOSED")}
                                className="px-2 py-0.5 text-[10px] font-mono rounded bg-[#2D6A4F]/30 text-[#7FAF91] hover:bg-[#2D6A4F]/60"
                              >
                                CONFIRM
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

        {/* Modal: Log Waste Batch */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#141414] border border-[#282828] rounded-xl max-w-xl w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#242424] pb-3">
                <div className="flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-[#7FAF91]" />
                  <h2 className="text-lg font-bold text-[#F5F3EE]">Log Antarctic Waste Batch</h2>
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

              <form onSubmit={handleCreateRecord} className="space-y-4 text-xs font-sans">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono text-[#888] mb-1">
                      STATION
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

                  <div>
                    <label className="block text-[10px] font-mono text-[#888] mb-1">
                      WASTE CATEGORY
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full bg-[#1C1C1C] border border-[#333] rounded px-3 py-1.5 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#7FAF91]"
                    >
                      {WASTE_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono text-[#888] mb-1">
                      QUANTITY
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={formQuantity}
                      onChange={(e) => setFormQuantity(e.target.value)}
                      className="w-full bg-[#1C1C1C] border border-[#333] rounded px-3 py-1.5 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#7FAF91]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-[#888] mb-1">
                      UNIT
                    </label>
                    <select
                      value={formUnit}
                      onChange={(e) => setFormUnit(e.target.value)}
                      className="w-full bg-[#1C1C1C] border border-[#333] rounded px-3 py-1.5 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#7FAF91]"
                    >
                      <option value="KG">Kilograms (KG)</option>
                      <option value="L">Liters (L)</option>
                      <option value="DRUMS">Drums (200L)</option>
                      <option value="CYLINDERS">Gas Cylinders</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono text-[#888] mb-1">
                      DISPOSAL / RETROGRADE METHOD
                    </label>
                    <select
                      value={formDisposalMethod}
                      onChange={(e) => setFormDisposalMethod(e.target.value)}
                      className="w-full bg-[#1C1C1C] border border-[#333] rounded px-3 py-1.5 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#7FAF91]"
                    >
                      {DISPOSAL_METHODS.map((m) => (
                        <option key={m} value={m}>
                          {m.replace(/_/g, " ")}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-[#888] mb-1">
                      STORAGE LOCATION / VAULT
                    </label>
                    <input
                      type="text"
                      value={formStorageLocation}
                      onChange={(e) => setFormStorageLocation(e.target.value)}
                      className="w-full bg-[#1C1C1C] border border-[#333] rounded px-3 py-1.5 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#7FAF91]"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="hazardCheckbox"
                    checked={formHazardous}
                    onChange={(e) => setFormHazardous(e.target.checked)}
                    className="rounded bg-[#1C1C1C] border-[#333] text-[#E06D6D] focus:ring-0"
                  />
                  <label htmlFor="hazardCheckbox" className="text-xs text-[#F5F3EE] cursor-pointer font-mono">
                    Classify as Hazardous (Chemical / Fuel / Biological / Medical)
                  </label>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-[#888] mb-1">
                    MANIFEST NOTES / DESCRIPTIONS
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Spent lithium battery bank packaged in hermetic steel container."
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
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
                    {isSubmitting ? "LOGGING..." : "LOG BATCH"}
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
