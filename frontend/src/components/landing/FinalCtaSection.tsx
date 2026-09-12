import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const FinalCtaSection: React.FC = () => {
  return (
    <section className="py-24 sm:py-32 bg-gradient-to-b from-polar-midnight to-polar-navy relative border-t border-polar-border overflow-hidden">
      {/* Background Subtle Aurora Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-polar-cyan/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-8 text-center relative z-10">
        <span className="text-xs font-mono font-bold tracking-widest text-polar-cyan uppercase block mb-3">
          10 &bull; Mission Deployment
        </span>
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
          READY FOR THE NEXT EXPEDITION?
        </h2>
        <div className="mt-6 space-y-1 text-base sm:text-lg text-polar-snow/90 font-medium">
          <p>One operational picture.</p>
          <p>Better decisions.</p>
          <p className="text-transparent bg-clip-text bg-gradient-to-r from-polar-cyan to-polar-teal">
            Safer missions.
          </p>
        </div>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-3 px-9 py-4 rounded-md bg-gradient-to-r from-polar-cyan to-polar-teal text-polar-navy font-bold text-sm tracking-wide shadow-[0_4px_28px_rgba(200,169,107,0.3)] hover:shadow-[0_6px_36px_rgba(200,169,107,0.4)] hover:brightness-110 active:scale-[0.98] transition-all"
          >
            <span>Launch DHRUV</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};
