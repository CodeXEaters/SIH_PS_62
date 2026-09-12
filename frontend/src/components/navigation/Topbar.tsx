"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search, Bell, Shield, ChevronDown, CheckCircle2, RefreshCw, WifiOff, AlertTriangle } from "lucide-react";
import { useAppStore } from "@/store";
import { mockAttentionItems } from "@/data/mock";
import { cn } from "@/lib/utils";

export const Topbar: React.FC = () => {
  const {
    connectionStatus,
    setConnectionStatus,
    lastSyncedAt,
    setSearchOpen,
    offlineQueueCount,
  } = useAppStore();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const toggleConnection = () => {
    if (connectionStatus === "OPERATIONAL") {
      setConnectionStatus("SYNCING");
      setTimeout(() => setConnectionStatus("OFFLINE"), 800);
    } else if (connectionStatus === "SYNCING") {
      setConnectionStatus("OFFLINE");
    } else {
      setConnectionStatus("SYNCING");
      setTimeout(() => setConnectionStatus("OPERATIONAL"), 1000);
    }
  };

  return (
    <header className="h-14 border-b border-[#1E1E1E] bg-[#070707] px-4 sm:px-6 flex items-center justify-between z-20 shrink-0 sticky top-0">
      {/* Left: 46th ISEA / ANTARCTICA OPERATIONS */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="font-bold text-[#F5F3EE] tracking-tight">46th ISEA</span>
          <span className="text-[#303030]">/</span>
          <span className="text-[#A5A29C] uppercase tracking-wider text-[11px]">ANTARCTICA OPERATIONS</span>
        </div>
      </div>

      {/* Center: Global Search Trigger Button */}
      <div className="flex-1 max-w-md mx-6 hidden md:block">
        <button
          onClick={() => setSearchOpen(true)}
          className="w-full flex items-center justify-between px-3 py-1.5 rounded border border-[#242424] bg-[#0A0A0A] hover:bg-[#101010] hover:border-[#383838] text-xs text-[#6F6D68] hover:text-[#A5A29C] transition-all"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-[#6F6D68]" />
            <span>Search entities (CRG-004821, Bharati, Missions)...</span>
          </div>
          <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#141414] border border-[#242424] text-[#A5A29C]">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Right Controls: Connection Status, Notifications, Profile */}
      <div className="flex items-center gap-3">
        {/* Mobile Search Button */}
        <button
          onClick={() => setSearchOpen(true)}
          className="md:hidden p-1.5 text-[#A5A29C] hover:text-[#F5F3EE]"
          title="Search"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Connection Status Indicator */}
        <button
          onClick={toggleConnection}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono border transition-all cursor-pointer",
            connectionStatus === "OPERATIONAL" &&
              "bg-[#08120B] text-[#7FAF91] border-[#7FAF91]/30 hover:border-[#7FAF91]/50",
            connectionStatus === "SYNCING" &&
              "bg-[#101010] text-[#C8C8C5] border-[#303030] animate-pulse",
            connectionStatus === "OFFLINE" &&
              "bg-[#141008] text-[#C49A55] border-[#C49A55]/30 hover:border-[#C49A55]/50"
          )}
          title="Click to toggle simulation (Operational / Syncing / Offline)"
        >
          {connectionStatus === "OPERATIONAL" && (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-[#7FAF91]" />
              <span className="font-semibold">OPERATIONAL</span>
            </>
          )}
          {connectionStatus === "SYNCING" && (
            <>
              <RefreshCw className="w-3 h-3 animate-spin text-[#C8C8C5]" />
              <span>◌ SYNCING (3 pending)</span>
            </>
          )}
          {connectionStatus === "OFFLINE" && (
            <>
              <span className="w-1.5 h-1.5 rounded-full border border-[#C49A55]" />
              <span>○ OFFLINE (Cached)</span>
            </>
          )}
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-1.5 rounded text-[#6F6D68] hover:text-[#F5F3EE] hover:bg-[#121212] transition-colors relative"
            title="Operational Alerts"
          >
            <Bell className="w-4 h-4" />
            {mockAttentionItems.length > 0 && (
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#B85C5C]" />
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded border border-[#242424] bg-[#0A0A0A] shadow-2xl z-50 p-3 space-y-2">
              <div className="flex items-center justify-between border-b border-[#242424] pb-2">
                <span className="text-xs font-mono font-bold text-[#F5F3EE]">ACTIVE NOTIFICATIONS</span>
                <span className="text-[10px] font-mono text-[#C49A55]">{mockAttentionItems.length} alerts</span>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {mockAttentionItems.slice(0, 3).map((item) => (
                  <div key={item.id} className="p-2 rounded bg-[#101010] border border-[#242424] text-xs">
                    <span className="font-bold text-[#F5F3EE] block">{item.title}</span>
                    <span className="text-[11px] text-[#A5A29C] line-clamp-1">{item.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile Pill */}
        <div className="flex items-center gap-2 pl-2 border-l border-[#1E1E1E]">
          <div className="w-6 h-6 rounded bg-[#151515] border border-[#242424] flex items-center justify-center text-[10px] font-mono font-bold text-[#F5F3EE]">
            IN
          </div>
          <span className="hidden sm:inline text-xs font-mono text-[#A5A29C]">CMD. NAIR</span>
        </div>
      </div>
    </header>
  );
};
