import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Profile, Partition, Line, Plant, SyncStatus } from "@/lib/types";

interface AppState {
  // Auth
  profile: Profile | null;
  setProfile: (profile: Profile | null) => void;

  // Navigation state (persisted for deep-link restore)
  selectedPartition: Partition | null;
  selectedLine: Line | null;
  setSelectedPartition: (p: Partition | null) => void;
  setSelectedLine: (l: Line | null) => void;

  // Sync status
  pendingSyncCount: number;
  syncStatus: SyncStatus | "idle";
  setPendingSyncCount: (n: number) => void;
  setSyncStatus: (s: SyncStatus | "idle") => void;

  // Offline flag (mirrored from navigator.onLine)
  isOffline: boolean;
  setIsOffline: (v: boolean) => void;

  // Recently acted plant (to show optimistic status in plant grid)
  recentPlantStatuses: Record<string, string>; // plantId → status
  setRecentPlantStatus: (plantId: string, status: string) => void;

  // Language preference
  language: "en" | "kn";
  setLanguage: (lang: "en" | "kn") => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      profile: null,
      setProfile: (profile) => set({ profile }),

      selectedPartition: null,
      selectedLine: null,
      setSelectedPartition: (p) => set({ selectedPartition: p }),
      setSelectedLine: (l) => set({ selectedLine: l }),

      pendingSyncCount: 0,
      syncStatus: "idle",
      setPendingSyncCount: (n) => set({ pendingSyncCount: n }),
      setSyncStatus: (s) => set({ syncStatus: s }),

      isOffline: false,
      setIsOffline: (v) => set({ isOffline: v }),

      recentPlantStatuses: {},
      setRecentPlantStatus: (plantId, status) =>
        set((state) => ({
          recentPlantStatuses: { ...state.recentPlantStatuses, [plantId]: status },
        })),

      language: "en",
      setLanguage: (lang) => set({ language: lang }),
    }),
    {
      name: "farm-app-store",
      // Only persist these keys (avoid persisting transient sync status)
      partialize: (state) => ({
        profile: state.profile,
        selectedPartition: state.selectedPartition,
        selectedLine: state.selectedLine,
        recentPlantStatuses: state.recentPlantStatuses,
        language: state.language,
      }),
    }
  )
);
