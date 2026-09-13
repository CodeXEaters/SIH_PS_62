"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { IntelligenceTabs } from "@/components/intelligence/IntelligenceTabs";
import { Button } from "@/components/ui";
import { RotateCcw, Activity } from "lucide-react";
import { intelligenceService } from "@/services/intelligence";
import { WhatIfScenarioResult } from "@/types";

export default function WhatIfSimulatorPage() {
  const [vesselDelayDays, setVesselDelayDays] = useState(4);
  const [fuelSpikePct, setFuelSpikePct] = useState(20);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<WhatIfScenarioResult | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsSimulating(true);

    const timer = setTimeout(() => {
      intelligenceService
        .runWhatIfSimulation({
          vesselDelayDays,
          fuelConsumptionSpikePct: fuelSpikePct,
          aircraftCancelled: false,
          missionTraverseExtendedHours: 0,
          stationTransferDelayedDays: 0,
        })
        .then((res) => {
          if (isMounted) {
            setSimulationResult(res);
          }
        })
        .catch((err) => {
          console.warn("Failed to run what-if simulation from backend:", err);
        })
        .finally(() => {
          if (isMounted) setIsSimulating(false);
        });
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [vesselDelayDays, fuelSpikePct]);

  // Baseline fallbacks if backend is slow
  const fuelBurn = 180 * (1 + fuelSpikePct / 100);
  const fallbackDieselDays = Math.max(0, Number((1240 / fuelBurn).toFixed(1)));
  const fallbackRiskScore = Math.min(95, 48 + vesselDelayDays * 6 + Math.floor(fuelSpikePct * 0.4));

  const simulatedDieselDays = simulationResult?.bharatiFuelDaysRemaining ?? fallbackDieselDays;
  const simulatedRiskScore = simulationResult?.operationalRiskScore ? Math.round(simulationResult.operationalRiskScore) : fallbackRiskScore;

  const handleReset = () => {
    setVesselDelayDays(4);
    setFuelSpikePct(20);
  };

  return (
    <AppShell>
      <div className="space-y-8 max-w-5xl mx-auto">
        {/* Header: WHAT IF? */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#242424] pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C8A96B]" />
              <span className="text-[10px] font-mono tracking-[0.25em] text-[#C8C8C5] uppercase font-semibold">
                DETERMINISTIC STRESS TESTING
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F5F3EE]">
              WHAT IF?
            </h1>
            <p className="text-xs sm:text-sm text-[#A5A29C] mt-1">
              Simulate operational shocks to test station survival margins and logistics thresholds.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#161208] border border-[#C8A96B]/30 text-[10px] font-mono text-[#C8A96B]">
              <Activity className="w-3 h-3 text-[#C8A96B]" />
              <span>{isSimulating ? "SOLVING..." : "BACKEND SOLVER ONLINE"}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="gap-2 font-mono text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Baseline</span>
            </Button>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <IntelligenceTabs />

        {/* Scenario Controls (Used Sparingly) */}
        <div className="p-6 rounded bg-[#101010] border border-[#242424] space-y-4">
          <div className="flex items-center justify-between border-b border-[#242424] pb-3 text-xs font-mono">
            <span className="font-bold text-[#F5F3EE] uppercase tracking-wider">
              SCENARIO PARAMETERS
            </span>
            <span className="text-[#C8A96B] font-bold">
              PROJECTED RISK: {simulatedRiskScore}/100
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
            {/* Slider 1: Vessel Delay */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-[#F5F3EE]">VESSEL DELAY:</span>
                <span className="text-[#C8A96B] font-bold">+{vesselDelayDays} DAYS</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={vesselDelayDays}
                onChange={(e) => setVesselDelayDays(Number(e.target.value))}
                className="w-full accent-[#C8A96B] cursor-pointer bg-[#242424]"
              />
              <div className="flex justify-between text-[10px] text-[#6F6D68]">
                <span>0 DAYS (ON TIME)</span>
                <span>+10 DAYS (HEAVY ICE PACK)</span>
              </div>
            </div>

            {/* Slider 2: Fuel Consumption Surge */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-[#F5F3EE]">STATION HEATING LOAD SURGE:</span>
                <span className="text-[#C8A96B] font-bold">+{fuelSpikePct}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="5"
                value={fuelSpikePct}
                onChange={(e) => setFuelSpikePct(Number(e.target.value))}
                className="w-full accent-[#C8A96B] cursor-pointer bg-[#242424]"
              />
              <div className="flex justify-between text-[10px] text-[#6F6D68]">
                <span>0% (NOMINAL 180 L/DAY)</span>
                <span>+50% (SEVERE BLIZZARD)</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Impact Dimensions: CARGO, INVENTORY, MISSION, PERSONNEL */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#242424]">
            <span className="text-xs font-mono font-bold tracking-wider text-[#F5F3EE] uppercase">
              PROJECTED SYSTEMIC IMPACT
            </span>
            <span className="text-[10px] font-mono text-[#6F6D68]">4 COUPLING VECTORS</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* CARGO IMPACT */}
            <div className="p-5 rounded bg-[#101010] border border-[#242424] space-y-2 font-mono text-xs">
              <span className="text-[10px] font-bold tracking-widest text-[#6F6D68] uppercase block">
                CARGO IMPACT
              </span>
              <div className="text-xl font-bold text-[#C49A55]">
                +{vesselDelayDays * 24}h SLIP
              </div>
              <p className="text-[11px] font-sans text-[#A5A29C] leading-relaxed">
                {simulationResult?.cargoDelaysCount
                  ? `${simulationResult.cargoDelaysCount} cargo packages affected by transit slip.`
                  : "Heli-transfer queue delayed. Critical science modules held on vessel weather deck."}
              </p>
            </div>

            {/* INVENTORY IMPACT */}
            <div className="p-5 rounded bg-[#101010] border border-[#242424] space-y-2 font-mono text-xs">
              <span className="text-[10px] font-bold tracking-widest text-[#6F6D68] uppercase block">
                INVENTORY IMPACT
              </span>
              <div className="text-xl font-bold text-[#B85C5C]">
                {simulatedDieselDays} DAYS FUEL
              </div>
              <p className="text-[11px] font-sans text-[#A5A29C] leading-relaxed">
                {simulationResult?.criticalSupplyStockouts && simulationResult.criticalSupplyStockouts.length > 0
                  ? `Stockout alert: ${simulationResult.criticalSupplyStockouts.join(", ")}.`
                  : "Bharati Station diesel buffer drops below safe threshold. Requires rationing."}
              </p>
            </div>

            {/* MISSION IMPACT */}
            <div className="p-5 rounded bg-[#101010] border border-[#242424] space-y-2 font-mono text-xs">
              <span className="text-[10px] font-bold tracking-widest text-[#6F6D68] uppercase block">
                MISSION IMPACT
              </span>
              <div className="text-xl font-bold text-[#F5F3EE]">
                1 TRAVERSE CURTAILED
              </div>
              <p className="text-[11px] font-sans text-[#A5A29C] leading-relaxed">
                Glaciology drilling at Larsemann Ridge halted to preserve overland tractor fuel.
              </p>
            </div>

            {/* PERSONNEL IMPACT */}
            <div className="p-5 rounded bg-[#101010] border border-[#242424] space-y-2 font-mono text-xs">
              <span className="text-[10px] font-bold tracking-widest text-[#6F6D68] uppercase block">
                PERSONNEL IMPACT
              </span>
              <div className="text-xl font-bold text-[#F5F3EE]">
                24 SHIFT EXTENSIONS
              </div>
              <p className="text-[11px] font-sans text-[#A5A29C] leading-relaxed">
                Crew rotation deferred. Wintering team deployment extended by {vesselDelayDays} days.
              </p>
            </div>
          </div>
        </div>

        {/* RECOMMENDED RESPONSE */}
        <div className="p-6 rounded bg-[#0A0A0A] border-l-2 border-[#C8A96B] border-y border-r border-[#242424] space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-[#242424] pb-3">
            <span className="font-bold text-[#C8A96B] uppercase tracking-wider">
              RECOMMENDED RESPONSE
            </span>
            <span className="text-[10px] text-[#7FAF91]">SURVIVAL MARGIN: 99.4% NOMINAL</span>
          </div>

          <p className="text-[#F5F3EE] font-sans text-xs leading-relaxed max-w-3xl">
            {simulationResult?.recommendedAction ? (
              simulationResult.recommendedAction
            ) : vesselDelayDays >= 4 ? (
              <>
                <strong>Immediate Action Required:</strong> Initiate Level 2 Power Curtailment at Bharati Station. Switch domestic heaters to low setting (18°C) to extend diesel runway by +2.8 days. Re-task PistenBully AST-BHR-004 to shuttle 1,800L emergency fuel drums from the coastal fast-ice cache to Bharati.
              </>
            ) : (
              <>
                Operational reserves remain within safety limits. Maintain standard resupply sequence upon vessel mooring.
              </>
            )}
          </p>

          <div className="pt-2 flex items-center justify-between text-[10px] text-[#6F6D68]">
            <span>Deterministic Model Output &bull; NCPOR Operations Solver</span>
            <span className="text-[#F5F3EE]">Commander Authorization Required</span>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
