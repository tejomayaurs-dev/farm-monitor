/**
 * Shared TypeScript types for the Farm Monitor app.
 * These mirror the Supabase DB schema.
 */

export type UserRole = "admin" | "user";

export interface Profile {
  id: string;
  phone?: string;
  full_name?: string;
  role: UserRole;
  created_at?: string;
}

export interface Partition {
  id: string;
  name: string;
  created_at?: string;
}

export interface Line {
  id: string;
  partition_id: string;
  line_number: number;
  host_plant?: string;
  label?: string;
  created_at?: string;
}

export interface PlantMaster {
  id: string;
  name: string;
  created_at?: string;
}

export interface Plant {
  id: string;
  line_id: string;
  plant_master_id: string;
  position: number;
  plantation_year?: number;
  label?: string;
  created_at?: string;
  // Joined fields
  plant_name?: string;
  latest_status?: PlantStatus;
  status_updated_at?: string;
}

export type PlantStatus =
  | "good"
  | "medium"
  | "no_growth"
  | "replace"
  | "pest_attack";

export type ActivityType =
  | "input"
  | "pruning"
  | "harvest"
  | "water_check";

export interface PlantStatusLog {
  id: string;
  plant_id: string;
  status: PlantStatus;
  recorded_by?: string;
  notes?: string;
  timestamp: string;
  created_at?: string;
}

export interface PlantActivity {
  id: string;
  plant_id: string;
  activity_type: ActivityType;
  recorded_by?: string;
  notes?: string;
  timestamp: string;
  created_at?: string;
}

// ==========================================
// SYNC QUEUE (IndexedDB only)
// ==========================================
export type SyncStatus = "pending" | "synced" | "failed";
export type SyncActionType = "status_log" | "activity" | "partition" | "line" | "plant" | "plant_master";

export interface SyncQueueItem {
  id?: number; // Auto-increment in Dexie
  local_id: string; // UUID generated on device
  action_type: SyncActionType;
  payload: PlantStatusLog | PlantActivity | Partition | Line | Plant | PlantMaster;
  timestamp: string;
  sync_status: SyncStatus;
  retry_count: number;
}
