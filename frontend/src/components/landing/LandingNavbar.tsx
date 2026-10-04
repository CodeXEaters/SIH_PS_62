"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Menu, X, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/context/ThemeContext";

export const LandingNavbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

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
          ? "bg-white/90 dark:bg-[#050505]/90 backdrop-blur-[16px] border-b border-slate-200 dark:border-[#242424] shadow-sm dark:shadow-operational"
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left: DHRUV Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group select-none">
          <div className="flex items-center gap-2.5">
            <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 shadow-sm ring-1 ring-slate-900/15 dark:ring-white/20 bg-[#050505]">
              <Image
                src="/images/dhruv-logo-transparent.png"
                alt="DHRUV"
                width={34}
                height={34}
                className="h-8 w-8 object-contain"
                priority
              />
            </div>
            <span className="text-xl font-black tracking-[0.25em] text-slate-900 dark:text-[#F5F3EE]">
              DHRUV
            </span>
          </div>
          <span className="hidden border-l border-slate-300 dark:border-[#242424] pl-3 text-[10px] font-mono tracking-widest text-slate-500 dark:text-[#6F6D68] uppercase sm:inline-block">
            NCPOR &bull; 70°S
          </span>
        </Link>

        {/* Center: Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-medium tracking-wider">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-slate-600 dark:text-[#A5A29C] transition-colors hover:text-slate-900 dark:hover:text-[#F5F3EE]"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right: Theme Toggle & LAUNCH CTA */}
        <div className="hidden sm:flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded text-slate-600 hover:text-slate-900 dark:text-[#A5A29C] dark:hover:text-[#F5F3EE] hover:bg-slate-100 dark:hover:bg-[#121212] border border-slate-200 dark:border-[#242424] transition-colors"
            title={theme === "dark" ? "Switch to Light Theme" : "Switch to Dark Theme"}
            aria-label="Toggle Theme"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-[#FFB84D]" />
            ) : (
              <Moon className="w-4 h-4 text-[#0284C7]" />
            )}
          </button>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded border border-slate-900 bg-slate-900 text-white dark:border-[#E8E4DC] dark:bg-[#E8E4DC] dark:text-[#050505] px-4 py-1.5 text-xs font-semibold transition-all hover:translate-x-0.5 hover:bg-slate-800 dark:hover:bg-white active:scale-[0.99] shadow-sm"
          >
            <span>LAUNCH</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded text-slate-600 dark:text-[#A5A29C] hover:bg-slate-100 dark:hover:bg-[#121212] border border-slate-200 dark:border-[#242424]"
            aria-label="Toggle Theme"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-[#FFB84D]" />
            ) : (
              <Moon className="w-4 h-4 text-[#0284C7]" />
            )}
          </button>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-1.5 text-slate-700 dark:text-[#A5A29C] hover:text-slate-950 dark:hover:text-[#F5F3EE]"
            aria-label="Toggle Menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="mt-3 flex flex-col gap-3 rounded border border-slate-200 dark:border-[#242424] bg-white/95 dark:bg-[#050505]/95 p-5 pt-4 backdrop-blur-[16px] md:hidden shadow-xl">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="py-1 text-xs font-mono tracking-wider text-slate-700 dark:text-[#A5A29C] hover:text-slate-900 dark:hover:text-[#F5F3EE]"
            >
              {link.label}
            </a>
          ))}
          <div className="pt-2">
            <Link
              href="/dashboard"
              onClick={() => setMobileOpen(false)}
              className="inline-flex w-full items-center justify-center gap-2 rounded bg-slate-900 text-white dark:bg-[#E8E4DC] dark:text-[#050505] px-4 py-2 text-xs font-bold shadow-sm"
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
