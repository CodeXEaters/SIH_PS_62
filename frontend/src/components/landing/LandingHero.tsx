"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const LandingHero: React.FC = () => {
  return (
    <section id="hero" className="relative flex min-h-[92vh] w-full flex-col justify-between overflow-hidden bg-[#050505] lg:min-h-screen">
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
        <div className="absolute inset-0 bg-gradient-to-r from-[#050505]/92 via-[#050505]/68 to-[#050505]/8 lg:from-[#050505]/88 lg:via-[#050505]/46" />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#050505]/90 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-[34rem] bg-gradient-to-t from-[#050505] via-[#050505]/92 via-30% to-transparent" />
      </div>

      {/* Top Spacer */}
      <div className="h-24 sm:h-28" />

      {/* Hero Content Canvas */}
      <div className="relative z-10 flex w-full flex-1 flex-col justify-center px-6 py-10 sm:px-12 lg:px-[7vw] lg:py-16">
        <div className="max-w-3xl text-left xl:max-w-[44rem]">
          {/* Subtle Expedition Metadata */}
          <div className="flex items-center gap-3 mb-6">
            <span className="h-2 w-2 rounded-full bg-[#E8E4DC] shadow-[0_0_16px_rgba(232,228,220,0.65)]" />
            <p className="text-[11px] font-mono font-medium tracking-[0.3em] text-[#C8C8C5] uppercase">
              INDIA&apos;S ANTARCTIC EXPEDITIONS, REIMAGINED
            </p>
          </div>

          {/* Large Editorial Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-[#F5F3EE] leading-[1.04]">
            FARTHER TODAY.
            <span className="mt-1 block font-semibold text-[#E8E4DC]">
              SAFER TOMORROW.
            </span>
          </h1>

          {/* Thin Editorial Divider */}
          <div className="my-6 h-px w-16 bg-gradient-to-r from-[#E8E4DC] to-transparent" />

          {/* Supporting Copy */}
          <p className="max-w-xl text-base font-normal leading-relaxed text-[#A5A29C] sm:text-lg">
            Plan. Track. Protect. A smarter way to power India&apos;s journey at the end of the Earth.
          </p>

          {/* Primary CTA Button */}
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-3 rounded border border-[#E8E4DC] bg-[#E8E4DC] px-7 py-3 text-xs font-bold tracking-wider text-[#050505] uppercase shadow-[0_0_28px_rgba(232,228,220,0.16)] transition-all hover:translate-x-0.5 hover:bg-white active:scale-[0.99]"
            >
              <span>LAUNCH DHRUV</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <span className="text-xs font-mono tracking-wider text-[#6F6D68] uppercase">
              MAITRI &bull; BHARATI &bull; 46TH ISEA
            </span>
          </div>
        </div>
      </div>

      <div className="relative z-10 w-full px-6 pb-8 sm:px-12 sm:pb-12 lg:px-[7vw]">
        <div className="flex flex-col justify-between gap-4 pt-6 text-xs font-mono text-[#6F6D68] sm:flex-row sm:items-center">
          <div className="flex items-center gap-6">
            <span>ANTARCTICA &bull; 70° SOUTH</span>
            <span className="hidden md:inline">&bull;</span>
            <span className="hidden md:inline">OPERATIONAL STATUS: NOMINAL</span>
          </div>

          <div className="text-left sm:text-right">
            <span className="block font-sans font-medium text-[#C8C8C5]">
              National Centre for Polar and Ocean Research (NCPOR)
            </span>
            <span className="block text-[10px] text-[#6F6D68]">
              Ministry of Earth Sciences, Government of India
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
