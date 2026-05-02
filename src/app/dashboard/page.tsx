"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store/useAppStore";
import { db, seedLocalData } from "@/lib/db/dexie";
import { t } from "@/lib/i18n/translations";
import { SyncBadge } from "@/components/SyncBadge";
import { BottomNav } from "@/components/BottomNav";
import type { Partition } from "@/lib/types";
import { Leaf, LogOut, Languages } from "lucide-react";
import clsx from "clsx";

/** Partition color palette — cycles through farm-themed colors */
const PART_COLORS = [
  "bg-green-500 text-white",
  "bg-emerald-500 text-white",
  "bg-teal-500 text-white",
  "bg-lime-500 text-white",
  "bg-cyan-500 text-white",
  "bg-sky-500 text-white",
];

// =============================================
// DEMO DATA — used when no Supabase is set up
// =============================================
const DEMO_PARTITIONS: Partition[] = [
  { id: "p1", name: "P1", created_at: new Date().toISOString() },
  { id: "p2", name: "P2", created_at: new Date().toISOString() },
  { id: "p3", name: "P3", created_at: new Date().toISOString() },
  { id: "p4", name: "P4", created_at: new Date().toISOString() },
];

/**
 * Dashboard — Step 1: Select a partition.
 * Shows large, colorful partition buttons.
 */
export default function DashboardPage() {
  const router = useRouter();
  const {
    profile,
    setProfile,
    setSelectedPartition,
    language,
    setLanguage,
  } = useAppStore();

  const [partitions, setPartitions] = useState<Partition[]>([]);
  const [loading, setLoading] = useState(true);
  const isDemoMode = process.env.NEXT_PUBLIC_AUTH_MODE === "demo";

  useEffect(() => {
    loadPartitions();
  }, []);

  const loadPartitions = async () => {
    setLoading(true);
    try {
      // Try local DB first (offline-first)
      let local = await db.partitions.toArray();

      if (local.length === 0) {
        if (isDemoMode) {
          // Seed demo data
          await seedLocalData({
            partitions: DEMO_PARTITIONS,
          });
          local = DEMO_PARTITIONS;
        } else {
          // Fetch from backend
          const res = await fetch("/api/partitions");
          if (res.ok) {
            const { data } = await res.json();
            await seedLocalData({ partitions: data });
            local = data;
          }
        }
      }

      setPartitions(local.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (e) {
      setPartitions(DEMO_PARTITIONS);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    // Clear profile from store (and persisted storage)
    setProfile(null);
    router.replace("/login");
  };

  const handleSelectPartition = (partition: Partition) => {
    setSelectedPartition(partition);
    router.push(`/dashboard/${partition.id}`);
  };

  return (
    <div className="flex flex-col min-h-dvh bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-farm-gradient px-4 pt-safe-top pb-6">
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-2">
            <Leaf className="w-6 h-6 text-white" />
            <span className="text-white font-bold text-lg">Farm Monitor</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Language toggle */}
            <button
              onClick={() => setLanguage(language === "en" ? "kn" : "en")}
              className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center active:scale-90 transition-transform"
              title="Toggle Kannada / English"
            >
              <Languages className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={handleLogout}
              className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center active:scale-90 transition-transform"
            >
              <LogOut className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Greeting */}
        <div className="mt-4">
          <p className="text-green-200 text-sm">
            {profile?.role === "admin" ? "👑 Admin" : "👷 User"}
            {profile?.full_name ? ` · ${profile.full_name}` : ""}
          </p>
          <h1 className="text-white text-2xl font-bold mt-0.5">
            {t("dashboard.select_partition", language)}
          </h1>
        </div>

        {/* Sync badge */}
        <div className="mt-3">
          <SyncBadge />
        </div>
      </header>

      {/* Partition Grid */}
      <main className="flex-1 px-4 py-6">
        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-32 bg-gray-200 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {partitions.map((partition, idx) => (
              <button
                key={partition.id}
                onClick={() => handleSelectPartition(partition)}
                className={clsx(
                  "h-32 rounded-2xl flex flex-col items-center justify-center gap-2",
                  "shadow-md active:scale-95 transition-transform font-bold",
                  PART_COLORS[idx % PART_COLORS.length]
                )}
              >
                <span className="text-4xl font-black tracking-tight">
                  {partition.name}
                </span>
                <span className="text-sm opacity-80 font-normal">
                  {t("dashboard.select_partition", language)}
                </span>
              </button>
            ))}
          </div>
        )}

        {!loading && partitions.length === 0 && (
          <div className="text-center text-gray-400 mt-20">
            <p className="text-5xl mb-4">🌱</p>
            <p className="font-medium">No partitions yet</p>
            {profile?.role === "admin" && (
              <button
                onClick={() => router.push("/admin/partitions")}
                className="mt-4 px-6 py-2 bg-farm-green text-white rounded-xl text-sm font-semibold"
              >
                Add Partitions
              </button>
            )}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
