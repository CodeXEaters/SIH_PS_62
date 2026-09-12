import React from "react";
import { Navigation, TrendingUp, Cpu, ShieldCheck } from "lucide-react";

export const FourStagesSection: React.FC = () => {
  const stages = [
    {
      num: "01",
      tag: "TRACK",
      title: "Real-Time Spatial Visibility",
      desc: "Know exactly where personnel, cargo, tracked vehicles, and chartered vessels are across the entire polar transit corridor.",
      icon: Navigation,
      accentColor: "text-polar-cyan",
      borderColor: "border-polar-cyan/30",
      highlight: "Goa → Cape Town → Vessel → Bharati/Maitri",
    },
    {
      num: "02",
      tag: "PREDICT",
      title: "Anticipate Friction & Depletion",
      desc: "Identify potential transport delays, fuel stockouts, and harsh weather risks days before they materialize.",
      icon: TrendingUp,
      accentColor: "text-sky-300",
      borderColor: "border-sky-400/30",
      highlight: "68% delay risk identified for Prydz Bay heli-transfer",
    },
    {
      num: "03",
      tag: "OPTIMIZE",
      title: "Decision-Support Recommendations",
      desc: "Provide operational recommendations for transport slot allocation, fuel staging, and payload balancing. AI recommends, human approves.",
      icon: Cpu,
      accentColor: "text-polar-teal",
      borderColor: "border-polar-teal/30",
      highlight: "Automated resupply scheduling under katabatic constraints",
    },
    {
      num: "04",
      tag: "RESPOND",
      title: "Mission-Grade Incident Response",
      desc: "Instantly coordinate search, rescue, and medical emergency responses with real-time asset readiness and weather survival windows.",
      icon: ShieldCheck,
      accentColor: "text-polar-gold",
      borderColor: "border-polar-gold/30",
      highlight: "Incident #EM-024 Tier-1 rescue dispatch pipeline",
    },
  ];

  return (
    <section className="py-24 sm:py-32 bg-polar-navy relative border-t border-polar-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="text-left mb-16 max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-mono text-polar-cyan tracking-widest uppercase mb-2">
            <span>03 &bull; Operational Paradigm</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
            TRACK &rarr; PREDICT &rarr; OPTIMIZE &rarr; RESPOND
          </h2>
          <p className="mt-3 text-sm sm:text-base text-polar-muted leading-relaxed">
            A continuous operational cycle designed to convert uncertain polar environments into predictable, managed scientific outcomes.
          </p>
        </div>

        {/* 4 Stage Sequence Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stages.map((stage) => {
            const Icon = stage.icon;
            return (
              <div
                key={stage.tag}
                className={`p-6 rounded-lg bg-polar-deep/70 border ${stage.borderColor} hover:bg-polar-deep/95 transition-all flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-black font-mono text-polar-muted/40">
                      {stage.num}
                    </span>
                    <span className={`text-xs font-mono font-bold tracking-widest uppercase px-2 py-0.5 rounded bg-polar-midnight/80 border ${stage.borderColor} ${stage.accentColor}`}>
                      {stage.tag}
                    </span>
                  </div>

                  <div className={`p-2.5 rounded-md w-fit bg-polar-midnight/80 mb-3 ${stage.accentColor}`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <h3 className="text-base font-bold text-polar-snow mb-2">
                    {stage.title}
                  </h3>
                  <p className="text-xs text-polar-muted leading-relaxed">
                    {stage.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-polar-border/60">
                  <span className="text-[10px] font-mono text-polar-snow/70 block leading-tight">
                    &bull; {stage.highlight}
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
