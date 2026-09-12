import React from "react";
import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, className }) => {
  return (
    <div className={cn("flex space-x-1 border-b border-[#242424] pb-px overflow-x-auto", className)}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "flex items-center gap-2 px-3.5 py-2 text-xs font-mono font-medium transition-colors border-b-2 -mb-px whitespace-nowrap",
              isActive
                ? "border-[#C8A96B] text-[#F5F3EE] bg-[#101010]"
                : "border-transparent text-[#A5A29C] hover:text-[#F5F3EE] hover:border-[#303030]"
            )}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {typeof tab.count === "number" && (
              <span
                className={cn(
                  "px-1.5 py-0.2 rounded text-[10px] font-mono",
                  isActive ? "bg-[#C8A96B]/15 text-[#C8A96B]" : "bg-[#151515] text-[#6F6D68]"
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
