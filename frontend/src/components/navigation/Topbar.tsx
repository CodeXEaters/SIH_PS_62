"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Bell,
  Shield,
  ChevronDown,
  CheckCircle2,
  RefreshCw,
  WifiOff,
  AlertTriangle,
  User,
  LogOut,
  LogIn,
  X,
} from "lucide-react";
import { useAppStore } from "@/store";
import { mockAttentionItems } from "@/data/mock";
import { cn } from "@/lib/utils";
import { authService, UserSession } from "@/services/auth";
import { intelligenceService } from "@/services/intelligence";
import { useWebSocket } from "@/hooks/useWebSocket";
import { syncOfflineQueue } from "@/lib/offline/sync/syncEngine";

export const Topbar: React.FC = () => {
  const {
    connectionStatus,
    setConnectionStatus,
    lastSyncedAt,
    setLastSyncedAt,
    setSearchOpen,
    offlineQueueCount,
    user,
    setUser,
  } = useAppStore();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [attentionItems, setAttentionItems] = useState(mockAttentionItems);
  const [profileOpen, setProfileOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    intelligenceService
      .getAttentionItems()
      .then((items) => {
        if (items && items.length > 0) setAttentionItems(items);
      })
      .catch(() => {});
  }, []);

  useWebSocket({
    channel: "alerts",
    onMessage: () => {
      intelligenceService
        .getAttentionItems()
        .then((items) => {
          if (items && items.length > 0) setAttentionItems(items);
        })
        .catch(() => {});
    },
  });

  useEffect(() => {
    // Attempt to hydrate current authenticated session from token
    if (authService.isAuthenticated() && !user) {
      authService
        .getCurrentUser()
        .then((u) => setUser(u))
        .catch(() => {
          // Token expired or invalid
          setUser(null);
        });
    }
  }, [user, setUser]);

  const toggleConnection = async () => {
    if (connectionStatus === "OPERATIONAL") {
      setConnectionStatus("SYNCING");
      await syncOfflineQueue();
      setLastSyncedAt(new Date().toLocaleTimeString("en-GB") + " UTC");
      setTimeout(() => setConnectionStatus("OFFLINE"), 600);
    } else if (connectionStatus === "SYNCING") {
      setConnectionStatus("OFFLINE");
    } else {
      setConnectionStatus("SYNCING");
      await syncOfflineQueue();
      setLastSyncedAt(new Date().toLocaleTimeString("en-GB") + " UTC");
      setTimeout(() => setConnectionStatus("OPERATIONAL"), 800);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      const loggedIn = await authService.login({
        email: loginEmail,
        password: loginPassword,
      });
      setUser(loggedIn);
      setLoginModalOpen(false);
      setLoginPassword("");
    } catch (err: any) {
      setLoginError(err?.message || "Invalid authentication credentials");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    setUser(null);
    setProfileOpen(false);
  };

  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "IN";

  return (
    <header className="h-14 border-b border-[#1E1E1E] bg-[#070707] px-4 sm:px-6 flex items-center justify-between z-20 shrink-0 sticky top-0">
      {/* Left: 46th ISEA / ANTARCTICA OPERATIONS */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="font-bold text-[#F5F3EE] tracking-tight">46th ISEA</span>
          <span className="text-[#303030]">/</span>
          <span className="text-[#A5A29C] uppercase tracking-wider text-[11px]">
            ANTARCTICA OPERATIONS
          </span>
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
          title="Click to toggle network status and trigger synchronization"
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
              <span>◌ SYNCING {offlineQueueCount > 0 ? `(${offlineQueueCount} queued)` : ""}</span>
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
            {attentionItems.length > 0 && (
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#B85C5C]" />
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded border border-[#242424] bg-[#0A0A0A] shadow-2xl z-50 p-3 space-y-2">
              <div className="flex items-center justify-between border-b border-[#242424] pb-2">
                <span className="text-xs font-mono font-bold text-[#F5F3EE]">
                  ACTIVE NOTIFICATIONS
                </span>
                <span className="text-[10px] font-mono text-[#C49A55]">
                  {attentionItems.length} alerts
                </span>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {attentionItems.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="p-2 rounded bg-[#101010] border border-[#242424] text-xs"
                  >
                    <span className="font-bold text-[#F5F3EE] block">{item.title}</span>
                    <span className="text-[11px] text-[#A5A29C] line-clamp-1">{item.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile Pill & Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              if (user) {
                setProfileOpen(!profileOpen);
              } else {
                setLoginModalOpen(true);
              }
            }}
            className="flex items-center gap-2 pl-2 border-l border-[#1E1E1E] hover:opacity-80 transition-opacity"
            title={user ? `${user.name} (${user.role})` : "Click to sign in"}
          >
            <div className="w-6 h-6 rounded bg-[#151515] border border-[#242424] flex items-center justify-center text-[10px] font-mono font-bold text-[#F5F3EE]">
              {userInitials}
            </div>
            <span className="hidden sm:inline text-xs font-mono text-[#A5A29C] uppercase">
              {user ? user.name.split(" ")[0] : "SIGN IN"}
            </span>
          </button>

          {profileOpen && user && (
            <div className="absolute right-0 mt-2 w-64 rounded border border-[#242424] bg-[#0A0A0A] shadow-2xl z-50 p-3 space-y-3 font-mono text-xs">
              <div className="border-b border-[#242424] pb-2 space-y-1">
                <div className="font-bold text-[#F5F3EE]">{user.name}</div>
                <div className="text-[11px] text-[#7FAF91]">{user.role}</div>
                <div className="text-[10px] text-[#A5A29C] truncate">{user.email}</div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-1.5 px-2 rounded bg-[#181212] border border-[#B85C5C]/30 hover:border-[#B85C5C]/60 text-[#B85C5C] text-xs transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Clean Login Modal */}
      {loginModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0A0A0A] border border-[#242424] rounded-lg w-full max-w-sm p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#242424] pb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#7FAF91]" />
                <h2 className="text-sm font-bold font-mono text-[#F5F3EE] uppercase tracking-wider">
                  Expedition Portal Login
                </h2>
              </div>
              <button
                onClick={() => setLoginModalOpen(false)}
                className="text-[#6F6D68] hover:text-[#F5F3EE]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {loginError && (
              <div className="p-2.5 rounded bg-[#1F1010] border border-[#B85C5C]/40 text-[#B85C5C] text-xs font-mono">
                {loginError}
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-3 font-mono text-xs">
              <div>
                <label className="text-[10px] uppercase text-[#A5A29C] block mb-1">
                  Official Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="operator@dhruv.gov.in"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-[#121212] border border-[#242424] text-[#F5F3EE] focus:outline-none focus:border-[#7FAF91]"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase text-[#A5A29C] block mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-[#121212] border border-[#242424] text-[#F5F3EE] focus:outline-none focus:border-[#7FAF91]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-2 px-3 rounded bg-[#08120B] border border-[#7FAF91]/40 hover:border-[#7FAF91] text-[#7FAF91] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {loginLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <LogIn className="w-3.5 h-3.5" />
                  )}
                  <span>{loginLoading ? "Authenticating..." : "Authorize Access"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
