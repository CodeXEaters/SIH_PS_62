"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

export const LandingNavbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Home", href: "#hero" },
    { label: "About", href: "#mission" },
    { label: "Features", href: "#features" },
    { label: "Impact", href: "#impact" },
    { label: "Technology", href: "#technology" },
    { label: "Team", href: "#team" },
    { label: "Contact", href: "#contact" },
  ];

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 sm:px-12 py-4",
        scrolled
          ? "bg-[rgba(5,5,5,0.88)] backdrop-blur-[16px] border-b border-[#242424] shadow-operational"
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left: DHRUV Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group select-none">
          <div className="flex items-center gap-2">
            <Image src="/images/dhruv-logo-transparent.png" alt="DHRUV" width={34} height={34} className="h-8 w-8 object-contain" priority />
            <span className="text-xl font-black tracking-[0.25em] text-[#F5F3EE]">
              DHRUV
            </span>
          </div>
          <span className="hidden border-l border-[#242424] pl-3 text-[10px] font-mono tracking-widest text-[#6F6D68] uppercase sm:inline-block">
            NCPOR &bull; 70°S
          </span>
        </Link>

        {/* Center: Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-medium tracking-wider">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-[#A5A29C] transition-colors hover:text-[#F5F3EE]"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right: Minimal LAUNCH CTA */}
        <div className="hidden sm:flex items-center gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded border border-[#E8E4DC] bg-[#E8E4DC] px-4 py-1.5 text-xs font-semibold text-[#050505] transition-all hover:translate-x-0.5 hover:bg-white active:scale-[0.99]"
          >
            <span>LAUNCH</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-1.5 text-[#A5A29C] hover:text-[#F5F3EE] md:hidden"
          aria-label="Toggle Menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="mt-3 flex flex-col gap-3 rounded border border-[#242424] bg-[rgba(5,5,5,0.96)] p-5 pt-4 backdrop-blur-[16px] md:hidden">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="py-1 text-xs font-mono tracking-wider text-[#A5A29C] hover:text-[#F5F3EE]"
            >
              {link.label}
            </a>
          ))}
          <div className="pt-2">
            <Link
              href="/dashboard"
              onClick={() => setMobileOpen(false)}
              className="inline-flex w-full items-center justify-center gap-2 rounded bg-[#E8E4DC] px-4 py-2 text-xs font-bold text-[#050505]"
            >
              <span>LAUNCH DHRUV</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
