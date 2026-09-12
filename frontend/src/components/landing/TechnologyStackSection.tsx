import React from "react";
import { Server, Database, Globe, Cpu, Layers, HardDrive } from "lucide-react";

export const TechnologyStackSection: React.FC = () => {
  const stack = [
    {
      layer: "Presentation & Edge",
      tech: "Next.js & React App Router",
      desc: "Server-side streaming, zero-bundle overhead UI, Tailwind CSS, and strict TypeScript verification.",
      icon: Globe,
    },
    {
      layer: "Application Services",
      tech: "FastAPI REST Core",
      desc: "High-throughput asynchronous Python microservices ready for real-time telemetry pipelines.",
      icon: Server,
    },
    {
      layer: "Geospatial Intelligence",
      tech: "PostGIS & MapLibre GL",
      desc: "Vector-tile rendering of high-latitude Antarctic Antarctic projections and vessel tracking corridors.",
      icon: Layers,
    },
    {
      layer: "Persistent Data Store",
      tech: "PostgreSQL with TimescaleDB",
      desc: "Relational persistence with time-series partitions for sensor telemetry and environmental feeds.",
      icon: Database,
    },
    {
      layer: "Predictive Analytics",
      tech: "AI / ML Operational Models",
      desc: "Non-magical time-series forecasting, hazard probability scoring, and constraint satisfaction solvers.",
      icon: Cpu,
    },
    {
      layer: "Offline Synchronization",
      tech: "IndexedDB / Dexie Engine",
      desc: "Full browser-side local persistence with optimistic queuing and automated recovery replay.",
      icon: HardDrive,
    },
  ];

  return (
    <section id="technology" className="py-24 sm:py-32 bg-polar-midnight relative border-t border-polar-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="max-w-3xl mb-16">
          <div className="flex items-center gap-2 text-xs font-mono text-polar-cyan tracking-widest uppercase mb-2">
            <span>08 &bull; Engineering Architecture</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
            BUILT FOR MISSION-GRADE DURABILITY
          </h2>
          <p className="mt-4 text-sm sm:text-base text-polar-muted leading-relaxed">
            Engineered with strict separation of concerns, decoupled API contracts, and robust state persistence capable of operating from Goa command to Maitri and Bharati stations.
          </p>
        </div>

        {/* Stack Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stack.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.tech}
                className="p-6 rounded-lg bg-polar-deep/70 border border-polar-border hover:border-polar-borderLight transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-mono tracking-widest text-polar-muted uppercase">
                    {item.layer}
                  </span>
                  <div className="p-2 rounded bg-polar-midnight text-polar-cyan">
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-base font-bold text-polar-snow mb-2">
                  {item.tech}
                </h3>
                <p className="text-xs text-polar-muted leading-relaxed">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
