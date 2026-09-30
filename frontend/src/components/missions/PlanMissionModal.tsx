"use client";

import React, { useState, useEffect } from "react";
import { Compass, Radio, CheckCircle2, AlertTriangle, X } from "lucide-react";
import { Modal, Button, Input, Badge } from "@/components/ui";
import { missionsService, PlanEvaluationResponse } from "@/services/missions";
import { stationsService } from "@/services/stations";
import { personnelService } from "@/services/personnel";
import { permitsService, Permit } from "@/services/permits";
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
  const [permitsList, setPermitsList] = useState<Permit[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<PlanEvaluationResponse | null>(null);
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
  const [requiresPermit, setRequiresPermit] = useState<boolean>(false);
  const [selectedPermitId, setSelectedPermitId] = useState<number | null>(null);

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

      permitsService.getPermits({ status: "APPROVED" }).then((data) => {
        setPermitsList(data || []);
        if (data && data.length > 0) {
          setSelectedPermitId(data[0].id);
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
      setEvaluationResult(null);
      setSubmitError(null);
    }
  }, [isOpen]);

  const handleRunEvaluation = async () => {
    if (!missionName.trim()) {
      setSubmitError("Please enter a mission name before running pre-flight check.");
      return;
    }
    setSubmitError(null);
    setIsEvaluating(true);
    try {
      const evalRes = await missionsService.evaluatePlan({
        mission_name: missionName.trim(),
        origin_station_id: originStationId,
        destination_station_id: destinationStationId,
        mission_type: missionType,
        team_lead_id: teamLeadId,
        assigned_personnel_ids: [teamLeadId],
        assigned_asset_ids: [],
        start_time: new Date(startTime).toISOString(),
        expected_return: new Date(expectedReturn).toISOString(),
        requires_permit: requiresPermit,
        permit_id: requiresPermit ? selectedPermitId : null,
      });
      setEvaluationResult(evalRes);
    } catch (err: any) {
      setSubmitError(err?.message || "Failed to run pre-flight clearance check.");
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!missionName.trim()) {
      setSubmitError("Mission designation name is required.");
      return;
    }

    if (evaluationResult && evaluationResult.overall_status === "BLOCKED") {
      setSubmitError("Cannot launch mission: Pre-flight clearance status is BLOCKED. Address clearance hazards.");
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

          {/* Regulatory & Environmental Permit Selection */}
          <div className="p-3 bg-[#161616] border border-[#262626] rounded space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-mono text-[#F5F3EE] cursor-pointer">
                <input
                  type="checkbox"
                  checked={requiresPermit}
                  onChange={(e) => setRequiresPermit(e.target.checked)}
                  className="rounded bg-[#1C1C1C] border-[#333] text-[#7FAF91] focus:ring-0"
                />
                <span>Mandatory Antarctic Treaty / Environmental Permit Required</span>
              </label>
            </div>

            {requiresPermit && (
              <div>
                <label className="block text-[10px] font-mono uppercase text-[#888] mb-1">
                  Select Authorized Permit
                </label>
                <select
                  value={selectedPermitId || ""}
                  onChange={(e) => setSelectedPermitId(Number(e.target.value))}
                  className="w-full bg-[#121212] border border-[#2A2A2A] rounded px-3 py-1.5 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#7FAF91]"
                >
                  {permitsList.length > 0 ? (
                    permitsList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.permit_number} — {p.permit_type.replace(/_/g, " ")} ({p.status})
                      </option>
                    ))
                  ) : (
                    <option value="">No approved permits found in registry</option>
                  )}
                </select>
              </div>
            )}
          </div>

          {/* Pre-Flight Autonomous Clearance Check Panel */}
          <div className="p-3.5 bg-[#121614] border border-[#243329] rounded space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] font-mono text-[#7FAF91] uppercase font-bold tracking-wider">
                  PRE-FLIGHT CLEARANCE PROTOCOL
                </div>
                <div className="text-xs text-[#A5A29C]">
                  Evaluate permit validity, team medical readiness, asset health, and weather hazards.
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRunEvaluation}
                disabled={isEvaluating}
                className="text-xs font-mono border-[#7FAF91]/40 text-[#7FAF91] hover:bg-[#7FAF91]/10"
              >
                {isEvaluating ? "Evaluating..." : "Run Pre-Flight Check"}
              </Button>
            </div>

            {/* Evaluation Result Display */}
            {evaluationResult && (
              <div className="space-y-2.5 pt-2 border-t border-[#243329]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-[#888]">OVERALL CLEARANCE:</span>
                  <span
                    className={`px-2 py-0.5 text-xs font-mono font-bold rounded border ${
                      evaluationResult.overall_status === "PASS"
                        ? "bg-[#7FAF91]/20 text-[#7FAF91] border-[#7FAF91]/40"
                        : evaluationResult.overall_status === "WARNING"
                        ? "bg-[#E0A96D]/20 text-[#E0A96D] border-[#E0A96D]/40"
                        : "bg-[#E06D6D]/20 text-[#E06D6D] border-[#E06D6D]/40"
                    }`}
                  >
                    STATUS: {evaluationResult.overall_status}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {evaluationResult.checks.map((chk, idx) => (
                    <div
                      key={idx}
                      className="p-2 bg-[#171D1A] border border-[#2A3B31] rounded text-[11px]"
                    >
                      <div className="flex items-center justify-between font-mono">
                        <span className="text-[#888]">{chk.category}</span>
                        <span
                          className={
                            chk.status === "PASS"
                              ? "text-[#7FAF91]"
                              : chk.status === "WARNING"
                              ? "text-[#E0A96D]"
                              : "text-[#E06D6D] font-bold"
                          }
                        >
                          {chk.status}
                        </span>
                      </div>
                      <div className="text-[#CCC] mt-0.5 text-[10px]">{chk.details}</div>
                    </div>
                  ))}
                </div>

                {evaluationResult.recommendations.length > 0 && (
                  <div className="text-[10px] text-[#A5A29C] bg-[#1A1A1A] p-2 rounded border border-[#2A2A2A] space-y-1">
                    <span className="font-mono text-[#888] uppercase block">Recommendations:</span>
                    {evaluationResult.recommendations.map((r, i) => (
                      <div key={i} className="flex items-start gap-1.5">
                        <span className="text-[#7FAF91]">&bull;</span>
                        <span>{r}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-[#1E1E1E]">
            <Button type="button" variant="secondary" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting || (evaluationResult?.overall_status === "BLOCKED")}
              className={
                evaluationResult?.overall_status === "BLOCKED"
                  ? "bg-[#333] text-[#777] cursor-not-allowed"
                  : ""
              }
            >
              {isSubmitting
                ? "Authorizing Mission..."
                : evaluationResult?.overall_status === "BLOCKED"
                ? "Clearance Blocked"
                : "Confirm & Plan Mission"}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
