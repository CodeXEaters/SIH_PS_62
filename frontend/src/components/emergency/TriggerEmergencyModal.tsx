"use client";

import React, { useState, useEffect } from "react";
import { ShieldAlert, AlertTriangle, CheckCircle2, X } from "lucide-react";
import { Modal, Button, Input, Badge } from "@/components/ui";
import { emergencyService } from "@/services/emergency";
import { stationsService } from "@/services/stations";
import { Station, EmergencyIncident } from "@/types";

interface TriggerEmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEmergencyTriggered?: (incident: EmergencyIncident) => void;
}

const EMERGENCY_TYPES = [
  { value: "CREVASSE_FALL", label: "Crevasse Fall / Extraction Required" },
  { value: "MEDICAL", label: "Medical Crisis / Severe Hypothermia / Trauma" },
  { value: "WEATHER_STORM", label: "Catastrophic Blizzard / Whiteout Lockdown" },
  { value: "EQUIPMENT_FAILURE", label: "Power Generator Failure / Habitat Freeze" },
  { value: "COMMUNICATION_BLACKOUT", label: "Iridium Telemetry Dropout & Loss of Contact" },
  { value: "FIRE", label: "Station Habitat Module Fire" },
] as const;

export const TriggerEmergencyModal: React.FC<TriggerEmergencyModalProps> = ({
  isOpen,
  onClose,
  onEmergencyTriggered,
}) => {
  const [stations, setStations] = useState<Station[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdIncident, setCreatedIncident] = useState<EmergencyIncident | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [emergencyType, setEmergencyType] = useState<string>("CREVASSE_FALL");
  const [severity, setSeverity] = useState<string>("CRITICAL");
  const [description, setDescription] = useState("");
  const [stationId, setStationId] = useState<number>(4);
  const [locationDescription, setLocationDescription] = useState("Traverse Corridor D-4, 28km South of Bharati");
  const [lat, setLat] = useState<string>("-69.4087");
  const [lng, setLng] = useState<string>("76.1872");

  useEffect(() => {
    if (isOpen) {
      stationsService.getAllStations().then((data) => {
        setStations(data);
        if (data.length > 0) setStationId(data[0].id);
      }).catch(console.warn);

      setTitle("CREVASSE EXTRACTION: Traverse Party Stranded");
      setDescription("Vehicle encountered hidden snow bridge collapse. Track immobilized, 2 crew members requiring urgent stabilization and heated evacuation.");
      setCreatedIncident(null);
      setSubmitError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!title.trim() || !description.trim()) {
      setSubmitError("Incident title and description are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const incident = await emergencyService.triggerEmergency({
        title: title.trim(),
        emergency_type: emergencyType,
        severity,
        description: description.trim(),
        station_id: stationId,
        location_description: locationDescription.trim(),
        latitude: parseFloat(lat) || -69.4087,
        longitude: parseFloat(lng) || 76.1872,
      });

      setCreatedIncident(incident);
      if (onEmergencyTriggered) onEmergencyTriggered(incident);
    } catch (err: any) {
      setSubmitError(err?.message || "Failed to broadcast emergency SOS to operations center.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setCreatedIncident(null);
    setSubmitError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="TRIGGER POLAR EMERGENCY DISTRESS (SOS)">
      {createdIncident ? (
        <div className="space-y-5 py-2">
          <div className="p-4 bg-[#1E0B0B] border border-[#B85C5C]/50 rounded flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-[#B85C5C] shrink-0 mt-0.5 animate-pulse" />
            <div>
              <h4 className="text-sm font-semibold text-[#F5F3EE]">EMERGENCY BROADCAST ACTIVE</h4>
              <p className="text-xs text-[#A5A29C] mt-1">
                Incident <span className="font-mono text-[#F5F3EE]">{createdIncident.incidentCode}</span> has locked the command console. Rescue resource recommendations are awaiting Commander authorization.
              </p>
            </div>
          </div>

          <div className="bg-[#121212] border border-[#242424] p-4 rounded space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-[#242424]">
              <span className="text-[#6F6D68]">INCIDENT CODE:</span>
              <span className="text-[#B85C5C] font-bold">{createdIncident.incidentCode}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-[#242424]">
              <span className="text-[#6F6D68]">SEVERITY:</span>
              <Badge variant="outline" className="text-[#B85C5C] border-[#B85C5C]/40 bg-[#1E0B0B]">
                {createdIncident.severity}
              </Badge>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-[#242424]">
              <span className="text-[#6F6D68]">RECOMMENDED ASSET:</span>
              <span className="text-[#C8A96B] font-bold">{createdIncident.recommendedResponse.primaryAssetName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#6F6D68]">HUMAN APPROVAL STATUS:</span>
              <Badge variant="outline" className="text-[#C8A96B] border-[#C8A96B]/30">PENDING COMMANDER ACTION</Badge>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={handleClose}>Dismiss</Button>
            <Button
              variant="primary"
              onClick={() => {
                handleClose();
                window.location.reload();
              }}
            >
              Go to Emergency Console
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
              Incident Headline / Distress Call *
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. SNO-CAT 04 OVERTURNE IN CREVASSE FIELD"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase text-[#A5A29C] mb-1.5">Emergency Classification</label>
              <select
                value={emergencyType}
                onChange={(e) => setEmergencyType(e.target.value)}
                className="w-full bg-[#121212] border border-[#2A2A2A] rounded px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#B85C5C]"
              >
                {EMERGENCY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-[#A5A29C] mb-1.5">Initial Severity</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full bg-[#121212] border border-[#2A2A2A] rounded px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#B85C5C]"
              >
                <option value="CRITICAL">CRITICAL — Immediate Life Threat</option>
                <option value="HIGH">HIGH — Severe Degradation / Evac Imminent</option>
                <option value="WARNING">WARNING — Operational Disruption</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-[#A5A29C] mb-1.5">Originating Polar Station Sector</label>
            <select
              value={stationId}
              onChange={(e) => setStationId(Number(e.target.value))}
              className="w-full bg-[#121212] border border-[#2A2A2A] rounded px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#B85C5C]"
            >
              {stations.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.slug.toUpperCase()})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-[#A5A29C] mb-1.5">Location Description</label>
            <Input
              value={locationDescription}
              onChange={(e) => setLocationDescription(e.target.value)}
              placeholder="e.g. Larsemann Hills Ridge Waypoint 4"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase text-[#A5A29C] mb-1.5">Latitude</label>
              <Input
                type="number"
                step="any"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase text-[#A5A29C] mb-1.5">Longitude</label>
              <Input
                type="number"
                step="any"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-[#A5A29C] mb-1.5">Field Situation & Casualties *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-[#121212] border border-[#2A2A2A] rounded p-2.5 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#B85C5C]"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-[#1E1E1E]">
            <Button type="button" variant="secondary" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" disabled={isSubmitting}>
              {isSubmitting ? "Broadcasting Distress..." : "BROADCAST EMERGENCY SOS"}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
