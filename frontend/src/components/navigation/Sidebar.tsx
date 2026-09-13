"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  Calendar,
  Clock,
  Users,
  Footprints,
  HeartPulse,
  Box,
  QrCode,
  FileSpreadsheet,
  Database,
  ArrowLeftRight,
  TrendingDown,
  Truck,
  Wrench,
  MapPin,
  Radio,
  Brain,
  ShieldAlert,
  AlertTriangle,
  Sliders,
  Sparkles,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useAppStore();

  const sections: NavSection[] = [
    {
      title: "COMMAND",
      items: [
        { label: "Overview", href: "/dashboard", icon: Compass },
      ],
    },
    {
      title: "EXPEDITIONS",
      items: [
        { label: "All Expeditions", href: "/expeditions", icon: Compass },
        { label: "Overview", href: "/expeditions/ISEA-46", icon: Compass },
        { label: "Planner", href: "/expeditions/ISEA-46/planner", icon: Calendar },
        { label: "Timeline", href: "/expeditions/ISEA-46/timeline", icon: Clock },
      ],
    },
    {
      title: "PEOPLE",
      items: [
        { label: "Personnel", href: "/personnel", icon: Users },
        { label: "Movement", href: "/personnel/movement", icon: Footprints },
        { label: "Medical & Training", href: "/personnel/ISEA-46-001", icon: HeartPulse },
      ],
    },
    {
      title: "CARGO",
      items: [
        { label: "Cargo Dashboard", href: "/cargo", icon: Box },
        { label: "Cargo Details", href: "/cargo/CRG-2026-001", icon: Box },
        { label: "QR Scanner", href: "/cargo/scanner", icon: QrCode },
        { label: "Chain of Custody", href: "/cargo/chain-of-custody", icon: FileSpreadsheet },
      ],
    },
    {
      title: "INVENTORY",
      items: [
        { label: "Station Inventory", href: "/inventory", icon: Database },
        { label: "Transfers", href: "/inventory/transfers", icon: ArrowLeftRight },
        { label: "Forecast", href: "/inventory/forecast", icon: TrendingDown },
      ],
    },
    {
      title: "ASSETS",
      items: [
        { label: "All Assets", href: "/assets", icon: Truck },
        { label: "Assignments", href: "/assets/AST-BHR-004", icon: Compass },
        { label: "Maintenance", href: "/assets/maintenance", icon: Wrench },
      ],
    },
    {
      title: "OPERATIONS",
      items: [
        { label: "Operations Map", href: "/operations/map", icon: MapPin },
        { label: "Field Missions", href: "/missions", icon: Radio },
      ],
    },
    {
      title: "INTELLIGENCE",
      items: [
        { label: "Risk Center", href: "/intelligence/risk", icon: ShieldAlert },
        { label: "Predictions", href: "/intelligence/predictions", icon: Sparkles },
        { label: "Anomalies", href: "/intelligence/anomalies", icon: AlertTriangle },
        { label: "Optimization", href: "/intelligence/optimization", icon: Sliders },
        { label: "What-if", href: "/intelligence/what-if", icon: Brain },
      ],
    },
    {
      title: "EMERGENCY",
      items: [
        { label: "Active Incidents", href: "/emergency", icon: ShieldAlert, badge: "SOS", badgeColor: "bg-[#140808] text-[#B85C5C] border-[#B85C5C]/40" },
        { label: "Response Resources", href: "/emergency/active", icon: Compass },
        { label: "History", href: "/emergency/history", icon: Clock },
      ],
    },
    {
      title: "REPORTS",
      items: [
        { label: "Reports", href: "/reports", icon: BarChart3 },
      ],
    },
    {
      title: "ADMIN",
      items: [
        { label: "Settings", href: "/admin", icon: Settings },
      ],
    },
  ];

  return (
    <aside
      className={cn(
        "h-screen sticky top-0 bg-[#070707] border-r border-[#1E1E1E] z-30 transition-all duration-200 flex flex-col select-none",
        sidebarCollapsed ? "w-[68px]" : "w-[248px]"
      )}
    >
      {/* Top Header: DHRUV Brand Logo */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-[#1E1E1E] shrink-0 bg-[#070707]">
        <Link href="/dashboard" className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 flex items-center justify-center shrink-0">
            <Image
              src="/images/dhruv-logo-transparent.png"
              alt="DHRUV"
              width={34}
              height={34}
              className="h-8 w-8 object-contain light-only:hidden"
              priority
            />
            <Image
              src="/images/dhruv-logo-dark.png"
              alt="DHRUV"
              width={34}
              height={34}
              className="h-8 w-8 object-contain hidden light-only:block"
              priority
            />
          </div>

          {!sidebarCollapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-[0.2em] text-[#F5F3EE]">DHRUV</span>
              <span className="text-[8px] font-mono tracking-wider text-[#6F6D68] uppercase -mt-0.5">
                NCPOR POLAR OPS
              </span>
            </div>
          )}
        </Link>

        <button
          onClick={toggleSidebar}
          className="hidden lg:flex p-1 rounded text-[#6F6D68] hover:text-[#F5F3EE] hover:bg-[#121212] transition-colors"
          title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {sidebarCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4">
        {sections.map((section) => (
          <div key={section.title} className="space-y-0.5">
            {!sidebarCollapsed && (
              <p className="px-2.5 text-[9px] font-mono font-bold tracking-widest text-[#4A4844] uppercase mb-1">
                {section.title}
              </p>
            )}
            <div>
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href + item.label}
                    href={item.href}
                    title={sidebarCollapsed ? item.label : undefined}
                    className={cn(
                      "flex items-center gap-2.5 px-2.5 py-1.5 rounded text-xs transition-all relative group",
                      isActive
                        ? "text-[#F5F3EE] font-medium bg-[#101010]"
                        : "text-[#8F8D88] hover:text-[#F5F3EE] hover:bg-[#0D0D0D]"
                    )}
                  >
                    {/* Active Indicator: Small Muted Gold Line on Left Edge */}
                    {isActive && (
                      <span className="absolute left-0 top-1 bottom-1 w-[2px] bg-[#C8A96B] rounded-r" />
                    )}

                    <Icon
                      className={cn(
                        "w-3.5 h-3.5 shrink-0 transition-colors",
                        isActive ? "text-[#C8A96B]" : "text-[#6F6D68] group-hover:text-[#F5F3EE]"
                      )}
                    />

                    {!sidebarCollapsed && (
                      <div className="flex-1 flex items-center justify-between overflow-hidden">
                        <span className="truncate">{item.label}</span>
                        {item.badge && (
                          <span
                            className={cn(
                              "text-[9px] font-mono px-1 py-0.2 rounded shrink-0 border",
                              item.badgeColor || "bg-[#141414] text-[#6F6D68] border-[#242424]"
                            )}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Sidebar Footer: Expedition Quick Reference */}
      {!sidebarCollapsed && (
        <div className="p-3 border-t border-[#1E1E1E] bg-[#070707] text-[10px] font-mono text-[#6F6D68] space-y-1">
          <div className="flex items-center justify-between">
            <span>BHARATI:</span>
            <span className="text-[#A5A29C]">-19°C &bull; 34kt</span>
          </div>
          <div className="flex items-center justify-between">
            <span>MAITRI:</span>
            <span className="text-[#A5A29C]">-14°C &bull; 18kt</span>
          </div>
        </div>
      )}
    </aside>
  );
};
