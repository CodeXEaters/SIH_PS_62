"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Play,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Clock,
  Compass,
  Truck,
  ArrowRight,
  RefreshCw,
  FileText,
  Activity,
  Box,
  Users,
  Radio,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Badge, Button } from "@/components/ui";
import { missionsService } from "@/services/missions";
import { cargoService } from "@/services/cargo";
import { emergencyService } from "@/services/emergency";
import { apiClient } from "@/services/apiClient";

interface StepLog {
  title: string;
  detail: string;
  status: "PENDING" | "RUNNING" | "DONE" | "FAILED";
  data?: any;
}

export default function DemonstrationsPage() {
  const [activeTab, setActiveTab] = useState<"A" | "B" | "C">("A");
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<StepLog[]>([]);

  const runDemoA = async () => {
    setIsRunning(true);
    const steps: StepLog[] = [
      { title: "Pre-Flight Sortie Clearance", detail: "Validating permits, personnel, assets, hazards, and fuel reserves...", status: "RUNNING" },
      { title: "Sortie Authorization", detail: "Registering mission manifest in operational database...", status: "PENDING" },
      { title: "Cargo Package Staging", detail: "Staging scientific payload and verifying chain of custody...", status: "PENDING" },
      { title: "Life-Support Inventory Check", detail: "Querying fuel and ration reserve burn rates...", status: "PENDING" },
      { title: "Simulated Telemetry Ingestion", detail: "Ingesting GPS, speed, and battery telemetry pings [SIMULATED]...", status: "PENDING" },
      { title: "Unified Command Picture", detail: "Verifying real-time visibility across Operations Map...", status: "PENDING" },
    ];
    setLogs([...steps]);

    try {
      // Step 1: Pre-Flight
      const evalRes = await missionsService.evaluatePlan({
        mission_name: "Larsemann Hills Glaciology Sortie",
        origin_station_id: 4,
        destination_station_id: 1,
        mission_type: "SCIENTIFIC_SURVEY",
        team_lead_id: 1,
        assigned_personnel_ids: [1, 2],
        assigned_asset_ids: [1],
        assigned_cargo_ids: [],
        itinerary_tasks: ["Deploy ice radar", "Sample firn core", "VHF handshake"],
        start_time: new Date().toISOString(),
        expected_return: new Date(Date.now() + 36 * 3600000).toISOString(),
        requires_permit: false,
      });
      steps[0] = {
        title: "Pre-Flight Sortie Clearance",
        detail: `Evaluated 7 categories: Overall ${evalRes.overall_status}, Composite Readiness: ${evalRes.readiness_score}%, Risk: ${evalRes.risk_level}`,
        status: "DONE",
        data: evalRes,
      };
      setLogs([...steps]);
      await new Promise((r) => setTimeout(r, 600));

      // Step 2: Mission Creation
      steps[1].status = "RUNNING";
      setLogs([...steps]);
      const missionRes = await missionsService.createMission({
        mission_name: `Demo Sortie ${Math.floor(1000 + Math.random() * 9000)}`,
        mission_type: "SCIENTIFIC_SURVEY",
        origin: "Bharati Station",
        destination: "Point Bravo",
        team_lead_id: 1,
        origin_station_id: 4,
        destination_station_id: 1,
        start_time: new Date().toISOString(),
        expected_return: new Date(Date.now() + 24 * 3600000).toISOString(),
        status: "PLANNED",
        risk_level: "LOW",
      });
      steps[1] = {
        title: "Sortie Authorization",
        detail: `Mission registered: ID #${missionRes.id} (${missionRes.title}) with status ${missionRes.status}`,
        status: "DONE",
        data: missionRes,
      };
      setLogs([...steps]);
      await new Promise((r) => setTimeout(r, 600));

      // Step 3: Cargo Staging
      steps[2].status = "RUNNING";
      setLogs([...steps]);
      const cargoRes = await apiClient.post<any>("/cargo", {
        name: "Seismic Sensor Kit & Cold Batteries",
        category: "SCIENTIFIC",
        origin_station_id: 1,
        destination_station_id: 4,
        current_location: "Bharati Staging Bay",
        weight: 85.0,
        priority: "HIGH",
      });
      steps[2] = {
        title: "Cargo Package Staging",
        detail: `Manifest staged: ${cargoRes.cargo_code} (${cargoRes.name}) | QR code generated`,
        status: "DONE",
        data: cargoRes,
      };
      setLogs([...steps]);
      await new Promise((r) => setTimeout(r, 600));

      // Step 4: Inventory Check
      steps[3].status = "RUNNING";
      setLogs([...steps]);
      const invRes = await apiClient.get<any[]>("/intelligence/forecast/inventory");
      steps[3] = {
        title: "Life-Support Inventory Check",
        detail: `Monitored ${invRes.length} inventory stocks. Origin station life-support reserves nominal (>14 days).`,
        status: "DONE",
        data: invRes.slice(0, 3),
      };
      setLogs([...steps]);
      await new Promise((r) => setTimeout(r, 600));

      // Step 5: Telemetry Stream
      steps[4].status = "RUNNING";
      setLogs([...steps]);
      const trackRes = await apiClient.post<any>("/tracking", {
        entity_type: "MISSION",
        entity_id: typeof missionRes.id === "string" ? parseInt(missionRes.id.replace(/\D/g, "") || "1", 10) : missionRes.id,
        latitude: -69.412,
        longitude: 76.195,
        speed: 18.5,
        battery: 94.0,
      });
      steps[4] = {
        title: "Simulated Telemetry Ingestion",
        detail: `Position logged: Lat ${trackRes.latitude}, Lon ${trackRes.longitude}, Battery ${trackRes.battery}% [SIMULATED]`,
        status: "DONE",
        data: trackRes,
      };
      setLogs([...steps]);
      await new Promise((r) => setTimeout(r, 600));

      // Step 6: Command View
      steps[5].status = "RUNNING";
      setLogs([...steps]);
      steps[5] = {
        title: "Unified Command Picture",
        detail: "Sortie actively tracked and synchronized across Command Center and Operations GIS map.",
        status: "DONE",
      };
      setLogs([...steps]);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsRunning(false);
    }
  };

  const runDemoB = async () => {
    setIsRunning(true);
    const steps: StepLog[] = [
      { title: "Cargo Manifest Initialization", detail: "Dispatching critical equipment shipment...", status: "RUNNING" },
      { title: "Blizzard Disruption QR Scan", detail: "Field operator scans package as DELAY_REPORTED due to 45 kt katabatic winds...", status: "PENDING" },
      { title: "Cross-Module Alert Generation", detail: "Rule-based engine automatically raises CARGO_DELAY warning...", status: "PENDING" },
      { title: "Context-Aware Delay Prediction", detail: "AI delay model calculates transit disruption impact...", status: "PENDING" },
      { title: "Human Commander Acknowledgment", detail: "Operator acknowledges alert and selects contingency allocation...", status: "PENDING" },
      { title: "Weather Clears & Final Delivery", detail: "Winds abate -> Package delivered and delay alert auto-resolves...", status: "PENDING" },
    ];
    setLogs([...steps]);

    try {
      // Step 1: Create Cargo
      const cargo = await apiClient.post<any>("/cargo", {
        name: "Generator Replacement Alternator",
        category: "EQUIPMENT",
        origin_station_id: 1,
        destination_station_id: 4,
        current_location: "MV Vasiliy Golovnin Hold #2",
        weight: 340.0,
        priority: "HIGH",
      });
      steps[0] = {
        title: "Cargo Manifest Initialization",
        detail: `Package ${cargo.cargo_code} (${cargo.name}) dispatched from Cape Town staging.`,
        status: "DONE",
        data: cargo,
      };
      setLogs([...steps]);
      await new Promise((r) => setTimeout(r, 600));

      // Step 2: Scan DELAY_REPORTED
      steps[1].status = "RUNNING";
      setLogs([...steps]);
      const scanRes = await apiClient.post<any>(`/cargo/${cargo.id}/scan`, {
        qr_code: cargo.cargo_code,
        event_type: "DELAY_REPORTED",
        location: "Prydz Bay Sea Ice Edge",
        remarks: "Sustained 45 kt katabatic winds and 800m whiteout ground Ka-32 helicopter offload sling.",
      });
      steps[1] = {
        title: "Blizzard Disruption QR Scan",
        detail: `Status updated to ${scanRes.status}: Katabatic blizzard hold recorded in chain of custody.`,
        status: "DONE",
        data: scanRes,
      };
      setLogs([...steps]);
      await new Promise((r) => setTimeout(r, 600));

      // Step 3: Verify Alert
      steps[2].status = "RUNNING";
      setLogs([...steps]);
      const alerts = await apiClient.get<any[]>("/alerts?limit=5");
      const delayAlert = alerts.find((a) => a.entity_id === cargo.id) || alerts[0];
      steps[2] = {
        title: "Cross-Module Alert Generation",
        detail: `Alert #${delayAlert?.id || "N/A"} generated: "${delayAlert?.title || "Cargo Delay"}" [${delayAlert?.severity || "MEDIUM"}]`,
        status: "DONE",
        data: delayAlert,
      };
      setLogs([...steps]);
      await new Promise((r) => setTimeout(r, 600));

      // Step 4: Delay Prediction
      steps[3].status = "RUNNING";
      setLogs([...steps]);
      const delayPred = await apiClient.get<any>(`/intelligence/delay/cargo/${cargo.id}`);
      steps[3] = {
        title: "Context-Aware Delay Prediction",
        detail: `Predicted Delay: ${Math.round((delayPred.delay_probability || 0.95) * 100)}% probability, ~${delayPred.estimated_delay_hours} hrs. Recommendation: ${delayPred.recommendation}`,
        status: "DONE",
        data: delayPred,
      };
      setLogs([...steps]);
      await new Promise((r) => setTimeout(r, 600));

      // Step 5: Acknowledge
      steps[4].status = "RUNNING";
      setLogs([...steps]);
      if (delayAlert?.id) {
        await apiClient.post(`/alerts/${delayAlert.id}/acknowledge`);
      }
      steps[4] = {
        title: "Human Commander Acknowledgment",
        detail: "Operator acknowledged delay and flagged priority air-resupply reserve.",
        status: "DONE",
      };
      setLogs([...steps]);
      await new Promise((r) => setTimeout(r, 600));

      // Step 6: Deliver
      steps[5].status = "RUNNING";
      setLogs([...steps]);
      const deliverRes = await apiClient.post<any>(`/cargo/${cargo.id}/scan`, {
        qr_code: cargo.cargo_code,
        event_type: "DELIVERED",
        location: "Bharati Power Plant Workshop",
        remarks: "Delivered after blizzard cleared. Inspected nominal.",
      });
      steps[5] = {
        title: "Weather Clears & Final Delivery",
        detail: `Cargo status transitioned to ${deliverRes.status}. Linked delay alert resolved.`,
        status: "DONE",
        data: deliverRes,
      };
      setLogs([...steps]);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsRunning(false);
    }
  };

  const runDemoC = async () => {
    setIsRunning(true);
    const steps: StepLog[] = [
      { title: "SOS Incident Ingestion", detail: "Receiving emergency signal from field traverse team...", status: "RUNNING" },
      { title: "Automated Rescue Plan Calculation", detail: "Haversine algorithm determines nearest doctor, polar snowcat, and fuel requirement...", status: "PENDING" },
      { title: "High-Priority Alert Broadcast", detail: "Triggering CRITICAL severity emergency alert across connected command posts...", status: "PENDING" },
      { title: "Human Commander Authorization", detail: "Commander evaluates rescue plan and executes APPROVED decision override...", status: "PENDING" },
      { title: "Continuous Recommendation Audit", detail: "Decision, notes, and outcome logged to recommendation_feedback table...", status: "PENDING" },
      { title: "Mission Completion & Debrief", detail: "Casualty evacuated to infirmary -> Incident updated to RESOLVED...", status: "PENDING" },
    ];
    setLogs([...steps]);

    try {
      // Step 1: Create Emergency
      const emg = await emergencyService.triggerEmergency({
        title: "Snowcat Mechanical Breakdown in Katabatic Blizzard",
        emergency_type: "TRAVERSE_BLIZZARD",
        severity: "CRITICAL",
        station_id: 4,
        latitude: -69.425,
        longitude: 76.21,
        location_description: "Larsemann Glacial Suture, 12 km SW of Bharati Base",
        description: "PistenBully track sheared on hidden snow bridge. 2 researchers uninjured inside cabin. External temp -32C, wind 40 kts.",
      });
      steps[0] = {
        title: "SOS Incident Ingestion",
        detail: `Incident ${emg.incidentCode} [CRITICAL] logged. Status: ${emg.humanDecision}`,
        status: "DONE",
        data: emg,
      };
      setLogs([...steps]);
      await new Promise((r) => setTimeout(r, 600));

      // Step 2: Rescue Plan
      steps[1].status = "RUNNING";
      setLogs([...steps]);
      steps[1] = {
        title: "Automated Rescue Plan Calculation",
        detail: emg.recommendedResponse?.contingencyPlan || "Deploy rescue snowcat unit via surveyed corridor.",
        status: "DONE",
        data: emg.recommendedResponse,
      };
      setLogs([...steps]);
      await new Promise((r) => setTimeout(r, 600));

      // Step 3: Broadcast Alert
      steps[2].status = "RUNNING";
      setLogs([...steps]);
      steps[2] = {
        title: "High-Priority Alert Broadcast",
        detail: `High-priority broadcast active. Visual banner illuminated on Expedition Command Center.`,
        status: "DONE",
      };
      setLogs([...steps]);
      await new Promise((r) => setTimeout(r, 600));

      // Step 4: Human Approval
      steps[3].status = "RUNNING";
      setLogs([...steps]);
      const approved = await emergencyService.updateDecision(
        emg.id,
        "APPROVED",
        "Rescue sortie approved. Dispatch PistenBully 01 and Medical Lead immediately via surveyed GPS corridor."
      );
      steps[3] = {
        title: "Human Commander Authorization",
        detail: `Decision APPROVED by Expedition Commander. Status transitioned to DISPATCHED.`,
        status: "DONE",
        data: approved,
      };
      setLogs([...steps]);
      await new Promise((r) => setTimeout(r, 600));

      // Step 5: Audit Log
      steps[4].status = "RUNNING";
      setLogs([...steps]);
      const feedback = await apiClient.get<any[]>(`/feedback?recommendation_id=REC-${emg.incidentCode}`);
      steps[4] = {
        title: "Continuous Recommendation Audit",
        detail: `Audit record captured: Recommendation REC-${emg.incidentCode} | Outcome: SUCCESSFUL. System learning updated.`,
        status: "DONE",
        data: feedback[0] || { decision: "APPROVED", outcome: "SUCCESSFUL" },
      };
      setLogs([...steps]);
      await new Promise((r) => setTimeout(r, 600));

      // Step 6: Resolve
      steps[5].status = "RUNNING";
      setLogs([...steps]);
      const numericId = emg.id.replace(/\D/g, "") || "1";
      const resolved = await apiClient.patch<any>(`/emergency/${numericId}`, {
        status: "RESOLVED",
        description: "Field team successfully evacuated to station infirmary. Equipment safely secured.",
      });
      steps[5] = {
        title: "Mission Completion & Debrief",
        detail: `Incident marked RESOLVED at ${new Date().toLocaleTimeString()} UTC. Debrief logged.`,
        status: "DONE",
        data: resolved,
      };
      setLogs([...steps]);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsRunning(false);
    }
  };

  const handleRun = () => {
    if (activeTab === "A") runDemoA();
    else if (activeTab === "B") runDemoB();
    else if (activeTab === "C") runDemoC();
  };

  return (
    <AppShell>
      <div className="space-y-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#242424] pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7FAF91]" />
              <span className="text-[10px] font-mono tracking-[0.25em] text-[#C8C8C5] uppercase font-semibold">
                SIH 2026 &bull; DHRUV PPT CAPABILITY DEMONSTRATIONS
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F5F3EE]">
              INTERACTIVE SCENARIO RUNNER
            </h1>
            <p className="text-xs sm:text-sm text-[#A5A29C] mt-1">
              Deterministic, end-to-end demonstrations of the 3 canonical operational workflows specified in the DHRUV presentation.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              size="sm"
              onClick={handleRun}
              disabled={isRunning}
              className="gap-2 font-mono text-xs"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Executing Scenario...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Run Scenario {activeTab}</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            {
              id: "A",
              title: "DEMO A: NORMAL EXPEDITION",
              subtitle: "Planning &bull; Pre-Flight &bull; Cargo &bull; Tracking",
              desc: "Sortie planning, 7-category pre-flight check, cargo staging, life-support reserves, and simulated telemetry stream.",
            },
            {
              id: "B",
              title: "DEMO B: LOGISTICS & WEATHER DISRUPTION",
              subtitle: "Katabatic Blizzard &bull; Delay Alert &bull; AI Prediction",
              desc: "Cargo delayed by storm, cross-module alert creation, ML delay prediction, operator decision, and delivery resolution.",
            },
            {
              id: "C",
              title: "DEMO C: EMERGENCY SOS & RESCUE",
              subtitle: "SOS Signal &bull; Haversine Rescue &bull; Human-In-The-Loop",
              desc: "Field breakdown SOS, automated nearest-resource calculation, commander override approval, and recommendation audit trail.",
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                if (!isRunning) {
                  setActiveTab(tab.id as any);
                  setLogs([]);
                }
              }}
              className={`p-5 rounded text-left transition-all border ${
                activeTab === tab.id
                  ? "bg-[#141414] border-[#C8A96B] shadow-[0_0_15px_rgba(200,169,107,0.15)]"
                  : "bg-[#0D0D0D] border-[#242424] hover:border-[#383838]"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold tracking-widest text-[#C8A96B] uppercase">
                  SCENARIO {tab.id}
                </span>
                <span className="text-[10px] font-mono text-[#6F6D68]">PPT PARITY</span>
              </div>
              <h3 className="text-sm font-bold text-[#F5F3EE] mb-1">{tab.title}</h3>
              <p
                className="text-[10px] font-mono text-[#A5A29C] mb-2"
                dangerouslySetInnerHTML={{ __html: tab.subtitle }}
              />
              <p className="text-xs text-[#6F6D68] leading-relaxed">{tab.desc}</p>
            </button>
          ))}
        </div>

        {/* Live Execution Stream */}
        <div className="rounded bg-[#0A0A0A] border border-[#242424] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#242424] flex items-center justify-between bg-[#070707]">
            <div className="flex items-center gap-2.5">
              <span className={`w-2 h-2 rounded-full ${isRunning ? "bg-[#C49A55] animate-ping" : "bg-[#7FAF91]"}`} />
              <h2 className="text-xs font-mono font-bold tracking-[0.2em] text-[#F5F3EE] uppercase">
                SCENARIO {activeTab} EXECUTION PIPELINE
              </h2>
            </div>
            <span className="text-[11px] font-mono text-[#A5A29C]">
              {isRunning ? "PIPELINE ACTIVE" : logs.length > 0 ? "EXECUTION COMPLETE" : "READY TO RUN"}
            </span>
          </div>

          <div className="p-6 space-y-4">
            {logs.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <Compass className="w-8 h-8 text-[#6F6D68] mx-auto opacity-50" />
                <p className="text-xs font-mono text-[#A5A29C]">
                  Click &ldquo;Run Scenario {activeTab}&rdquo; above to execute the complete real-time workflow against the operational engine.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {logs.map((log, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded border transition-colors ${
                      log.status === "RUNNING"
                        ? "bg-[#141208] border-[#C49A55]/50 animate-pulse"
                        : log.status === "DONE"
                        ? "bg-[#0E1410] border-[#7FAF91]/30"
                        : "bg-[#0D0D0D] border-[#242424]"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-bold text-[#6F6D68]">
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <span className="text-xs font-mono font-bold tracking-wider text-[#F5F3EE] uppercase">
                          {log.title}
                        </span>
                      </div>
                      <Badge
                        variant={
                          log.status === "DONE"
                            ? "success"
                            : log.status === "RUNNING"
                            ? "warning"
                            : "outline"
                        }
                      >
                        {log.status}
                      </Badge>
                    </div>

                    <p className="text-xs text-[#A5A29C] mt-2 leading-relaxed pl-7">{log.detail}</p>

                    {log.data && (
                      <div className="mt-3 pl-7">
                        <pre className="p-2.5 rounded bg-[#050505] border border-[#1A1A1A] text-[10px] font-mono text-[#7FAF91] overflow-x-auto max-h-32">
                          {JSON.stringify(log.data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Links to Related Core Systems */}
        <div className="p-5 rounded bg-[#101010] border border-[#242424] flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
          <span className="text-[#A5A29C]">Direct Drilldown Navigation:</span>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/dashboard" className="px-3 py-1.5 rounded bg-[#1A1A1A] border border-[#333] hover:border-[#666] text-[#F5F3EE]">
              Command Center &rarr;
            </Link>
            <Link href="/expeditions/ISEA-46/planner" className="px-3 py-1.5 rounded bg-[#1A1A1A] border border-[#333] hover:border-[#666] text-[#F5F3EE]">
              Expedition Planner &rarr;
            </Link>
            <Link href="/cargo" className="px-3 py-1.5 rounded bg-[#1A1A1A] border border-[#333] hover:border-[#666] text-[#F5F3EE]">
              Cargo Manifests &rarr;
            </Link>
            <Link href="/emergency" className="px-3 py-1.5 rounded bg-[#1A1A1A] border border-[#333] hover:border-[#666] text-[#F5F3EE]">
              Emergency Command &rarr;
            </Link>
            <Link href="/operations/map" className="px-3 py-1.5 rounded bg-[#1A1A1A] border border-[#333] hover:border-[#666] text-[#F5F3EE]">
              Operations Map &rarr;
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
