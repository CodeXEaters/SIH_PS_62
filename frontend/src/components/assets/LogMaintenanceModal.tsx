"use client";

import React, { useState, useEffect } from "react";
import { Wrench, CheckCircle2, AlertTriangle, X } from "lucide-react";
import { Modal, Button, Input, Badge } from "@/components/ui";
import { assetsService } from "@/services/assets";
import { Asset } from "@/types";

interface LogMaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAssetId?: string;
  onMaintenanceLogged?: (asset: Asset) => void;
}

export const LogMaintenanceModal: React.FC<LogMaintenanceModalProps> = ({
  isOpen,
  onClose,
  selectedAssetId,
  onMaintenanceLogged,
}) => {
  const [assetList, setAssetList] = useState<Asset[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [updatedAsset, setUpdatedAsset] = useState<Asset | null>(null);

  // Form State
  const [assetId, setAssetId] = useState<string>(selectedAssetId || "");
  const [maintenanceType, setMaintenanceType] = useState<string>("SCHEDULED_INSPECTION");
  const [statusAfter, setStatusAfter] = useState<string>("OPERATIONAL");
  const [healthScore, setHealthScore] = useState<string>("100");
  const [nextMaintenanceDate, setNextMaintenanceDate] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      assetsService.getAllAssets().then((items) => {
        setAssetList(items);
        if (!selectedAssetId && items.length > 0) {
          setAssetId(items[0].id);
        } else if (selectedAssetId) {
          setAssetId(selectedAssetId);
        }
      }).catch(console.warn);

      // Default next maintenance: 90 days from now
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + 90);
      setNextMaintenanceDate(nextDate.toISOString().split("T")[0]);

      setUpdatedAsset(null);
      setSubmitError(null);
    }
  }, [isOpen, selectedAssetId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!assetId) {
      setSubmitError("Please select an asset to record maintenance for.");
      return;
    }

    setIsSubmitting(true);
    try {
      const asset = await assetsService.logMaintenance(assetId, {
        status: statusAfter,
        health_score: parseFloat(healthScore) || 100.0,
        last_maintenance: new Date().toISOString().split("T")[0],
        next_maintenance: nextMaintenanceDate || undefined,
        notes: notes.trim() || undefined,
      });

      setUpdatedAsset(asset);
      if (onMaintenanceLogged) onMaintenanceLogged(asset);
    } catch (err: any) {
      setSubmitError(err?.message || "Failed to log maintenance event with asset service.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setUpdatedAsset(null);
    setSubmitError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="LOG POLAR ASSET OVERHAUL & MAINTENANCE">
      {updatedAsset ? (
        <div className="space-y-5 py-2">
          <div className="p-4 bg-[#0A160C] border border-[#7FAF91]/40 rounded flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#7FAF91] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-[#F5F3EE]">Maintenance Overhaul Recorded</h4>
              <p className="text-xs text-[#A5A29C] mt-1">
                Asset <span className="font-mono text-[#F5F3EE]">{updatedAsset.name}</span> health recertified to {updatedAsset.batteryHealthPct}%.
              </p>
            </div>
          </div>

          <div className="bg-[#121212] border border-[#242424] p-4 rounded space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-[#242424]">
              <span className="text-[#6F6D68]">ASSET:</span>
              <span className="text-[#C8A96B] font-bold">AST-{updatedAsset.id}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-[#242424]">
              <span className="text-[#6F6D68]">UPDATED STATUS:</span>
              <Badge variant="outline" className="text-[#7FAF91] border-[#7FAF91]/30">{updatedAsset.condition}</Badge>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-[#242424]">
              <span className="text-[#6F6D68]">NEXT SCHEDULED SERVICE:</span>
              <span className="text-[#F5F3EE]">{updatedAsset.nextMaintenance}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={handleClose}>Close</Button>
            <Button
              variant="primary"
              onClick={() => {
                handleClose();
                window.location.reload();
              }}
            >
              Done & Refresh
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {submitError && (
            <div className="p-3 bg-[#1A0A0A] border border-[#B85C5C]/50 rounded flex items-center gap-2.5 text-xs text-[#E87A7A]">
              <AlertTriangle className="w-4 h-4 shrink-0 text-[#B85C5C]" />
              <span>{submitError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-mono uppercase text-[#A5A29C] mb-1.5">
              Select Polar Asset *
            </label>
            <select
              value={assetId}
              onChange={(e) => setAssetId(e.target.value)}
              className="w-full bg-[#121212] border border-[#2A2A2A] rounded px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#C8A96B]"
              required
            >
              {assetList.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.category} &bull; Condition: {a.condition})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase text-[#A5A29C] mb-1.5">Maintenance Protocol</label>
              <select
                value={maintenanceType}
                onChange={(e) => setMaintenanceType(e.target.value)}
                className="w-full bg-[#121212] border border-[#2A2A2A] rounded px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#C8A96B]"
              >
                <option value="SCHEDULED_INSPECTION">Scheduled Polar A-Check Inspection</option>
                <option value="ENGINE_OVERHAUL">Sub-Zero Engine & Pre-Heater Overhaul</option>
                <option value="HYDRAULIC_FLUSH">Hydraulic Fluid & Track System Flush</option>
                <option value="BATTERY_REPLACEMENT">Deep-Cycle Battery Bank Replacement</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-[#A5A29C] mb-1.5">Post-Service Status</label>
              <select
                value={statusAfter}
                onChange={(e) => setStatusAfter(e.target.value)}
                className="w-full bg-[#121212] border border-[#2A2A2A] rounded px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#C8A96B]"
              >
                <option value="OPERATIONAL">OPERATIONAL (Cleared for Traversing)</option>
                <option value="MAINTENANCE_REQUIRED">MAINTENANCE_REQUIRED (Secondary Review)</option>
                <option value="IN_REPAIR">IN_REPAIR (Awaiting Spare Parts)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase text-[#A5A29C] mb-1.5">Restored Health Score (0 - 100)</label>
              <Input
                type="number"
                min="0"
                max="100"
                value={healthScore}
                onChange={(e) => setHealthScore(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-[#A5A29C] mb-1.5">Next Service Due Date</label>
              <Input
                type="date"
                value={nextMaintenanceDate}
                onChange={(e) => setNextMaintenanceDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-[#A5A29C] mb-1.5">Technician Log & Diagnostic Notes</label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Cleaned fuel injectors, pressure tested coolant loop at -45C chamber"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-[#1E1E1E]">
            <Button type="button" variant="secondary" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? "Logging Service..." : "Certify & Save Maintenance"}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
