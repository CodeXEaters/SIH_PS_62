import React from "react";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { LandingHero } from "@/components/landing/LandingHero";
import { EditorialSections } from "@/components/landing/EditorialSections";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-[#F5F3EE] flex flex-col selection:bg-[#C8A96B] selection:text-[#050505]">
      {/* Editorial Navigation */}
      <LandingNavbar />

      <LandingHero />

      <EditorialSections />

      <footer className="w-full bg-[#050505] py-10 text-xs font-mono text-[#6F6D68]">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#F5F3EE] tracking-widest uppercase">DHRUV</span>
            <span>&bull;</span>
            <span>Polar Mission Control System</span>
          </div>

          <div className="flex items-center gap-6 text-[11px]">
            <span>NCPOR</span>
            <span>MoES</span>
            <span>GOVERNMENT OF INDIA</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
