"use client";

import React, { useState, useEffect } from "react";
import { Compass, Radio, CheckCircle2, AlertTriangle, X } from "lucide-react";
import { Modal, Button, Input, Badge } from "@/components/ui";
import { missionsService } from "@/services/missions";
import { stationsService } from "@/services/stations";
import { personnelService } from "@/services/personnel";
import { Station, Mission, Personnel } from "@/types";

interface PlanMissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMissionCreated?: (mission: Mission) => void;
}

const MISSION_TYPES = [
  { value: "LOGISTICS_CONVOY", label: "Logistics Overland Convoy" },
  { value: "SCIENTIFIC_SURVEY", label: "Glaciology & Climate Survey" },
  { value: "RECONNAISSANCE", label: "Ice Runway & Route Reconnaissance" },
  { value: "MAINTENANCE_SORTIE", label: "Automated Weather Station (AWS) Maintenance" },
  { value: "EMERGENCY_RESCUE", label: "Search & Rescue / Medical Evac" },
] as const;

export const PlanMissionModal: React.FC<PlanMissionModalProps> = ({
  isOpen,
  onClose,
  onMissionCreated,
}) => {
  const [stations, setStations] = useState<Station[]>([]);
  const [personnelList, setPersonnelList] = useState<Personnel[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdMission, setCreatedMission] = useState<Mission | null>(null);

  // Form State
  const [missionName, setMissionName] = useState("");
  const [missionType, setMissionType] = useState<string>("LOGISTICS_CONVOY");
  const [originStationId, setOriginStationId] = useState<number>(4);
  const [destinationStationId, setDestinationStationId] = useState<number>(5);
  const [originCustom, setOriginCustom] = useState("");
  const [destinationCustom, setDestinationCustom] = useState("");
  const [teamLeadId, setTeamLeadId] = useState<number>(1);
  const [startTime, setStartTime] = useState("");
  const [expectedReturn, setExpectedReturn] = useState("");
  const [riskLevel, setRiskLevel] = useState<string>("LOW");

  useEffect(() => {
    if (isOpen) {
      stationsService.getAllStations().then((data) => {
        setStations(data);
        if (data.length >= 2) {
          setOriginStationId(data[0].id);
          setDestinationStationId(data[1].id);
        }
      }).catch(console.warn);

      personnelService.getAllPersonnel().then((data) => {
        setPersonnelList(data);
        if (data.length > 0) {
          setTeamLeadId(parseInt(data[0].id, 10) || 1);
        }
      }).catch(console.warn);

      // Default times: Start tomorrow 06:00 UTC, return in 48 hours
      const now = new Date();
      const start = new Date(now.getTime() + 24 * 3600 * 1000);
      start.setHours(6, 0, 0, 0);
      const ret = new Date(start.getTime() + 48 * 3600 * 1000);

      setStartTime(start.toISOString().slice(0, 16));
      setExpectedReturn(ret.toISOString().slice(0, 16));
      setCreatedMission(null);
      setSubmitError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!missionName.trim()) {
      setSubmitError("Mission designation name is required.");
      return;
    }

    const originName = originCustom.trim() || stations.find((s) => s.id === originStationId)?.name || "Origin Base";
    const destName = destinationCustom.trim() || stations.find((s) => s.id === destinationStationId)?.name || "Destination Sector";

    setIsSubmitting(true);
    try {
      const mission = await missionsService.createMission({
        mission_name: missionName.trim(),
        mission_type: missionType,
        origin: originName,
        destination: destName,
        origin_station_id: originStationId,
        destination_station_id: destinationStationId,
        team_lead_id: teamLeadId,
        start_time: new Date(startTime).toISOString(),
        expected_return: new Date(expectedReturn).toISOString(),
        status: "PLANNED",
        risk_level: riskLevel,
      });

      setCreatedMission(mission);
      if (onMissionCreated) onMissionCreated(mission);
    } catch (err: any) {
      setSubmitError(err?.message || "Failed to schedule mission with the operations controller.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setMissionName("");
    setCreatedMission(null);
    setSubmitError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="PLAN POLAR TRAVERSE & MISSION">
      {createdMission ? (
        <div className="space-y-5 py-2">
          <div className="p-4 bg-[#0A160C] border border-[#7FAF91]/40 rounded flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#7FAF91] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-[#F5F3EE]">Mission Successfully Authorized</h4>
              <p className="text-xs text-[#A5A29C] mt-1">
                Field sortie <span className="font-mono text-[#F5F3EE]">{createdMission.title}</span> is scheduled and logged in the operations registry.
              </p>
            </div>
          </div>

          <div className="bg-[#121212] border border-[#242424] p-4 rounded space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-[#242424]">
              <span className="text-[#6F6D68]">MISSION ID:</span>
              <span className="text-[#C8A96B] font-bold">MSN-{createdMission.id}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-[#242424]">
              <span className="text-[#6F6D68]">CORRIDOR:</span>
              <span className="text-[#F5F3EE]">{createdMission.location}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-[#242424]">
              <span className="text-[#6F6D68]">OPERATIONAL STATUS:</span>
              <Badge variant="outline" className="text-[#7FAF91] border-[#7FAF91]/30">PLANNED</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#6F6D68]">INITIAL RISK:</span>
              <Badge variant="outline" className="text-[#C8A96B] border-[#C8A96B]/30">{createdMission.riskLevel}</Badge>
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
              Mission Name / Operation Codename *
            </label>
            <Input
              value={missionName}
              onChange={(e) => setMissionName(e.target.value)}
              placeholder="e.g. Queen Maud Land Inland Glaciology Traverse"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase text-[#A5A29C] mb-1.5">Mission Type</label>
              <select
                value={missionType}
                onChange={(e) => setMissionType(e.target.value)}
                className="w-full bg-[#121212] border border-[#2A2A2A] rounded px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#C8A96B]"
              >
                {MISSION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-[#A5A29C] mb-1.5">Initial Risk Level</label>
              <select
                value={riskLevel}
                onChange={(e) => setRiskLevel(e.target.value)}
                className="w-full bg-[#121212] border border-[#2A2A2A] rounded px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#C8A96B]"
              >
                <option value="LOW">LOW (0 - 30)</option>
                <option value="MEDIUM">MEDIUM (31 - 60)</option>
                <option value="HIGH">HIGH (61 - 80)</option>
                <option value="CRITICAL">CRITICAL (81 - 100)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase text-[#A5A29C] mb-1.5">Origin Polar Station</label>
              <select
                value={originStationId}
                onChange={(e) => setOriginStationId(Number(e.target.value))}
                className="w-full bg-[#121212] border border-[#2A2A2A] rounded px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#C8A96B]"
              >
                {stations.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.slug.toUpperCase()})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-[#A5A29C] mb-1.5">Destination Station / Zone</label>
              <select
                value={destinationStationId}
                onChange={(e) => setDestinationStationId(Number(e.target.value))}
                className="w-full bg-[#121212] border border-[#2A2A2A] rounded px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#C8A96B]"
              >
                {stations.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.slug.toUpperCase()})</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-[#A5A29C] mb-1.5">Expedition Team Leader</label>
            <select
              value={teamLeadId}
              onChange={(e) => setTeamLeadId(Number(e.target.value))}
              className="w-full bg-[#121212] border border-[#2A2A2A] rounded px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#C8A96B]"
            >
              {personnelList.length > 0 ? (
                personnelList.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} — {p.role}</option>
                ))
              ) : (
                <option value="1">Major Vikram Malhotra (Lead Operator)</option>
              )}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase text-[#A5A29C] mb-1.5">Scheduled Departure (UTC)</label>
              <Input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase text-[#A5A29C] mb-1.5">Expected Return (UTC)</label>
              <Input
                type="datetime-local"
                value={expectedReturn}
                onChange={(e) => setExpectedReturn(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-[#1E1E1E]">
            <Button type="button" variant="secondary" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? "Authorizing Mission..." : "Confirm & Plan Mission"}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
