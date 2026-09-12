import React from "react";
import { AlertTriangle, Compass, Radio, Snowflake } from "lucide-react";

export const TheChallengeSection: React.FC = () => {
  return (
    <section id="challenge" className="py-24 sm:py-32 bg-polar-navy relative border-t border-polar-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-polar-cyan tracking-widest uppercase mb-2">
              <span>01 &bull; Operational Reality</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              OPERATING AT THE EDGE <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-polar-cyan to-polar-teal">
                OF THE PLANET
              </span>
            </h2>
          </div>
          <p className="max-w-md text-sm text-polar-muted leading-relaxed">
            Antarctic expedition logistics are fundamentally different from standard enterprise supply chains. A single supply error or weather miscalculation carries existential consequences.
          </p>
        </div>

        {/* Editorial Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Editorial Text - 7 Columns */}
          <div className="lg:col-span-7 space-y-8 text-sm sm:text-base text-polar-snow/85 leading-relaxed font-normal">
            <p className="text-lg text-polar-snow font-medium border-l-2 border-polar-cyan pl-4">
              Over 11,000 kilometers separate the headquarters of the National Centre for Polar and Ocean Research in Goa from India&apos;s Maitri and Bharati stations in Antarctica.
            </p>
            <p>
              Logistics for the Indian Scientific Expedition to Antarctica (ISEA) require orchestrating chartered icebreakers, polar-adapted aircraft, snow tractors, scientific instruments, and life-critical supplies across international maritime jurisdictions and extreme high-latitude ice sheets.
            </p>
            <p>
              Historically, operations relied on fragmented manifests, disconnected radio communications, and manual spreadsheets maintained by individual teams. When katabatic winds reach 50 knots or pack ice closes around an offloading vessel, operational decisions must be made in minutes—not days.
            </p>

            {/* Tactical Callout Box */}
            <div className="p-5 rounded-lg bg-polar-deep/90 border border-polar-border text-xs leading-relaxed text-polar-muted">
              <span className="text-polar-gold font-bold uppercase tracking-wider block mb-1">
                The Non-Negotiable Constraint
              </span>
              In Antarctica, there are no commercial resupplies during the polar winter. If fuel reserves or generator spare kits fall below survival margins, emergency intervention requires international air cooperation under extreme risk.
            </div>
          </div>

          {/* Environmental Friction Indicators - 5 Columns */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-5 rounded-lg bg-polar-deep/60 border border-polar-border/80 hover:border-polar-border transition-colors">
              <div className="flex items-center gap-3 text-polar-cyan mb-2">
                <Snowflake className="w-4 h-4" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-polar-snow">
                  Environmental Extremes
                </h3>
              </div>
              <p className="text-xs text-polar-muted leading-relaxed">
                Temperatures plunge to -50°C and katabatic winds exceed 40 knots, grounding helicopters and trapping traverse vehicles in zero-visibility whiteouts.
              </p>
            </div>

            <div className="p-5 rounded-lg bg-polar-deep/60 border border-polar-border/80 hover:border-polar-border transition-colors">
              <div className="flex items-center gap-3 text-polar-teal mb-2">
                <Compass className="w-4 h-4" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-polar-snow">
                  Multi-Modal Transit Chains
                </h3>
              </div>
              <p className="text-xs text-polar-muted leading-relaxed">
                Cargo shifts from Indian ports to Cape Town staging, then onto icebreakers, and finally transfers via helicopter slings and tracked sledges over crevasse-riddled ice shelves.
              </p>
            </div>

            <div className="p-5 rounded-lg bg-polar-deep/60 border border-polar-border/80 hover:border-polar-border transition-colors">
              <div className="flex items-center gap-3 text-polar-gold mb-2">
                <Radio className="w-4 h-4" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-polar-snow">
                  Intermittent Telemetry
                </h3>
              </div>
              <p className="text-xs text-polar-muted leading-relaxed">
                Auroral interference, solar storms, and high-latitude satellite orbital coverage cause frequent telemetry dropouts that require resilient offline operations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
