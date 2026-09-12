import React from "react";
import { Users, Box, Database, Truck, Compass, CloudSnow, ShieldAlert, Cpu } from "lucide-react";

export const OneOperationalPictureSection: React.FC = () => {
  const nodes = [
    {
      title: "People",
      desc: "Expedition personnel, medical fitness, training certifications & real-time field check-ins.",
      icon: Users,
      color: "text-[#C8C8C5]",
      border: "border-[#303030]",
      glow: "shadow-[0_0_15px_rgba(200,200,197,0.1)]",
    },
    {
      title: "Cargo",
      desc: "ISO containers, scientific instrumentation, QR custody verification & transit timeline.",
      icon: Box,
      color: "text-polar-cyan",
      border: "border-polar-cyan/40",
      glow: "shadow-[0_0_15px_rgba(200,169,107,0.15)]",
    },
    {
      title: "Inventory",
      desc: "Station fuel reserves, food rations, consumable forecasts & safety threshold tracking.",
      icon: Database,
      color: "text-polar-teal",
      border: "border-polar-teal/40",
      glow: "shadow-[0_0_15px_rgba(200,200,197,0.12)]",
    },
    {
      title: "Assets",
      desc: "PistenBully groomers, prime generators, radomes & preventive maintenance health.",
      icon: Truck,
      color: "text-[#C49A55]",
      border: "border-[#C49A55]/40",
      glow: "shadow-[0_0_15px_rgba(196,154,85,0.15)]",
    },
    {
      title: "Missions",
      desc: "Inland ice traverse routes, waypoint progression & communication telemetry status.",
      icon: Compass,
      color: "text-[#C8C8C5]",
      border: "border-[#303030]",
      glow: "shadow-[0_0_15px_rgba(200,200,197,0.1)]",
    },
    {
      title: "Environment",
      desc: "Real-time katabatic wind vectors, satellite sea-ice thickness & blizzard alerts.",
      icon: CloudSnow,
      color: "text-[#C8C8C5]",
      border: "border-[#303030]",
      glow: "shadow-[0_0_15px_rgba(200,200,197,0.1)]",
    },
    {
      title: "Emergency",
      desc: "Incident escalation, survival windows & AI-recommended rescue dispatch plans.",
      icon: ShieldAlert,
      color: "text-red-400",
      border: "border-red-500/40",
      glow: "shadow-[0_0_15px_rgba(248,113,113,0.15)]",
    },
  ];

  return (
    <section className="py-24 sm:py-32 bg-polar-midnight relative overflow-hidden border-t border-polar-border">
      {/* Subtle polar coordinate rings in background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
        <div className="w-[500px] h-[500px] rounded-full border border-dashed border-polar-cyan/30 animate-[spin_120s_linear_infinite]" />
        <div className="w-[800px] h-[800px] rounded-full border border-polar-border/40" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-polar-cyan tracking-widest uppercase mb-2">
            <span>02 &bull; Unified Architecture</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
            ONE OPERATIONAL PICTURE
          </h2>
          <p className="mt-4 text-sm sm:text-base text-polar-muted leading-relaxed">
            DHRUV replaces disparate spreadsheets, paper manifests, and fragmented radio dispatches with an integrated operational core connecting every facet of Indian polar expeditions.
          </p>
        </div>

        {/* Tactical Relationship Core Visual */}
        <div className="relative max-w-5xl mx-auto">
          {/* Central DHRUV Core Hub */}
          <div className="mb-10 p-6 rounded-xl bg-gradient-to-b from-polar-deep to-polar-surface border border-polar-cyan/40 shadow-[0_0_35px_rgba(200,169,107,0.16)] max-w-md mx-auto text-center">
            <div className="w-12 h-12 rounded-lg bg-polar-cyan/10 border border-polar-cyan/40 flex items-center justify-center mx-auto mb-3">
              <Cpu className="w-6 h-6 text-polar-cyan" />
            </div>
            <h3 className="text-lg font-bold text-white tracking-wider">DHRUV OPERATIONAL CORE</h3>
            <p className="text-xs text-polar-muted mt-1">
              Synchronized Central Intelligence &bull; Offline-First Distributed Engine
            </p>
          </div>

          {/* Connected Domain Orbit Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {nodes.map((node) => {
              const Icon = node.icon;
              return (
                <div
                  key={node.title}
                  className={`p-5 rounded-lg bg-polar-deep/80 border ${node.border} ${node.glow} hover:bg-polar-surface/90 transition-all flex flex-col justify-between group`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className={`p-2 rounded bg-polar-midnight/80 ${node.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-mono text-polar-muted tracking-widest uppercase">
                        LINK ACTIVE
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-polar-snow uppercase tracking-wide group-hover:text-white transition-colors">
                      {node.title}
                    </h4>
                    <p className="text-xs text-polar-muted mt-2 leading-relaxed">
                      {node.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
