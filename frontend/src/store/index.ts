import { create } from "zustand";
import { UserSession } from "@/services/auth";

export type ConnectionState = "OPERATIONAL" | "SYNCING" | "OFFLINE";

interface AppState {
  // Navigation & Shell
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;

  // Search Modal
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  toggleSearch: () => void;

  // Authentication & Profile
  user: UserSession | null;
  setUser: (user: UserSession | null) => void;

  // Expedition & Station Context
  currentExpeditionId: string;
  setExpeditionId: (id: string) => void;
  selectedStationFilter: "ALL" | "bharati" | "maitri";
  setSelectedStationFilter: (filter: "ALL" | "bharati" | "maitri") => void;

  // Connection & Offline State
  connectionStatus: ConnectionState;
  setConnectionStatus: (status: ConnectionState) => void;
  lastSyncedAt: string;
  setLastSyncedAt: (time: string) => void;
  offlineQueueCount: number;
  incrementOfflineQueue: () => void;
  clearOfflineQueue: () => void;

  // Emergency Mode
  activeEmergencyId: string | null;
  setActiveEmergencyId: (id: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  mobileMenuOpen: false,
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),

  searchOpen: false,
  setSearchOpen: (open) => set({ searchOpen: open }),
  toggleSearch: () => set((s) => ({ searchOpen: !s.searchOpen })),

  user: null,
  setUser: (user) => set({ user }),

  currentExpeditionId: "ISEA-46",
  setExpeditionId: (id) => set({ currentExpeditionId: id }),
  selectedStationFilter: "ALL",
  setSelectedStationFilter: (filter) => set({ selectedStationFilter: filter }),

  connectionStatus: "OPERATIONAL",
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  lastSyncedAt: "Just now (09:12 UTC)",
  setLastSyncedAt: (time) => set({ lastSyncedAt: time }),
  offlineQueueCount: 0,
  incrementOfflineQueue: () => set((s) => ({ offlineQueueCount: s.offlineQueueCount + 1 })),
  clearOfflineQueue: () => set({ offlineQueueCount: 0 }),

  activeEmergencyId: "EM-024",
  setActiveEmergencyId: (id) => set({ activeEmergencyId: id }),
}));
