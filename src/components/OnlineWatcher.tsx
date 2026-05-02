"use client";

import { useEffect, useRef } from "react";
import { useAppStore } from "@/lib/store/useAppStore";
import { syncToBackend } from "@/lib/sync/syncEngine";
import { getPendingCount } from "@/lib/db/dexie";

/**
 * OnlineWatcher — mounts once in the root layout.
 * Listens to online/offline events and auto-syncs when reconnecting.
 */
export function OnlineWatcher() {
  const { setIsOffline, setPendingSyncCount, setSyncStatus } = useAppStore();
  const syncInProgress = useRef(false);

  const refreshPendingCount = async () => {
    try {
      const count = await getPendingCount();
      setPendingSyncCount(count);
    } catch {/* IndexedDB not available in SSR */}
  };

  const runSync = async () => {
    if (syncInProgress.current) return;
    syncInProgress.current = true;
    setSyncStatus("pending");
    try {
      const { synced, failed } = await syncToBackend(setPendingSyncCount);
      setSyncStatus(failed > 0 ? "failed" : "synced");
      await refreshPendingCount();
    } catch {
      setSyncStatus("failed");
    } finally {
      syncInProgress.current = false;
      // Reset to idle after 3 seconds
      setTimeout(() => setSyncStatus("idle"), 3000);
    }
  };

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      runSync();
    };
    const handleOffline = () => setIsOffline(true);

    // Initial state
    setIsOffline(!navigator.onLine);
    refreshPendingCount();

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return null; // Invisible — side-effect only
}
