"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldAlert, Sparkles, AlertTriangle, Sliders, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

export const IntelligenceTabs: React.FC = () => {
  const pathname = usePathname();

  const tabs = [
    { label: "RISK", href: "/intelligence/risk", icon: ShieldAlert },
    { label: "PREDICTIONS", href: "/intelligence/predictions", icon: Sparkles },
    { label: "ANOMALIES", href: "/intelligence/anomalies", icon: AlertTriangle, badge: "1 Alert" },
    { label: "OPTIMIZATION", href: "/intelligence/optimization", icon: Sliders },
    { label: "WHAT-IF", href: "/intelligence/what-if", icon: Brain },
  ];

  return (
    <div className="flex items-center gap-1 border-b border-[#242424] pb-px overflow-x-auto">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-xs font-mono font-medium transition-all border-b-2 -mb-px whitespace-nowrap",
              isActive
                ? "border-[#C8A96B] text-[#F5F3EE] bg-[#101010]"
                : "border-transparent text-[#A5A29C] hover:text-[#F5F3EE] hover:border-[#303030]"
            )}
          >
            <Icon className={cn("w-3.5 h-3.5", isActive ? "text-[#C8A96B]" : "text-[#6F6D68]")} />
            <span>{tab.label}</span>
            {tab.badge && (
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#140808] text-[#B85C5C] border border-[#B85C5C]/30">
                {tab.badge}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
};
