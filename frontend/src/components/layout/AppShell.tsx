"use client";

import React from "react";
import { Sidebar } from "../navigation/Sidebar";
import { Topbar } from "../navigation/Topbar";
import { useAppStore } from "@/store";
import { WifiOff } from "lucide-react";

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { connectionStatus, offlineQueueCount } = useAppStore();

  return (
    <div className="flex h-screen bg-[#050505] text-[#F5F3EE] overflow-hidden select-none">
      {/* Black Mission Control Sidebar */}
      <Sidebar />

      {/* Main Operational Column */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-[#050505]">
        {/* Minimal Black Topbar */}
        <Topbar />

        {/* Minimal Offline Line (No Giant Warning Banners) */}
        {connectionStatus === "OFFLINE" && (
          <div className="bg-[#0A0A0A] border-b border-[#242424] px-4 py-1.5 flex items-center justify-between text-[11px] font-mono text-[#A5A29C] z-10 shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full border border-[#C49A55]" />
              <span>
                <strong>OFFLINE:</strong> Operating on local IndexedDB cache.
              </span>
            </div>
            {offlineQueueCount > 0 && (
              <span className="font-mono text-[#C49A55] text-[10px]">
                {offlineQueueCount} mutation(s) queued for Iridium sync
              </span>
            )}
          </div>
        )}

        {/* Scrollable Main Operations Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#050505]">
          <div className="max-w-7xl mx-auto w-full">{children}</div>
        </main>
      </div>
    </div>
  );
};
