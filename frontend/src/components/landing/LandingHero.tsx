"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const LandingHero: React.FC = () => {
  return (
    <section id="hero" className="relative flex min-h-[92vh] w-full flex-col justify-between overflow-hidden bg-slate-50 dark:bg-[#050505] lg:min-h-screen">
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
        {/* Adaptive Overlays: Crisp alpine frost in light mode, deep night ops in dark mode */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#F8F9FA]/96 via-[#F8F9FA]/82 to-[#F8F9FA]/25 dark:from-[#050505]/92 dark:via-[#050505]/68 dark:to-[#050505]/8 lg:from-[#F8F9FA]/92 lg:via-[#F8F9FA]/65 dark:lg:from-[#050505]/88 dark:lg:via-[#050505]/46" />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#F8F9FA]/90 to-transparent dark:from-[#050505]/90 dark:to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-[34rem] bg-gradient-to-t from-[#F8F9FA] via-[#F8F9FA]/92 via-30% to-transparent dark:from-[#050505] dark:via-[#050505]/92 dark:via-30% dark:to-transparent" />
      </div>

      {/* Top Spacer */}
      <div className="h-24 sm:h-28" />

      {/* Hero Content Canvas */}
      <div className="relative z-10 flex w-full flex-1 flex-col justify-center px-6 py-10 sm:px-12 lg:px-[7vw] lg:py-16">
        <div className="max-w-3xl text-left xl:max-w-[44rem]">
          {/* Subtle Expedition Metadata */}
          <div className="flex items-center gap-3 mb-6">
            <span className="h-2 w-2 rounded-full bg-[#0284C7] dark:bg-[#E8E4DC] shadow-[0_0_16px_rgba(2,132,199,0.7)] dark:shadow-[0_0_16px_rgba(232,228,220,0.65)]" />
            <p className="text-[11px] font-mono font-medium tracking-[0.3em] text-slate-600 dark:text-[#C8C8C5] uppercase">
              INDIA&apos;S ANTARCTIC EXPEDITIONS, REIMAGINED
            </p>
          </div>

          {/* Large Editorial Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 dark:text-[#F5F3EE] leading-[1.04]">
            FARTHER TODAY.
            <span className="mt-1 block font-semibold text-[#0284C7] dark:text-[#E8E4DC]">
              SAFER TOMORROW.
            </span>
          </h1>

          {/* Thin Editorial Divider */}
          <div className="my-6 h-px w-16 bg-gradient-to-r from-[#0284C7] dark:from-[#E8E4DC] to-transparent" />

          {/* Supporting Copy */}
          <p className="max-w-xl text-base font-normal leading-relaxed text-slate-600 dark:text-[#A5A29C] sm:text-lg">
            Plan. Track. Protect. A smarter way to power India&apos;s journey at the end of the Earth.
          </p>

          {/* Primary CTA Button */}
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-3 rounded border border-slate-900 bg-slate-900 text-white hover:bg-slate-800 dark:border-[#E8E4DC] dark:bg-[#E8E4DC] dark:text-[#050505] dark:hover:bg-white px-7 py-3 text-xs font-bold tracking-wider uppercase shadow-md transition-all hover:translate-x-0.5 active:scale-[0.99]"
            >
              <span>LAUNCH DHRUV</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <span className="text-xs font-mono tracking-wider text-slate-500 dark:text-[#6F6D68] uppercase">
              MAITRI &bull; BHARATI &bull; 46TH ISEA
            </span>
          </div>
        </div>
      </div>

      <div className="relative z-10 w-full px-6 pb-8 sm:px-12 sm:pb-12 lg:px-[7vw]">
        <div className="flex flex-col justify-between gap-4 pt-6 text-xs font-mono text-slate-500 dark:text-[#6F6D68] sm:flex-row sm:items-center">
          <div className="flex items-center gap-6">
            <span>ANTARCTICA &bull; 70° SOUTH</span>
            <span className="hidden md:inline">&bull;</span>
            <span className="hidden md:inline">OPERATIONAL STATUS: NOMINAL</span>
          </div>

          <div className="text-left sm:text-right">
            <span className="block font-sans font-medium text-slate-700 dark:text-[#C8C8C5]">
              National Centre for Polar and Ocean Research (NCPOR)
            </span>
            <span className="block text-[10px] text-slate-500 dark:text-[#6F6D68]">
              Ministry of Earth Sciences, Government of India
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
