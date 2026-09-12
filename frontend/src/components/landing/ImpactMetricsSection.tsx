import React from "react";
import { CheckCircle2, TrendingUp, ShieldCheck, Clock } from "lucide-react";

export const ImpactMetricsSection: React.FC = () => {
  const metrics = [
    {
      value: "92%",
      label: "Expedition Readiness Index",
      desc: "Measured across 124 deployed personnel, vehicle service status, and medical clearance audits for 46th ISEA.",
      icon: CheckCircle2,
    },
    {
      value: "1,842 t",
      label: "Cargo Visibility & Tracking",
      desc: "Zero untracked manifests across Goa, Cape Town, and offshore icebreaker offloading corridors.",
      icon: TrendingUp,
    },
    {
      value: "100%",
      label: "Station Inventory Precision",
      desc: "Automated daily consumption logs ensuring minimum 10-day safety reserves on fuel and thermal generation.",
      icon: ShieldCheck,
    },
    {
      value: "<15 min",
      label: "Emergency Dispatch Triage",
      desc: "Instant synthesis of rescue vehicle readiness, telemetry anomalies, and katabatic weather flight windows.",
      icon: Clock,
    },
  ];

  return (
    <section id="impact" className="py-24 sm:py-32 bg-polar-navy relative border-t border-polar-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-polar-cyan tracking-widest uppercase mb-2">
            <span>07 &bull; Institutional Impact</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
            MEASURABLE OPERATIONAL IMPACT
          </h2>
          <p className="mt-4 text-sm sm:text-base text-polar-muted leading-relaxed">
            Tangible operational improvements engineered for the National Centre for Polar and Ocean Research and expedition field commanders.
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="p-6 rounded-lg bg-polar-deep/70 border border-polar-border hover:border-polar-teal/40 transition-all flex flex-col justify-between text-left"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-3xl sm:text-4xl font-extrabold font-mono text-transparent bg-clip-text bg-gradient-to-r from-polar-cyan to-polar-teal">
                      {item.value}
                    </span>
                    <Icon className="w-5 h-5 text-polar-teal" />
                  </div>
                  <h3 className="text-sm font-bold text-polar-snow mb-2">
                    {item.label}
                  </h3>
                  <p className="text-xs text-polar-muted leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
