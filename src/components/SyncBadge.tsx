"use client";

import { useAppStore } from "@/lib/store/useAppStore";
import { syncToBackend } from "@/lib/sync/syncEngine";
import { getPendingCount } from "@/lib/db/dexie";
import { t } from "@/lib/i18n/translations";
import { RefreshCw, CheckCircle, AlertCircle, Clock, WifiOff } from "lucide-react";
import { useState } from "react";
import clsx from "clsx";

/**
 * SyncBadge — shows sync status and provides manual sync button.
 * Color-coded: Green=synced, Yellow=pending, Red=failed.
 */
export function SyncBadge() {
  const {
    isOffline,
    pendingSyncCount,
    syncStatus,
    setSyncStatus,
    setPendingSyncCount,
    language,
  } = useAppStore();
  const [syncing, setSyncing] = useState(false);

  const handleSyncNow = async () => {
    if (syncing || isOffline) return;
    setSyncing(true);
    setSyncStatus("pending");
    try {
      await syncToBackend(setPendingSyncCount);
      const count = await getPendingCount();
      setPendingSyncCount(count);
      setSyncStatus(count > 0 ? "failed" : "synced");
    } catch {
      setSyncStatus("failed");
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncStatus("idle"), 3000);
    }
  };

  if (isOffline) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 text-sm font-medium">
        <WifiOff className="w-4 h-4" />
        <span>{t("sync.offline", language)}</span>
        {pendingSyncCount > 0 && (
          <span className="bg-yellow-400 text-yellow-900 text-xs px-1.5 py-0.5 rounded-full font-bold">
            {pendingSyncCount}
          </span>
        )}
      </div>
    );
  }

  if (pendingSyncCount > 0) {
    return (
      <button
        onClick={handleSyncNow}
        disabled={syncing}
        className={clsx(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all active:scale-95",
          syncing
            ? "bg-yellow-100 text-yellow-700"
            : "bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
        )}
      >
        {syncing ? (
          <RefreshCw className="w-4 h-4 animate-spin" />
        ) : (
          <Clock className="w-4 h-4" />
        )}
        <span>{syncing ? t("sync.syncing", language) : t("sync.sync_now", language)}</span>
        <span className="bg-yellow-400 text-yellow-900 text-xs px-1.5 py-0.5 rounded-full font-bold">
          {pendingSyncCount}
        </span>
      </button>
    );
  }

  if (syncStatus === "synced") {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 text-green-700 text-sm font-medium">
        <CheckCircle className="w-4 h-4" />
        <span>{t("sync.synced", language)}</span>
      </div>
    );
  }

  if (syncStatus === "failed") {
    return (
      <button
        onClick={handleSyncNow}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 text-red-700 text-sm font-medium hover:bg-red-100 active:scale-95 transition-all"
      >
        <AlertCircle className="w-4 h-4" />
        <span>{t("sync.failed", language)}</span>
      </button>
    );
  }

  return null;
}
