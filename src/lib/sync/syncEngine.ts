/**
 * Sync Engine — handles draining the offline sync_queue to Supabase.
 *
 * Called:
 * 1. Automatically when navigator.onLine event fires
 * 2. Manually via "Sync Now" button
 */

import { db, getPendingSyncItems, markSynced, markFailed, getPendingCount } from "@/lib/db/dexie";
import type { SyncQueueItem } from "@/lib/types";

const MAX_RETRIES = 3;

/**
 * Sync all pending items to Supabase via API routes.
 * Returns the number of successfully synced items.
 */
export async function syncToBackend(
  onProgress?: (pending: number) => void
): Promise<{ synced: number; failed: number }> {
  const items = await getPendingSyncItems();
  if (items.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;

  // Group by action_type for batch API calls
  const statusLogs = items.filter((i) => i.action_type === "status_log");
  const activities = items.filter((i) => i.action_type === "activity");

  // Sync status logs
  if (statusLogs.length > 0) {
    const result = await syncBatch(statusLogs, "/api/sync/status");
    synced += result.synced;
    failed += result.failed;
  }

  // Sync activities
  if (activities.length > 0) {
    const result = await syncBatch(activities, "/api/sync/activities");
    synced += result.synced;
    failed += result.failed;
  }

  // Update pending count after sync
  const remaining = await getPendingCount();
  onProgress?.(remaining);

  return { synced, failed };
}

async function syncBatch(
  items: SyncQueueItem[],
  endpoint: string
): Promise<{ synced: number; failed: number }> {
  const syncableItems = items.filter((i) => i.retry_count < MAX_RETRIES);

  if (syncableItems.length === 0) return { synced: 0, failed: 0 };

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        records: syncableItems.map((i) => i.payload),
      }),
    });

    if (res.ok) {
      const ids = syncableItems.map((i) => i.id!);
      await markSynced(ids);
      return { synced: ids.length, failed: 0 };
    } else {
      // Mark for retry
      const ids = syncableItems.map((i) => i.id!);
      await incrementRetryCount(ids);
      await markFailed(ids.filter((_, idx) => syncableItems[idx].retry_count + 1 >= MAX_RETRIES));
      return { synced: 0, failed: ids.length };
    }
  } catch {
    // Network error — keep as pending for next retry
    return { synced: 0, failed: 0 };
  }
}

async function incrementRetryCount(ids: number[]): Promise<void> {
  const items = await db.sync_queue.bulkGet(ids);
  const updates = items
    .map((item) => {
      if (!item || !item.id) return null;
      return {
        key: item.id,
        changes: {
          sync_status: "pending" as const,
          retry_count: (item.retry_count ?? 0) + 1,
        },
      };
    })
    .filter(Boolean) as { key: number; changes: any }[];

  await db.sync_queue.bulkUpdate(updates);
}

/**
 * Enqueue a status log update (works offline — saves to Dexie sync queue)
 */
export async function enqueueStatusLog(payload: {
  id: string;        // UUID generated on device
  plant_id: string;
  status: string;
  recorded_by?: string;
  notes?: string;
  timestamp: string;
}): Promise<void> {
  await db.plant_status_logs_local.put(payload as any);
  await db.sync_queue.add({
    local_id: payload.id,
    action_type: "status_log",
    payload: payload as any,
    timestamp: payload.timestamp,
    sync_status: "pending",
    retry_count: 0,
  });
}

/**
 * Enqueue an activity log (works offline — saves to Dexie sync queue)
 */
export async function enqueueActivity(payload: {
  id: string;
  plant_id: string;
  activity_type: string;
  recorded_by?: string;
  notes?: string;
  timestamp: string;
}): Promise<void> {
  await db.plant_activities_local.put(payload as any);
  await db.sync_queue.add({
    local_id: payload.id,
    action_type: "activity",
    payload: payload as any,
    timestamp: payload.timestamp,
    sync_status: "pending",
    retry_count: 0,
  });
}
