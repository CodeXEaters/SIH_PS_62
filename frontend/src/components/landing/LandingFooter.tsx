import React from "react";
import Link from "next/link";

export const LandingFooter: React.FC = () => {
  return (
    <footer id="contact" className="py-12 bg-polar-midnight border-t border-polar-border text-xs text-polar-muted">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-10">
          {/* Col 1: Brand & Ministry */}
          <div className="md:col-span-5 space-y-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-black tracking-[0.2em] text-white">DHRUV</span>
              <svg width="12" height="12" viewBox="0 0 20 20" fill="none" className="text-polar-gold">
                <path d="M10 0 L12 7 L19 9 L12 11 L10 18 L8 11 L1 9 L8 7 Z" fill="#D6A84F" />
              </svg>
            </div>
            <p className="text-[11px] font-bold text-polar-cyan uppercase tracking-wider">
              Integrated Polar Expedition Logistics and Asset Management System
            </p>
            <p className="text-xs text-polar-muted max-w-sm leading-relaxed">
              National Centre for Polar and Ocean Research (NCPOR)<br />
              Ministry of Earth Sciences, Government of India<br />
              Headland Sada, Vasco da Gama, Goa 403804, India
            </p>
          </div>

          {/* Col 2: Research Stations */}
          <div className="md:col-span-3 space-y-2">
            <h4 className="text-xs font-bold text-polar-snow uppercase tracking-wider">
              Antarctic Stations
            </h4>
            <ul className="space-y-1.5 text-[11px]">
              <li>
                <span className="text-polar-snow font-semibold">Bharati Station:</span> 69°24′29″S 76°11′14″E
              </li>
              <li>
                <span className="text-polar-snow font-semibold">Maitri Station:</span> 70°45′57″S 11°44′09″E
              </li>
              <li>
                <span className="text-polar-snow font-semibold">Himadri:</span> Ny-Ålesund, Svalbard (Arctic)
              </li>
              <li>
                <span className="text-polar-snow font-semibold">IndARC:</span> Kongsfjorden Mooring
              </li>
            </ul>
          </div>

          {/* Col 3: Modules */}
          <div className="md:col-span-2 space-y-2">
            <h4 className="text-xs font-bold text-polar-snow uppercase tracking-wider">
              System Modules
            </h4>
            <ul className="space-y-1 text-[11px]">
              <li><Link href="/dashboard" className="hover:text-polar-cyan">Command Center</Link></li>
              <li><Link href="/cargo" className="hover:text-polar-cyan">Cargo Digital Twin</Link></li>
              <li><Link href="/operations/map" className="hover:text-polar-cyan">Operations Map</Link></li>
              <li><Link href="/intelligence/what-if" className="hover:text-polar-cyan">What-If Simulator</Link></li>
              <li><Link href="/emergency" className="hover:text-polar-cyan">Emergency Center</Link></li>
            </ul>
          </div>

          {/* Col 4: Protocols */}
          <div className="md:col-span-2 space-y-2">
            <h4 className="text-xs font-bold text-polar-snow uppercase tracking-wider">
              Compliance
            </h4>
            <p className="text-[11px] leading-relaxed">
              In accordance with Antarctic Treaty System environmental protocols and the Madrid Environmental Protocol.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-polar-border/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
          <p>© 2026-2027 National Centre for Polar and Ocean Research (NCPOR), MoES, Government of India.</p>
          <div className="flex items-center gap-4">
            <span className="text-polar-cyan font-mono">46th ISEA LIVE TELEMETRY FEED</span>
            <span>&bull;</span>
            <span>FARTHER TODAY. SAFER TOMORROW.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
