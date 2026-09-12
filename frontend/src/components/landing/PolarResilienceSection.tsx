import React from "react";
import { WifiOff, RefreshCw, HardDrive, ShieldCheck, Radio } from "lucide-react";

export const PolarResilienceSection: React.FC = () => {
  const points = [
    {
      title: "Offline-First Local Storage",
      desc: "Every manifest, personnel record, and mission plan is cached locally in browser IndexedDB via Dexie. Operators can continue full data entry during satellite blackouts.",
      icon: HardDrive,
    },
    {
      title: "Resilient Asynchronous Sync",
      desc: "Actions taken while offline are staged in a persistent FIFO queue. When high-latitude satellite communication restores, DHRUV replays updates with conflict resolution.",
      icon: RefreshCw,
    },
    {
      title: "Degraded Bandwidth Operation",
      desc: "Lightweight JSON delta sync minimizes payload sizes for high-cost Iridium and satellite links, eliminating heavy assets during remote field operations.",
      icon: Radio,
    },
    {
      title: "Clear Connection State Visibility",
      desc: "Station duty officers always know the system status via non-intrusive indicators: Operational (Live), Syncing (Data transmitting), or Offline (Cached mode).",
      icon: WifiOff,
    },
  ];

  return (
    <section className="py-24 sm:py-32 bg-polar-midnight relative border-t border-polar-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Heading & Narrative */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 text-xs font-mono text-polar-cyan tracking-widest uppercase">
              <span>06 &bull; Extreme Architecture</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              ENGINEERED FOR ZERO-CONNECTIVITY
            </h2>
            <p className="text-sm sm:text-base text-polar-muted leading-relaxed">
              Modern web software assumes continuous 5G and ubiquitous cloud connectivity. In Antarctica, the cloud is 11,000 km away across narrow satellite footprints.
            </p>
            <p className="text-sm text-polar-snow/80 leading-relaxed">
              DHRUV is built ground-up with an offline-first architecture. Stations and field traverse teams operate autonomously without ever losing operational state or data integrity.
            </p>

            <div className="pt-2">
              <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-lg bg-polar-deep/90 border border-polar-border text-xs font-mono text-polar-snow">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>IndexedDB Dexie Active &bull; Instant Local Fallback</span>
              </div>
            </div>
          </div>

          {/* Right Column: 4 Architecture Feature Tiles */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {points.map((pt) => {
              const Icon = pt.icon;
              return (
                <div
                  key={pt.title}
                  className="p-5 rounded-lg bg-polar-deep/70 border border-polar-border/80 hover:border-polar-cyan/40 transition-colors"
                >
                  <div className="p-2.5 rounded bg-polar-midnight/80 text-polar-cyan w-fit mb-3">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-polar-snow mb-1.5">
                    {pt.title}
                  </h3>
                  <p className="text-xs text-polar-muted leading-relaxed">
                    {pt.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
