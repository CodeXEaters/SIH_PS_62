import React from "react";
import Link from "next/link";
import { Compass, Box, Users, Database, MapPin, Brain, ShieldAlert, ArrowUpRight } from "lucide-react";

export const CoreCapabilitiesSection: React.FC = () => {
  const capabilities = [
    {
      title: "Expedition Planning",
      href: "/expeditions",
      icon: Compass,
      highlight: "Milestone Sequencing",
      desc: "Constraint-driven mission timeline orchestration accounting for weather windows, ship berths, aircraft payloads, and station capacity limits.",
    },
    {
      title: "Cargo & Logistics Tracking",
      href: "/cargo",
      icon: Box,
      highlight: "Digital Twin & Chain of Custody",
      desc: "End-to-end container tracking from Goa port to Antarctic ice sheets with camera QR scanning and immutable transfer logs.",
    },
    {
      title: "Personnel Management",
      href: "/personnel",
      icon: Users,
      highlight: "Crew Readiness & Health",
      desc: "Complete roster oversight covering polar survival certifications, medical clearances, team rotations, and real-time field check-ins.",
    },
    {
      title: "Inventory & Asset Health",
      href: "/inventory",
      icon: Database,
      highlight: "Consumption & Days-to-Empty",
      desc: "Station fuel tanks, food rations, and machinery telemetry with predictive days-remaining curves to avoid mid-winter stockouts.",
    },
    {
      title: "Geospatial Operations Map",
      href: "/operations/map",
      icon: MapPin,
      highlight: "MapLibre High-Latitude Canvas",
      desc: "Tactical dark Antarctic map displaying Maitri, Bharati, offshore vessels, flight corridors, and live field teams with one-click inspection.",
    },
    {
      title: "Predictive Intelligence",
      href: "/intelligence",
      icon: Brain,
      highlight: "What-If Simulation Engine",
      desc: "Statistical risk modeling, anomaly detection on telemetry drops, and interactive what-if scenarios for voyage disruptions.",
    },
    {
      title: "Emergency Command Room",
      href: "/emergency",
      icon: ShieldAlert,
      highlight: "Incident Decision Support",
      desc: "Tier-1 search and rescue dispatch room displaying affected personnel, local blizzard factors, and AI response options requiring commander sign-off.",
    },
  ];

  return (
    <section id="capabilities" className="py-24 sm:py-32 bg-polar-midnight relative border-t border-polar-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-polar-cyan tracking-widest uppercase mb-2">
              <span>04 &bull; Functional Capabilities</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              MISSION-CRITICAL CAPABILITIES
            </h2>
          </div>
          <p className="max-w-md text-sm text-polar-muted leading-relaxed">
            Built purposefully for polar operators, scientific directors, and logistics commanders who cannot afford system failure.
          </p>
        </div>

        {/* Editorial Composition */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {capabilities.map((cap, idx) => {
            const Icon = cap.icon;
            const isWide = idx === 6; // Emergency command spans 2 columns or full on desktop
            return (
              <div
                key={cap.title}
                className={`p-6 rounded-lg bg-polar-deep/60 border border-polar-border hover:border-polar-cyan/50 transition-all flex flex-col justify-between group ${
                  isWide ? "lg:col-span-3 bg-gradient-to-r from-polar-deep to-polar-surface" : ""
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 rounded bg-polar-midnight/80 text-polar-cyan border border-polar-border group-hover:scale-105 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono font-semibold text-polar-gold tracking-widest uppercase">
                      {cap.highlight}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-polar-snow group-hover:text-polar-cyan transition-colors mb-2">
                    {cap.title}
                  </h3>
                  <p className="text-xs text-polar-muted leading-relaxed">
                    {cap.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-polar-border/50 flex items-center justify-between">
                  <Link
                    href={cap.href}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-polar-cyan hover:text-white transition-colors"
                  >
                    <span>Open Module</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                  <span className="text-[10px] font-mono text-polar-muted">
                    0{idx + 1}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
