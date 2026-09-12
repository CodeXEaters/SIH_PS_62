import React from "react";

export const TeamSection: React.FC = () => {
  const leaders = [
    {
      name: "Dr. Arvind Sharan",
      role: "Chief Scientist & Expedition Leader",
      affil: "National Centre for Polar and Ocean Research",
      expeditions: "5 Antarctic Expeditions",
    },
    {
      name: "Lt. Col. Vikramaditya Rathore",
      role: "Logistics Commander & Operations Master",
      affil: "Indian Army Engineers / MoES Logistics Cell",
      expeditions: "4 Antarctic Expeditions",
    },
    {
      name: "Dr. Ananya Sen",
      role: "Lead Medical & Tele-Medicine Officer",
      affil: "All India Institute of Medical Sciences (AIIMS)",
      expeditions: "2 Antarctic Expeditions",
    },
    {
      name: "Tenzing Norbu",
      role: "Chief Field Survival & Traverse Specialist",
      affil: "National Centre for Polar and Ocean Research",
      expeditions: "6 Antarctic Expeditions",
    },
  ];

  return (
    <section id="team" className="py-24 sm:py-32 bg-polar-navy relative border-t border-polar-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-polar-cyan tracking-widest uppercase mb-2">
              <span>09 &bull; Operational Leadership</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              EXPEDITION LEADERSHIP
            </h2>
          </div>
          <p className="max-w-md text-sm text-polar-muted leading-relaxed">
            Directing India&apos;s 46th Scientific Expedition to Antarctica under the National Centre for Polar and Ocean Research.
          </p>
        </div>

        {/* Minimal Roster Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {leaders.map((lead) => (
            <div
              key={lead.name}
              className="p-5 rounded-lg bg-polar-deep/60 border border-polar-border hover:border-polar-borderLight transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-polar-midnight border border-polar-cyan/30 flex items-center justify-center text-xs font-bold font-mono text-polar-cyan mb-4">
                {lead.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
              </div>
              <h3 className="text-sm font-bold text-polar-snow">{lead.name}</h3>
              <p className="text-xs text-polar-cyan mt-1">{lead.role}</p>
              <p className="text-[11px] text-polar-muted mt-2 leading-tight">{lead.affil}</p>
              <div className="mt-4 pt-3 border-t border-polar-border/60">
                <span className="text-[10px] font-mono text-polar-gold uppercase tracking-wider">
                  {lead.expeditions}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
