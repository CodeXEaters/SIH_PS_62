import React from "react";
import { TrendingDown, AlertOctagon, Sliders, ShieldCheck, CheckCircle2 } from "lucide-react";

export const IntelligenceLayerSection: React.FC = () => {
  const models = [
    {
      type: "Prediction",
      name: "Cargo Delay Probability Model",
      metric: "68% probability flagged",
      input: "Wind gusts >35kt & pack ice velocity",
      output: "Est. +18h arrival delay; recommended flight window next morning at 06:00 UTC.",
      icon: TrendingDown,
    },
    {
      type: "Assessment",
      name: "Consumables & Fuel Depletion Forecasting",
      metric: "6.9 days remaining threshold",
      input: "Station thermal generator burn rate & external -25°C chilling",
      output: "Projected tank dry date identified 4 days ahead of critical threshold.",
      icon: AlertOctagon,
    },
    {
      type: "Optimization",
      name: "Resupply Multi-Constraint Solver",
      metric: "AI Recommends, Human Approves",
      input: "Helicopter payload, ice thickness, fuel priorities",
      output: "Optimal allocation between scientific crates and life-support diesel drums.",
      icon: Sliders,
    },
    {
      type: "Simulation",
      name: "What-If Scenario Stress Testing",
      metric: "Interactive parameter exploration",
      input: "Vessel delay +4 days, aircraft grounded, fuel burn +20%",
      output: "Instant re-computation of station reserve curves and contingency actions.",
      icon: ShieldCheck,
    },
  ];

  return (
    <section className="py-24 sm:py-32 bg-polar-navy relative border-t border-polar-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="max-w-3xl mb-16">
          <div className="flex items-center gap-2 text-xs font-mono text-polar-cyan tracking-widest uppercase mb-2">
            <span>05 &bull; Predictive Intelligence</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
            NOT MARKETING MAGIC. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-polar-cyan to-polar-teal">
              DECISION-SUPPORT MATHEMATICS.
            </span>
          </h2>
          <p className="mt-4 text-sm sm:text-base text-polar-muted leading-relaxed">
            DHRUV avoids black-box claims. The platform pairs statistical modeling, time-series forecasting, and operational constraint satisfaction algorithms to assist expedition commanders with clear, inspectable guidance.
          </p>
        </div>

        {/* Model Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {models.map((model) => {
            const Icon = model.icon;
            return (
              <div
                key={model.name}
                className="p-6 rounded-lg bg-polar-deep/70 border border-polar-border hover:border-polar-cyan/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-mono font-bold tracking-widest text-polar-cyan uppercase px-2 py-0.5 rounded bg-polar-midnight border border-polar-border">
                      {model.type}
                    </span>
                    <span className="text-xs font-mono text-polar-gold font-semibold">
                      {model.metric}
                    </span>
                  </div>

                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 rounded bg-polar-midnight/80 text-polar-cyan mt-0.5">
                      <Icon className="w-4 h-4" />
                    </div>
                    <h3 className="text-base font-bold text-polar-snow">
                      {model.name}
                    </h3>
                  </div>

                  <div className="space-y-2 mt-4 text-xs font-mono">
                    <div className="p-2.5 rounded bg-polar-midnight/60 border border-polar-border/60">
                      <span className="text-polar-muted block text-[10px] uppercase">Input Variables</span>
                      <span className="text-polar-snow/90">{model.input}</span>
                    </div>
                    <div className="p-2.5 rounded bg-polar-midnight/60 border border-polar-border/60">
                      <span className="text-polar-cyan block text-[10px] uppercase">Operational Assessment</span>
                      <span className="text-polar-snow/90">{model.output}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-polar-border/50 flex items-center gap-2 text-[11px] text-polar-muted">
                  <CheckCircle2 className="w-3.5 h-3.5 text-polar-teal" />
                  <span>Transparent reasoning &bull; Human commander retains full authority</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
