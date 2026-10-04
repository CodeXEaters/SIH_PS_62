"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const LandingHero: React.FC = () => {
  return (
    <section
      id="hero"
      className="relative flex min-h-[92vh] w-full flex-col justify-between overflow-hidden bg-[#050505] lg:min-h-screen border-b border-[#242424]"
    >
      <div className="absolute inset-0 z-0 select-none pointer-events-none">
        <Image
          src="/images/dhruv-hero-sharp.png"
          alt="Antarctic expedition explorer, Maitri and Bharati research stations"
          fill
          priority
          quality={100}
          sizes="100vw"
          className="object-cover object-[62%_center] contrast-[1.03] saturate-[1.02] lg:object-center"
        />
        {/* Subtle, cinematic dark vignettes - protect text legibility without obscuring or washing out the polar photograph */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-transparent lg:from-black/80 lg:via-black/25" />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/70 via-black/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
      </div>

      {/* Top Spacer */}
      <div className="h-24 sm:h-28" />

      {/* Hero Content Canvas */}
      <div className="relative z-10 flex w-full flex-1 flex-col justify-center px-6 py-10 sm:px-12 lg:px-[7vw] lg:py-16">
        <div className="max-w-3xl text-left xl:max-w-[44rem]">
          {/* Subtle Expedition Metadata */}
          <div className="flex items-center gap-3 mb-6">
            <span className="h-2 w-2 rounded-full bg-[#E8E4DC] shadow-[0_0_16px_rgba(232,228,220,0.85)]" />
            <p className="hero-meta text-[11px] font-mono font-medium tracking-[0.3em] text-[#C8C8C5] uppercase">
              INDIA&apos;S ANTARCTIC EXPEDITIONS, REIMAGINED
            </p>
          </div>

          {/* Large Editorial Headline */}
          <h1 className="hero-headline text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.04] drop-shadow-[0_2px_16px_rgba(0,0,0,0.8)]">
            FARTHER TODAY.
            <span className="hero-subheadline mt-1 block font-semibold text-[#E8E4DC] drop-shadow-[0_2px_16px_rgba(0,0,0,0.8)]">
              SAFER TOMORROW.
            </span>
          </h1>

          {/* Thin Editorial Divider */}
          <div className="my-6 h-px w-16 bg-gradient-to-r from-[#E8E4DC] to-transparent" />

          {/* Supporting Copy */}
          <p className="hero-copy max-w-xl text-base font-normal leading-relaxed text-[#F5F3EE]/90 sm:text-lg drop-shadow-[0_1px_8px_rgba(0,0,0,0.8)]">
            Plan. Track. Protect. A smarter way to power India&apos;s journey at the end of the Earth.
          </p>

          {/* Primary CTA Button */}
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <Link
              href="/dashboard"
              className="hero-cta inline-flex items-center gap-3 rounded border border-white bg-white text-[#050505] hover:bg-[#E8E4DC] px-7 py-3 text-xs font-bold tracking-wider uppercase shadow-[0_0_28px_rgba(255,255,255,0.25)] transition-all hover:translate-x-0.5 active:scale-[0.99]"
            >
              <span className="text-[#050505] font-bold">LAUNCH DHRUV</span>
              <ArrowRight className="h-4 w-4 text-[#050505]" />
            </Link>

            <span className="hero-station text-xs font-mono tracking-wider text-[#A5A29C] uppercase drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
              MAITRI &bull; BHARATI &bull; 46TH ISEA
            </span>
          </div>
        </div>
      </div>

      <div className="relative z-10 w-full px-6 pb-8 sm:px-12 sm:pb-12 lg:px-[7vw]">
        <div className="hero-footer flex flex-col justify-between gap-4 pt-6 text-xs font-mono text-[#A5A29C] sm:flex-row sm:items-center border-t border-white/10">
          <div className="flex items-center gap-6">
            <span className="text-[#C8C8C5]">ANTARCTICA &bull; 70° SOUTH</span>
            <span className="hidden md:inline text-white/40">&bull;</span>
            <span className="hidden md:inline text-emerald-400">OPERATIONAL STATUS: NOMINAL</span>
          </div>

          <div className="text-left sm:text-right">
            <span className="block font-sans font-medium text-[#F5F3EE]">
              National Centre for Polar and Ocean Research (NCPOR)
            </span>
            <span className="block text-[10px] text-[#A5A29C]">
              Ministry of Earth Sciences, Government of India
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
