"use client";

import React from "react";
import Link from "next/link";
import {
  Compass,
  MapPin,
  Box,
  Truck,
  Users,
  Radio,
  Brain,
  ShieldAlert,
  WifiOff,
  Cpu,
  ArrowRight,
  TrendingDown,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Database,
  Activity,
  Layers,
  Thermometer,
  Wind,
} from "lucide-react";

export const EditorialSections: React.FC = () => {
  return (
    <div className="w-full bg-[#050505] text-[#F5F3EE] space-y-0 select-none">
      {/* ========================================================================= */}
      {/* 01 THE MISSION                                                            */}
      {/* ========================================================================= */}
      <section id="mission" className="bg-[#050505] py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-6 sm:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-4">
              <span className="text-xs font-mono tracking-[0.25em] text-[#C8A96B] uppercase block mb-3">
                01 / THE MISSION
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#F5F3EE] leading-tight">
                THE HARSH REALITY OF POLAR EXPEDITIONS.
              </h2>
              <div className="w-10 h-[1px] bg-[#C8A96B]/50 my-6" />
              <p className="text-xs font-mono text-[#6F6D68] tracking-widest uppercase">
                13,000 KM TRANSIT &bull; -40°C &bull; 140KT BLIZZARDS
              </p>
            </div>

            <div className="lg:col-span-8 space-y-6 text-[#A5A29C] text-sm sm:text-base leading-relaxed">
              <p>
                India’s Antarctic scientific program spans over four decades of scientific discovery. Operating year-round at <span className="text-[#F5F3EE] font-medium">Maitri Station</span> in the Schirmacher Oasis and the advanced <span className="text-[#F5F3EE] font-medium">Bharati Station</span> in the Larsemann Hills, Indian scientists conduct critical research in paleoclimate, geomagnetism, atmospheric physics, and glaciology.
              </p>
              <p>
                However, Antarctic logistics remain among the most hazardous endeavors on Earth. A resupply chain starting at the <span className="text-[#F5F3EE] font-medium">National Centre for Polar and Ocean Research (NCPOR)</span> in Goa passes through chartered ice-class vessels in Cape Town and traverses hundreds of kilometers of treacherous crevasse-ridden fast ice.
              </p>
              <p className="border-l border-[#C8A96B] pl-4 text-[#F5F3EE] font-normal italic">
                “DHRUV was built to ensure that no Indian polar expedition operates blind. One system to plan every shipment, track every person, predict every friction point, and coordinate emergency responses when minutes matter.”
              </p>

              <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-[#242424] text-xs font-mono">
                <div>
                  <span className="text-[#6F6D68] block">NCPOR HEADQUARTERS</span>
                  <span className="text-[#F5F3EE] font-bold mt-0.5 block">Goa, India</span>
                </div>
                <div>
                  <span className="text-[#6F6D68] block">MARITIME CORRIDOR</span>
                  <span className="text-[#F5F3EE] font-bold mt-0.5 block">Cape Town Staging</span>
                </div>
                <div>
                  <span className="text-[#6F6D68] block">PRIMARY RESEARCH</span>
                  <span className="text-[#F5F3EE] font-bold mt-0.5 block">Bharati Station (70°S)</span>
                </div>
                <div>
                  <span className="text-[#6F6D68] block">CONTINENTAL OASIS</span>
                  <span className="text-[#F5F3EE] font-bold mt-0.5 block">Maitri Station (70°S)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 02 ONE OPERATIONAL PICTURE                                                */}
      {/* ========================================================================= */}
      <section className="py-24 sm:py-32 bg-[#080808] border-t border-[#242424]">
        <div className="max-w-7xl mx-auto px-6 sm:px-12">
          <div className="max-w-3xl mb-16">
            <span className="text-xs font-mono tracking-[0.25em] text-[#C8A96B] uppercase block mb-3">
              02 / ONE OPERATIONAL PICTURE
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#F5F3EE] leading-tight">
              UNIFIED COMMAND ACROSS CONTINENT AND OCEAN.
            </h2>
            <p className="mt-4 text-sm sm:text-base text-[#A5A29C] leading-relaxed">
              Eliminate disconnected spreadsheets, radio logs, and siloed satellite messages. DHRUV synthesizes personnel manifests, container barcodes, vehicle telemetry, and polar weather into a single synchronized mission control.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-6 rounded bg-[#101010] border border-[#242424] hover:border-[#303030] transition-colors flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-[#6F6D68] uppercase block mb-2">DOMAIN 01</span>
                <Users className="w-5 h-5 text-[#C8A96B] mb-4" />
                <h3 className="text-base font-semibold text-[#F5F3EE] mb-2">Personnel Roster</h3>
                <p className="text-xs text-[#A5A29C] leading-relaxed">
                  Real-time status of 124 scientists and technicians. Survival certifications, medical fitness records, and check-in logs.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-[#242424] text-[10px] font-mono text-[#6F6D68]">
                ● 124 Active &bull; Zero Incident
              </div>
            </div>

            <div className="p-6 rounded bg-[#101010] border border-[#242424] hover:border-[#303030] transition-colors flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-[#6F6D68] uppercase block mb-2">DOMAIN 02</span>
                <Box className="w-5 h-5 text-[#C8A96B] mb-4" />
                <h3 className="text-base font-semibold text-[#F5F3EE] mb-2">Cargo Digital Twin</h3>
                <p className="text-xs text-[#A5A29C] leading-relaxed">
                  1,842 cargo lots individually barcoded and tracked from packing in Goa to station lab unpack in Antarctica.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-[#242424] text-[10px] font-mono text-[#6F6D68]">
                ● 1,842 Units &bull; 98.9% Clear
              </div>
            </div>

            <div className="p-6 rounded bg-[#101010] border border-[#242424] hover:border-[#303030] transition-colors flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-[#6F6D68] uppercase block mb-2">DOMAIN 03</span>
                <Database className="w-5 h-5 text-[#C8A96B] mb-4" />
                <h3 className="text-base font-semibold text-[#F5F3EE] mb-2">Station Reserves</h3>
                <p className="text-xs text-[#A5A29C] leading-relaxed">
                  Automated burn-rate telemetry for polar diesel, potable water, medical oxygen, and frozen emergency food stocks.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-[#242424] text-[10px] font-mono text-[#6F6D68]">
                ● 92% Life Support Ready
              </div>
            </div>

            <div className="p-6 rounded bg-[#101010] border border-[#242424] hover:border-[#303030] transition-colors flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-[#6F6D68] uppercase block mb-2">DOMAIN 04</span>
                <Compass className="w-5 h-5 text-[#C8A96B] mb-4" />
                <h3 className="text-base font-semibold text-[#F5F3EE] mb-2">Traverse Operations</h3>
                <p className="text-xs text-[#A5A29C] leading-relaxed">
                  Live coordinates of PistenBully convoys, field camps, and Ka-32 helicopters operating on inland glaciology runs.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-[#242424] text-[10px] font-mono text-[#6F6D68]">
                ● 08 Traverses Active
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 03 TRACK                                                                  */}
      {/* ========================================================================= */}
      <section id="features" className="py-24 sm:py-32 bg-[#050505] border-t border-[#242424]">
        <div className="max-w-7xl mx-auto px-6 sm:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5 space-y-6">
              <span className="text-xs font-mono tracking-[0.25em] text-[#C8A96B] uppercase block">
                03 / TRACK
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#F5F3EE]">
                REAL-TIME MARITIME &amp; CONTINENTAL TELEMETRY.
              </h2>
              <p className="text-sm text-[#A5A29C] leading-relaxed">
                Track every parcel, charter ship, and field party with second-by-second updates. When satcom links go silent, DHRUV retains deterministic dead-reckoning vectors.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3 text-xs">
                  <span className="text-[#C8A96B] font-mono font-bold mt-0.5">01</span>
                  <div>
                    <strong className="text-[#F5F3EE] block">Iridium Burst Positioning</strong>
                    <span className="text-[#6F6D68]">Low-bandwidth compressed packets transmitted over polar LEO constellations.</span>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-xs">
                  <span className="text-[#C8A96B] font-mono font-bold mt-0.5">02</span>
                  <div>
                    <strong className="text-[#F5F3EE] block">End-to-End Chain of Custody</strong>
                    <span className="text-[#6F6D68]">Signed transfer verification from Goa dispatch to Antarctic station master.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tactical Timeline Graphic */}
            <div className="lg:col-span-7 p-6 rounded bg-[#0A0A0A] border border-[#242424]">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#242424]">
                <span className="text-xs font-mono font-bold text-[#F5F3EE]">TRANSIT CORRIDOR TELEMETRY</span>
                <span className="text-[10px] font-mono text-[#7FAF91]">● LIVE AIS UPLINK</span>
              </div>

              <div className="space-y-4">
                {[
                  { step: "GOA CENTRAL DEPOT", loc: "NCPOR Complex", status: "COMPLETED", date: "15 NOV" },
                  { step: "CAPE TOWN STAGING", loc: "Berth 4 Cold Store", status: "COMPLETED", date: "01 DEC" },
                  { step: "CHARTERED ICEBREAKER", loc: "MV Vasiliy Golovnin", status: "COMPLETED", date: "04 DEC" },
                  { step: "PRYDZ BAY OFFSHORE", loc: "Fast Ice Mooring", status: "ACTIVE", date: "CURRENT" },
                  { step: "BHARATI STATION", loc: "Larsemann Hills", status: "PENDING", date: "+18h ETA" },
                ].map((item, idx) => (
                  <div key={item.step} className="flex items-center justify-between text-xs font-mono p-3 rounded bg-[#101010] border border-[#242424]">
                    <div className="flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full ${item.status === 'ACTIVE' ? 'bg-[#C8A96B] animate-pulse' : item.status === 'COMPLETED' ? 'bg-[#7FAF91]' : 'bg-[#303030]'}`} />
                      <div>
                        <span className="text-[#F5F3EE] font-bold block">{item.step}</span>
                        <span className="text-[10px] text-[#6F6D68]">{item.loc}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${item.status === 'ACTIVE' ? 'bg-[#1C170E] text-[#C8A96B] border border-[#C8A96B]/30' : 'text-[#6F6D68]'}`}>
                        {item.status}
                      </span>
                      <span className="block text-[9px] text-[#6F6D68] mt-0.5">{item.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 04 PREDICT                                                                */}
      {/* ========================================================================= */}
      <section className="py-24 sm:py-32 bg-[#080808] border-t border-[#242424]">
        <div className="max-w-7xl mx-auto px-6 sm:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 p-6 rounded bg-[#101010] border border-[#242424] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#242424]">
                <span className="text-xs font-mono font-bold text-[#F5F3EE]">PREDICTIVE HAZARD ASSESSMENT</span>
                <span className="text-[10px] font-mono text-[#C49A55]">68% CONFIDENCE</span>
              </div>

              <div className="p-4 rounded bg-[#0A0A0A] border border-[#242424] space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-[#F5F3EE] font-bold">CARGO TRANSFER DELAY</span>
                  <span className="font-mono text-[#C49A55]">+18 HOURS</span>
                </div>
                <p className="text-xs text-[#A5A29C] leading-relaxed">
                  Katabatic wind gusts exceeding 42 knots forecast at Prydz Bay heli-deck. Marine offload window narrows between 04:00 and 08:00 UTC.
                </p>
                <div className="pt-2 border-t border-[#242424] text-[10px] font-mono text-[#C8A96B] flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C8A96B]" />
                  <span>RECOMMENDATION: Prioritize bulk diesel hose discharge over container airlift.</span>
                </div>
              </div>

              <div className="p-4 rounded bg-[#0A0A0A] border border-[#242424] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-[#F5F3EE] font-bold">BHARATI DIESEL RUNWAY</span>
                  <span className="font-mono text-[#B85C5C]">6.9 DAYS REMAINING</span>
                </div>
                <div className="w-full h-1.5 bg-[#242424] rounded-full overflow-hidden">
                  <div className="h-full bg-[#B85C5C] w-[24%]" />
                </div>
                <span className="text-[10px] font-mono text-[#6F6D68] block">
                  Daily consumption: 180 L/day &bull; Re-supply critical threshold
                </span>
              </div>
            </div>

            <div className="lg:col-span-6 space-y-6">
              <span className="text-xs font-mono tracking-[0.25em] text-[#C8A96B] uppercase block">
                04 / PREDICT
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#F5F3EE]">
                ANTICIPATE FRICTION BEFORE THE BLIZZARD HITS.
              </h2>
              <p className="text-sm text-[#A5A29C] leading-relaxed">
                In Antarctica, reacting to failure is too late. DHRUV’s probabilistic models analyze station weather telemetry, satellite sea-ice extent, and supply burn rates to forecast stockouts and route blockages days in advance.
              </p>
              <ul className="space-y-3 text-xs text-[#A5A29C]">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C8A96B]" />
                  <span>Early blizzard advisory warnings computed 72 hours in advance</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C8A96B]" />
                  <span>Temperature-sensitive scientific payload degradation tracking</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C8A96B]" />
                  <span>Vessel mooring hold predictions under fast-ice pressure</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 05 OPTIMIZE                                                               */}
      {/* ========================================================================= */}
      <section className="py-24 sm:py-32 bg-[#050505] border-t border-[#242424]">
        <div className="max-w-7xl mx-auto px-6 sm:px-12">
          <div className="max-w-3xl mb-16">
            <span className="text-xs font-mono tracking-[0.25em] text-[#C8A96B] uppercase block mb-3">
              05 / OPTIMIZE
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#F5F3EE] leading-tight">
              DECISION-SUPPORT UNDER EXTREME CONSTRAINTS.
            </h2>
            <p className="mt-4 text-sm sm:text-base text-[#A5A29C] leading-relaxed">
              When helicopter flights are limited by katabatic winds and cargo tonnage is capped by sea-ice thickness, DHRUV computes the optimal allocation schedule. AI recommends, human command decides.
            </p>
          </div>

          <div className="p-6 rounded bg-[#0A0A0A] border border-[#242424]">
            <div className="flex items-center justify-between pb-4 border-b border-[#242424] text-xs font-mono">
              <span className="font-bold text-[#F5F3EE]">RESUPPLY ALLOCATION: BHARATI EXPERIMENTAL MODULES</span>
              <span className="text-[#C8A96B]">MULTI-CONSTRAINT SOLVER ACTIVE</span>
            </div>

            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-[#242424] text-[#6F6D68] text-[10px] uppercase">
                    <th className="py-3 px-4">PAYLOAD CATEGORY</th>
                    <th className="py-3 px-4">CURRENT MANIFEST</th>
                    <th className="py-3 px-4 text-[#C8A96B]">OPTIMIZED PROPOSAL</th>
                    <th className="py-3 px-4">VARIANCE</th>
                    <th className="py-3 px-4">RATIONALE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#242424]/60 text-[#A5A29C]">
                  <tr>
                    <td className="py-3 px-4 font-bold text-[#F5F3EE]">Polar Fuel (Grade A-1)</td>
                    <td className="py-3 px-4">4,200 L</td>
                    <td className="py-3 px-4 text-[#F5F3EE] font-bold">6,500 L</td>
                    <td className="py-3 px-4 text-[#7FAF91]">+2,300 L</td>
                    <td className="py-3 px-4 text-[11px]">Mitigate 6.9-day Bharati diesel burn threshold</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-[#F5F3EE]">Dry Science Reagents</td>
                    <td className="py-3 px-4">1,800 kg</td>
                    <td className="py-3 px-4 text-[#F5F3EE] font-bold">1,200 kg</td>
                    <td className="py-3 px-4 text-[#A5A29C]">-600 kg</td>
                    <td className="py-3 px-4 text-[11px]">Non-critical buffer deferrable to Flight #03</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-[#F5F3EE]">Generator Spares</td>
                    <td className="py-3 px-4">480 kg</td>
                    <td className="py-3 px-4 text-[#F5F3EE] font-bold">480 kg</td>
                    <td className="py-3 px-4 text-[#6F6D68]">0 kg</td>
                    <td className="py-3 px-4 text-[11px]">Direct replacement for Bharati Generator 02</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 06 RESPOND                                                                */}
      {/* ========================================================================= */}
      <section className="py-24 sm:py-32 bg-[#080808] border-t border-[#242424]">
        <div className="max-w-7xl mx-auto px-6 sm:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5 space-y-6">
              <span className="text-xs font-mono tracking-[0.25em] text-[#B85C5C] uppercase block">
                06 / RESPOND
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#F5F3EE]">
                MISSION-GRADE EMERGENCY COMMAND &amp; SAR.
              </h2>
              <p className="text-sm text-[#A5A29C] leading-relaxed">
                When a field team goes silent or a snowcat breaks down 80 km inland, the Emergency Command Center activates instantly. Telemetry analysis, nearest rescue team deployment, and route weather safety calculated in seconds.
              </p>

              <div className="p-4 rounded bg-[#101010] border border-[#B85C5C]/30 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#B85C5C] font-bold">INCIDENT PROTOCOL EM-024</span>
                  <span className="text-[#6F6D68]">ACTIVE DISPATCH</span>
                </div>
                <p className="text-xs text-[#A5A29C]">
                  Team Alpha telemetry lost 14 minutes ago during Larsemann crevasse survey. Nearest rescue team (Team Bravo) staged at Bharati West Outpost (87 km).
                </p>
                <div className="pt-2 border-t border-[#242424] flex items-center gap-2">
                  <span className="text-xs font-mono text-[#F5F3EE]">AI Recommendation: Deploy Bravo via Ridge Route 2</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 p-6 rounded bg-[#0A0A0A] border border-[#242424] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#242424]">
                <span className="text-xs font-mono font-bold text-[#F5F3EE]">SEARCH &amp; RESCUE (SAR) TELEMETRY</span>
                <span className="text-[10px] font-mono text-[#B85C5C]">HIGH RISK</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs font-mono">
                <div className="p-3 rounded bg-[#101010] border border-[#242424]">
                  <span className="text-[#6F6D68] text-[10px] block">AFFECTED</span>
                  <span className="text-lg font-bold text-[#F5F3EE] mt-1 block">04</span>
                  <span className="text-[9px] text-[#A5A29C]">Scientists</span>
                </div>
                <div className="p-3 rounded bg-[#101010] border border-[#242424]">
                  <span className="text-[#6F6D68] text-[10px] block">DISTANCE</span>
                  <span className="text-lg font-bold text-[#F5F3EE] mt-1 block">87 KM</span>
                  <span className="text-[9px] text-[#A5A29C]">From Bharati</span>
                </div>
                <div className="p-3 rounded bg-[#101010] border border-[#242424]">
                  <span className="text-[#6F6D68] text-[10px] block">WEATHER</span>
                  <span className="text-lg font-bold text-[#C49A55] mt-1 block">34 KT</span>
                  <span className="text-[9px] text-[#A5A29C]">Headwind</span>
                </div>
                <div className="p-3 rounded bg-[#101010] border border-[#242424]">
                  <span className="text-[#6F6D68] text-[10px] block">ETA RESCUE</span>
                  <span className="text-lg font-bold text-[#7FAF91] mt-1 block">1h 45m</span>
                  <span className="text-[9px] text-[#A5A29C]">Via Snowcat</span>
                </div>
              </div>

              {/* Human Approval Visual Bar */}
              <div className="p-4 rounded bg-[#101010] border border-[#303030] flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-mono font-bold text-[#F5F3EE] block">HUMAN COMMAND AUTHORITY REQUIRED</span>
                  <span className="text-[11px] text-[#A5A29C]">Confirm dispatch order for PistenBully AST-BHR-004.</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-3 py-1.5 rounded bg-[#F5F3EE] text-[#050505] text-xs font-bold tracking-wider">
                    APPROVE
                  </span>
                  <span className="px-3 py-1.5 rounded bg-transparent border border-[#303030] text-[#A5A29C] text-xs font-mono">
                    MODIFY
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 07 BUILT FOR THE EXTREME                                                  */}
      {/* ========================================================================= */}
      <section className="py-24 sm:py-32 bg-[#050505] border-t border-[#242424]">
        <div className="max-w-7xl mx-auto px-6 sm:px-12">
          <div className="max-w-3xl mb-16">
            <span className="text-xs font-mono tracking-[0.25em] text-[#C8A96B] uppercase block mb-3">
              07 / BUILT FOR THE EXTREME
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#F5F3EE] leading-tight">
              OFFLINE-FIRST. ZERO-CONNECTIVITY RESILIENCE.
            </h2>
            <p className="mt-4 text-sm sm:text-base text-[#A5A29C] leading-relaxed">
              Polar ionospheric disturbances sever satellite links without warning. DHRUV was architected from the bare metal to execute offline with full local IndexedDB persistence, queuing mutations and reconciling deterministically upon link resumption.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded bg-[#0A0A0A] border border-[#242424]">
              <WifiOff className="w-5 h-5 text-[#C8A96B] mb-4" />
              <h3 className="text-base font-semibold text-[#F5F3EE] mb-2">Zero Data Loss Cache</h3>
              <p className="text-xs text-[#A5A29C] leading-relaxed">
                Field tablets and station terminals maintain complete local copies of manifests, personnel vitals, and asset logs. Actions stage automatically in offline queues.
              </p>
            </div>

            <div className="p-6 rounded bg-[#0A0A0A] border border-[#242424]">
              <Radio className="w-5 h-5 text-[#C8A96B] mb-4" />
              <h3 className="text-base font-semibold text-[#F5F3EE] mb-2">Iridium Burst Sync</h3>
              <p className="text-xs text-[#A5A29C] leading-relaxed">
                When a 128-byte satellite window opens, queued changes are compressed and synchronized in milliseconds, minimizing costly Antarctic satcom charges.
              </p>
            </div>

            <div className="p-6 rounded bg-[#0A0A0A] border border-[#242424]">
              <ShieldCheck className="w-5 h-5 text-[#C8A96B] mb-4" />
              <h3 className="text-base font-semibold text-[#F5F3EE] mb-2">Cryptographic Audit</h3>
              <p className="text-xs text-[#A5A29C] leading-relaxed">
                Every scan, handover, and burn-rate adjustment receives a tamper-evident cryptographic hash, guaranteeing audit readiness for government oversight.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 08 INTELLIGENCE                                                           */}
      {/* ========================================================================= */}
      <section className="py-24 sm:py-32 bg-[#080808] border-t border-[#242424]">
        <div className="max-w-7xl mx-auto px-6 sm:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5 space-y-6">
              <span className="text-xs font-mono tracking-[0.25em] text-[#C8A96B] uppercase block">
                08 / INTELLIGENCE
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#F5F3EE]">
                POLAR RISK INDEX &amp; DETERMINISTIC WHAT-IF.
              </h2>
              <p className="text-sm text-[#A5A29C] leading-relaxed">
                Synthesize multi-source environmental variables into an actionable operational risk score. Simulate compound disruptions like simultaneous vessel delays and katabatic squalls before committing valuable field resources.
              </p>
              <div className="pt-2">
                <Link
                  href="/intelligence/what-if"
                  className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-[#F5F3EE] hover:text-[#C8A96B] transition-colors"
                >
                  <span>Explore What-If Simulator</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-7 p-6 rounded bg-[#101010] border border-[#242424] space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#242424]">
                <span className="text-xs font-mono font-bold text-[#F5F3EE]">POLAR OPERATIONAL RISK INDEX</span>
                <span className="text-xs font-mono text-[#C49A55] font-bold">SCORE: 67 (MODERATE)</span>
              </div>

              <div className="space-y-3 font-mono text-xs">
                {[
                  { domain: "WEATHER HAZARD", val: 78, status: "HIGH", color: "bg-[#C49A55]" },
                  { domain: "SEA ICE PRESSURE", val: 84, status: "CRITICAL", color: "bg-[#B85C5C]" },
                  { domain: "CARGO TRANSIT", val: 52, status: "MODERATE", color: "bg-[#C8A96B]" },
                  { domain: "PERSONNEL SAFETY", val: 28, status: "NOMINAL", color: "bg-[#7FAF91]" },
                  { domain: "STATION FUEL BURN", val: 74, status: "HIGH", color: "bg-[#C49A55]" },
                ].map((risk) => (
                  <div key={risk.domain} className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#A5A29C]">{risk.domain}</span>
                      <span className="text-[#F5F3EE]">{risk.val}/100 &bull; {risk.status}</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#242424] rounded-full overflow-hidden">
                      <div className={`h-full ${risk.color}`} style={{ width: `${risk.val}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 09 IMPACT                                                                 */}
      {/* ========================================================================= */}
      <section id="impact" className="py-24 sm:py-32 bg-[#050505] border-t border-[#242424]">
        <div className="max-w-7xl mx-auto px-6 sm:px-12">
          <div className="max-w-3xl mb-16">
            <span className="text-xs font-mono tracking-[0.25em] text-[#C8A96B] uppercase block mb-3">
              09 / IMPACT
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#F5F3EE] leading-tight">
              PROVEN RESILIENCE AT SCALE.
            </h2>
            <p className="mt-4 text-sm sm:text-base text-[#A5A29C] leading-relaxed">
              DHRUV transforms operational risk management across India’s National Antarctic Scientific Expeditions.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-6 rounded bg-[#0A0A0A] border border-[#242424]">
              <span className="text-3xl sm:text-4xl font-mono font-bold text-[#F5F3EE] block">2</span>
              <span className="text-xs font-bold text-[#A5A29C] mt-2 block">Research Stations</span>
              <span className="text-[10px] font-mono text-[#6F6D68] mt-1 block">Maitri &amp; Bharati Supported</span>
            </div>

            <div className="p-6 rounded bg-[#0A0A0A] border border-[#242424]">
              <span className="text-3xl sm:text-4xl font-mono font-bold text-[#F5F3EE] block">124</span>
              <span className="text-xs font-bold text-[#A5A29C] mt-2 block">Scientists &amp; Crew</span>
              <span className="text-[10px] font-mono text-[#6F6D68] mt-1 block">Continuous Health Telemetry</span>
            </div>

            <div className="p-6 rounded bg-[#0A0A0A] border border-[#242424]">
              <span className="text-3xl sm:text-4xl font-mono font-bold text-[#F5F3EE] block">1,842</span>
              <span className="text-xs font-bold text-[#A5A29C] mt-2 block">Cargo Units Tracked</span>
              <span className="text-[10px] font-mono text-[#6F6D68] mt-1 block">0 Lost Shipments</span>
            </div>

            <div className="p-6 rounded bg-[#0A0A0A] border border-[#242424]">
              <span className="text-3xl sm:text-4xl font-mono font-bold text-[#C8A96B] block">98.4%</span>
              <span className="text-xs font-bold text-[#A5A29C] mt-2 block">Operational Uptime</span>
              <span className="text-[10px] font-mono text-[#6F6D68] mt-1 block">Sub-Zero Reliability</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 10 TECHNOLOGY                                                             */}
      {/* ========================================================================= */}
      <section id="technology" className="py-24 sm:py-32 bg-[#080808] border-t border-[#242424]">
        <div className="max-w-7xl mx-auto px-6 sm:px-12">
          <div className="max-w-3xl mb-16">
            <span className="text-xs font-mono tracking-[0.25em] text-[#C8A96B] uppercase block mb-3">
              10 / TECHNOLOGY
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#F5F3EE] leading-tight">
              MISSION-GRADE ARCHITECTURE.
            </h2>
            <p className="mt-4 text-sm sm:text-base text-[#A5A29C] leading-relaxed">
              Engineered with modern frontend primitives to deliver zero-latency responsiveness in demanding low-bandwidth environments.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-mono">
            <div className="p-5 rounded bg-[#101010] border border-[#242424] space-y-2">
              <span className="text-[#C8A96B] font-bold block">01 / NEXT.JS 14 APP ROUTER</span>
              <p className="text-[#A5A29C] font-sans text-xs leading-relaxed">
                Hybrid server and client component rendering with precompiled static pages and instant client transitions.
              </p>
            </div>

            <div className="p-5 rounded bg-[#101010] border border-[#242424] space-y-2">
              <span className="text-[#C8A96B] font-bold block">02 / LOCAL INDEXEDDB CACHE</span>
              <p className="text-[#A5A29C] font-sans text-xs leading-relaxed">
                Full-fidelity client database via Dexie.js for uninterrupted operational logging during satcom blackouts.
              </p>
            </div>

            <div className="p-5 rounded bg-[#101010] border border-[#242424] space-y-2">
              <span className="text-[#C8A96B] font-bold block">03 / POLAR VECTOR CARTOGRAPHY</span>
              <p className="text-[#A5A29C] font-sans text-xs leading-relaxed">
                Antarctic stereographic coordinate projections styled in dark monochrome for tactical clarity.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 11 TEAM                                                                   */}
      {/* ========================================================================= */}
      <section id="team" className="py-24 sm:py-32 bg-[#050505] border-t border-[#242424]">
        <div className="max-w-7xl mx-auto px-6 sm:px-12">
          <div className="max-w-3xl mb-16">
            <span className="text-xs font-mono tracking-[0.25em] text-[#C8A96B] uppercase block mb-3">
              11 / THE EXPEDITION &amp; COMMAND LEADERSHIP
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#F5F3EE] leading-tight">
              DEDICATED TO INDIA’S POLAR SCIENTISTS.
            </h2>
            <p className="mt-4 text-sm sm:text-base text-[#A5A29C] leading-relaxed">
              Designed in collaboration with operational coordinators, polar medical officers, and traverse leaders at NCPOR.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: "Dr. Rajesh Sharan", role: "Expedition Leader", affiliation: "46th ISEA &bull; Maitri", spec: "Atmospheric Physics" },
              { name: "Cmdr. Vivek Nair", role: "Logistics Master", affiliation: "NCPOR Central Operations", spec: "Ice Navigation &amp; Airlift" },
              { name: "Dr. Ananya Sen", role: "Station Medical Officer", affiliation: "Bharati Station", spec: "Hypothermia &amp; Trauma SAR" },
              { name: "Prof. K. Raman", role: "Chief Glaciologist", affiliation: "Larsemann Traverse Lead", spec: "Crevasse Mapping" },
            ].map((member) => (
              <div key={member.name} className="p-5 rounded bg-[#0A0A0A] border border-[#242424] space-y-3">
                <div className="w-10 h-10 rounded bg-[#151515] border border-[#303030] flex items-center justify-center text-xs font-mono font-bold text-[#F5F3EE]">
                  {member.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#F5F3EE]">{member.name}</h3>
                  <span className="text-[11px] font-mono text-[#C8A96B] block mt-0.5">{member.role}</span>
                </div>
                <div className="pt-2 border-t border-[#242424] text-[10px] font-mono text-[#6F6D68]">
                  <span>{member.affiliation}</span>
                  <span className="block text-[#A5A29C] mt-0.5">{member.spec}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 12 FINAL CTA                                                              */}
      {/* ========================================================================= */}
      <section id="contact" className="py-24 sm:py-36 bg-[#080808] border-t border-[#242424]">
        <div className="max-w-4xl mx-auto px-6 sm:px-12 text-center">
          <span className="text-xs font-mono tracking-[0.3em] text-[#C8A96B] uppercase block mb-4">
            12 / EXPEDITION ACCESS
          </span>
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#F5F3EE] leading-tight">
            FARTHER TODAY.
            <span className="block text-[#C8A96B] mt-1">SAFER TOMORROW.</span>
          </h2>
          <p className="mt-5 text-sm sm:text-base text-[#A5A29C] max-w-xl mx-auto leading-relaxed">
            Launch DHRUV to access live cargo manifests, inventory depletion models, and tactical geospatial monitoring for the 46th Indian Scientific Expedition to Antarctica.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-3 px-8 py-3.5 rounded bg-[#F5F3EE] text-[#050505] hover:bg-[#FFFFFF] border border-[#E7E0D2] font-semibold text-xs tracking-wider uppercase transition-all hover:translate-x-0.5 active:scale-[0.99] shadow-sm"
            >
              <span>LAUNCH DHRUV MISSION CONTROL</span>
              <ArrowRight className="w-4 h-4 text-[#050505]" />
            </Link>

            <Link
              href="/operations/map"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded bg-transparent hover:bg-[#101010] text-[#F5F3EE] border border-[#303030] text-xs font-mono transition-all"
            >
              <span>Tactical Operations Map</span>
            </Link>
          </div>

          <div className="mt-16 pt-8 border-t border-[#242424] text-xs font-mono text-[#6F6D68] flex flex-col sm:flex-row items-center justify-between gap-4">
            <span>National Centre for Polar and Ocean Research (NCPOR)</span>
            <span>Ministry of Earth Sciences &bull; Government of India</span>
          </div>
        </div>
      </section>
    </div>
  );
};
