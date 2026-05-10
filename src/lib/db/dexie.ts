import Dexie, { Table } from "dexie";
import type {
  Partition,
  Line,
  PlantMaster,
  Plant,
  PlantStatusLog,
  PlantActivity,
  SyncQueueItem,
} from "@/lib/types";

/**
 * FarmDB — Dexie (IndexedDB) schema for offline-first storage.
 *
 * Tables:
 * - partitions / lines / plant_master / plants: Local mirror of Supabase data
 * - plant_status_logs_local: Status updates made offline
 * - plant_activities_local: Activities logged offline
 * - sync_queue: Pending records waiting to be synced to Supabase
 */
class FarmDatabase extends Dexie {
  partitions!: Table<Partition, string>;
  lines!: Table<Line, string>;
  plant_master!: Table<PlantMaster, string>;
  plants!: Table<Plant, string>;
  plant_status_logs_local!: Table<PlantStatusLog, string>;
  plant_activities_local!: Table<PlantActivity, string>;
  sync_queue!: Table<SyncQueueItem, number>;

  constructor() {
    super("FarmMonitorDB");

    this.version(1).stores({
      // Primary key first, then indexed fields
      partitions: "id, name",
      lines: "id, partition_id, line_number",
      plant_master: "id, name",
      plants: "id, line_id, plant_master_id, position",
      plant_status_logs_local: "id, plant_id, status, timestamp, recorded_by",
      plant_activities_local: "id, plant_id, activity_type, timestamp, recorded_by",
      // Auto-increment id for sync queue
      sync_queue: "++id, local_id, action_type, sync_status, timestamp",
    });
  }
}

// Singleton instance — safe to import anywhere in the app
export const db = new FarmDatabase();

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/** Get the latest status for a plant from local DB */
export async function getLatestPlantStatus(
  plantId: string
): Promise<PlantStatusLog | undefined> {
  return db.plant_status_logs_local
    .where("plant_id")
    .equals(plantId)
    .reverse()
    .sortBy("timestamp")
    .then((logs) => logs[0]);
}

/** Get all pending sync items */
export async function getPendingSyncItems(): Promise<SyncQueueItem[]> {
  return db.sync_queue.where("sync_status").equals("pending").toArray();
}

/** Mark sync items as synced */
export async function markSynced(ids: number[]): Promise<void> {
  await db.sync_queue.bulkUpdate(
    ids.map((id) => ({ key: id, changes: { sync_status: "synced" } }))
  );
}

/** Mark sync items as failed */
export async function markFailed(ids: number[]): Promise<void> {
  await db.sync_queue.bulkUpdate(
    ids.map((id) => ({
      key: id,
      changes: {
        sync_status: "failed",
        // Increment retry_count is handled by the sync engine
      },
    }))
  );
}

/** Count pending sync items */
export async function getPendingCount(): Promise<number> {
  return db.sync_queue.where("sync_status").equals("pending").count();
}

/** Seed local DB from backend data (called after login or manual sync) */
export async function seedLocalData(data: {
  partitions?: Partition[];
  lines?: Line[];
  plant_master?: PlantMaster[];
  plants?: Plant[];
}) {
  if (data.partitions?.length) await db.partitions.bulkPut(data.partitions);
  if (data.lines?.length) await db.lines.bulkPut(data.lines);
  if (data.plant_master?.length) await db.plant_master.bulkPut(data.plant_master);
  if (data.plants?.length) await db.plants.bulkPut(data.plants);
}

/** Clear all local data mirrors (leaves sync_queue intact for safety) */
export async function clearLocalCache() {
  await Promise.all([
    db.partitions.clear(),
    db.lines.clear(),
    db.plant_master.clear(),
    db.plants.clear(),
    db.plant_status_logs_local.clear(),
    db.plant_activities_local.clear(),
  ]);
}
