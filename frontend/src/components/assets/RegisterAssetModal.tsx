"use client";

import React, { useState, useEffect } from "react";
import { Truck, CheckCircle2, AlertTriangle, QrCode } from "lucide-react";
import { Modal, Button, Input, Badge } from "@/components/ui";
import { assetsService } from "@/services/assets";
import { stationsService } from "@/services/stations";
import { Station, Asset } from "@/types";

interface RegisterAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssetCreated?: (asset: Asset) => void;
}

const ASSET_TYPES = [
  { value: "VEHICLE", label: "Polar Vehicle (PistenBully Snowcat / Skidoo / Crane)" },
  { value: "GENERATOR", label: "Power Generation (Caterpillar Heavy Marine Genset)" },
  { value: "COMMS", label: "Communications (Iridium / Inmarsat / HF Radio)" },
  { value: "MEDICAL", label: "Medical Life Support (Ventilator / Defibrillator / Hyperbaric)" },
  { value: "SCIENTIFIC_INSTRUMENT", label: "Scientific Research (LIDAR / Seismometer / Mass Spec)" },
] as const;

export const RegisterAssetModal: React.FC<RegisterAssetModalProps> = ({
  isOpen,
  onClose,
  onAssetCreated,
}) => {
  const [stations, setStations] = useState<Station[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdAsset, setCreatedAsset] = useState<Asset | null>(null);

  // Form State
  const [assetName, setAssetName] = useState("");
  const [assetType, setAssetType] = useState<string>("VEHICLE");
  const [stationId, setStationId] = useState<number>(4);
  const [location, setLocation] = useState("Vehicle Hangar Bay A");
  const [status, setStatus] = useState<string>("OPERATIONAL");
  const [healthScore, setHealthScore] = useState<string>("100");

  useEffect(() => {
    if (isOpen) {
      stationsService.getAllStations().then((data) => {
        setStations(data);
        if (data.length > 0) setStationId(data[0].id);
      }).catch(console.warn);

      setCreatedAsset(null);
      setSubmitError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!assetName.trim()) {
      setSubmitError("Asset name and specification is required.");
      return;
    }

    const station = stations.find((s) => s.id === stationId);
    const stationCode = station ? station.slug.slice(0, 3).toUpperCase() : "BHR";
    const qrCode = `DHRUV:ASSET:AST-${stationCode}-${Date.now().toString().slice(-4)}`;

    setIsSubmitting(true);
    try {
      const asset = await assetsService.createAsset({
        asset_name: assetName.trim(),
        asset_type: assetType,
        qr_code: qrCode,
        station_id: stationId,
        location: location.trim() || `${station?.name || "Station"} Base`,
        status,
        health_score: parseFloat(healthScore) || 100.0,
      });

      setCreatedAsset(asset);
      if (onAssetCreated) onAssetCreated(asset);
    } catch (err: any) {
      setSubmitError(err?.message || "Failed to register new asset in the polar fleet registry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setAssetName("");
    setCreatedAsset(null);
    setSubmitError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="REGISTER NEW POLAR EXPEDITION ASSET">
      {createdAsset ? (
        <div className="space-y-5 py-2">
          <div className="p-4 bg-[#0A160C] border border-[#7FAF91]/40 rounded flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#7FAF91] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-[#F5F3EE]">Asset Successfully Onboarded</h4>
              <p className="text-xs text-[#A5A29C] mt-1">
                Equipment <span className="font-mono text-[#F5F3EE]">{createdAsset.name}</span> is registered in polar asset registry.
              </p>
            </div>
          </div>

          <div className="bg-[#121212] border border-[#242424] p-4 rounded space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-[#242424]">
              <span className="text-[#6F6D68]">ASSET ID:</span>
              <span className="text-[#C8A96B] font-bold">AST-{createdAsset.id}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-[#242424]">
              <span className="text-[#6F6D68]">CATEGORY / STATION:</span>
              <span className="text-[#F5F3EE]">{createdAsset.category} &bull; {stations.find((s) => s.id === stationId)?.name || `Station #${stationId}`}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-[#242424]">
              <span className="text-[#6F6D68]">OPERATIONAL CONDITION:</span>
              <Badge variant="outline" className="text-[#7FAF91] border-[#7FAF91]/30">{createdAsset.condition}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#6F6D68]">HEALTH SCORE:</span>
              <span className="text-[#7FAF91] font-bold">{createdAsset.batteryHealthPct ?? 100}%</span>
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
              Asset Name & Model Specification *
            </label>
            <Input
              value={assetName}
              onChange={(e) => setAssetName(e.target.value)}
              placeholder="e.g. PistenBully 300 Polar Snowcat #08"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase text-[#A5A29C] mb-1.5">Asset Classification</label>
              <select
                value={assetType}
                onChange={(e) => setAssetType(e.target.value)}
                className="w-full bg-[#121212] border border-[#2A2A2A] rounded px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#C8A96B]"
              >
                {ASSET_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-[#A5A29C] mb-1.5">Assigned Station</label>
              <select
                value={stationId}
                onChange={(e) => setStationId(Number(e.target.value))}
                className="w-full bg-[#121212] border border-[#2A2A2A] rounded px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#C8A96B]"
              >
                {stations.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.slug.toUpperCase()})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase text-[#A5A29C] mb-1.5">Storage Bay / Berth Location</label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Bharati Station Heavy Equipment Hangar"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-[#A5A29C] mb-1.5">Operational Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-[#121212] border border-[#2A2A2A] rounded px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#C8A96B]"
              >
                <option value="OPERATIONAL">OPERATIONAL (Mission Ready)</option>
                <option value="MAINTENANCE_REQUIRED">MAINTENANCE_REQUIRED (Service Due)</option>
                <option value="IN_REPAIR">IN_REPAIR (Under Overhaul)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-[#A5A29C] mb-1.5">Initial Health Score (0 - 100)</label>
            <Input
              type="number"
              min="0"
              max="100"
              value={healthScore}
              onChange={(e) => setHealthScore(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-[#1E1E1E]">
            <Button type="button" variant="secondary" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? "Onboarding Asset..." : "Register & Commission Asset"}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
