"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/db/dexie";
import { BottomNav } from "@/components/BottomNav";
import { useAppStore } from "@/lib/store/useAppStore";
import { t } from "@/lib/i18n/translations";
import { BarChart2, AlertTriangle, Bug, TrendingUp, Leaf } from "lucide-react";
import type { PlantStatus } from "@/lib/types";

interface InsightData {
  totalPlants: number;
  byStatus: Record<string, number>;
  needsReplacement: number;
  pestAttacks: number;
  activitiesThisWeek: number;
  mostActivePartition: string;
}

const STATUS_EMOJI: Record<string, string> = {
  good: "✅",
  medium: "⚠️",
  replace: "❌",
  no_growth: "⏸️",
  pest_attack: "🐛",
};

/**
 * Insights dashboard — plant health analytics from local IndexedDB.
 * Works fully offline.
 */
export default function InsightsPage() {
  const { language } = useAppStore();
  const [data, setData] = useState<InsightData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    computeInsights();
  }, []);

  const computeInsights = async () => {
    setLoading(true);
    try {
      const plants = await db.plants.toArray();
      const statusLogs = await db.plant_status_logs_local.toArray();
      const activities = await db.plant_activities_local.toArray();
      const partitions = await db.partitions.toArray();
      const lines = await db.lines.toArray();

      // Get latest status per plant
      const latestByPlant: Record<string, PlantStatus> = {};
      statusLogs
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .forEach((log) => {
          latestByPlant[log.plant_id] = log.status as PlantStatus;
        });

      const byStatus: Record<string, number> = {};
      Object.values(latestByPlant).forEach((s) => {
        byStatus[s] = (byStatus[s] ?? 0) + 1;
      });

      // Activities in the last 7 days
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const recentActivities = activities.filter((a) => a.timestamp >= weekAgo);

      // Most active partition (by log count)
      const lineToPartition: Record<string, string> = {};
      lines.forEach((l) => { lineToPartition[l.id] = l.partition_id; });
      const plantToLine: Record<string, string> = {};
      plants.forEach((p) => { plantToLine[p.id] = p.line_id; });

      const partitionActivity: Record<string, number> = {};
      [...statusLogs, ...activities].forEach((log) => {
        const lineId = plantToLine[(log as any).plant_id];
        const partId = lineToPartition[lineId];
        if (partId) partitionActivity[partId] = (partitionActivity[partId] ?? 0) + 1;
      });

      const mostActiveId = Object.entries(partitionActivity).sort((a, b) => b[1] - a[1])[0]?.[0];
      const mostActivePartition = partitions.find((p) => p.id === mostActiveId)?.name ?? "—";

      setData({
        totalPlants: plants.length,
        byStatus,
        needsReplacement: byStatus["replace"] ?? 0,
        pestAttacks: byStatus["pest_attack"] ?? 0,
        activitiesThisWeek: recentActivities.length,
        mostActivePartition,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-dvh bg-gray-50 pb-20">
      <header className="bg-farm-gradient px-4 pt-8 pb-6">
        <div className="flex items-center gap-2 mb-1">
          <BarChart2 className="w-5 h-5 text-green-200" />
          <span className="text-green-200 text-sm font-medium">Analytics</span>
        </div>
        <h1 className="text-white text-2xl font-bold">{t("nav.insights", language)}</h1>
        <p className="text-green-200 text-sm mt-0.5">Offline calculated from local data</p>
      </header>

      <main className="flex-1 px-4 py-5 space-y-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : data ? (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="card text-center">
                <Leaf className="w-6 h-6 text-green-600 mx-auto mb-1" />
                <p className="text-3xl font-black text-gray-900">{data.totalPlants}</p>
                <p className="text-xs text-gray-500">Total Plants</p>
              </div>
              <div className="card text-center">
                <TrendingUp className="w-6 h-6 text-blue-500 mx-auto mb-1" />
                <p className="text-3xl font-black text-gray-900">{data.activitiesThisWeek}</p>
                <p className="text-xs text-gray-500">Activities This Week</p>
              </div>
            </div>

            {/* Alerts */}
            {data.needsReplacement > 0 && (
              <div className="card flex items-center gap-3 bg-red-50 border border-red-200">
                <AlertTriangle className="w-8 h-8 text-red-500 shrink-0" />
                <div>
                  <p className="font-bold text-red-800">
                    {data.needsReplacement} plant{data.needsReplacement > 1 ? "s" : ""} need replacement
                  </p>
                  <p className="text-sm text-red-600">Check your plant grid for red tiles</p>
                </div>
              </div>
            )}

            {data.pestAttacks > 0 && (
              <div className="card flex items-center gap-3 bg-orange-50 border border-orange-200">
                <Bug className="w-8 h-8 text-orange-500 shrink-0" />
                <div>
                  <p className="font-bold text-orange-800">
                    {data.pestAttacks} pest attack{data.pestAttacks > 1 ? "s" : ""} reported
                  </p>
                  <p className="text-sm text-orange-600">Inspect affected plants immediately</p>
                </div>
              </div>
            )}

            {/* Status breakdown */}
            <div className="card">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">
                Status Breakdown
              </h2>
              <div className="space-y-2">
                {Object.entries(data.byStatus).map(([status, count]) => {
                  const pct = data.totalPlants > 0 ? Math.round((count / data.totalPlants) * 100) : 0;
                  return (
                    <div key={status}>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                          {STATUS_EMOJI[status]} {status.replace("_", " ")}
                        </span>
                        <span className="text-sm text-gray-500">
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            status === "good" ? "bg-green-500" :
                            status === "medium" ? "bg-yellow-500" :
                            status === "replace" ? "bg-red-500" :
                            status === "no_growth" ? "bg-gray-400" :
                            "bg-orange-500"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                {Object.keys(data.byStatus).length === 0 && (
                  <p className="text-gray-400 text-sm text-center py-4">
                    No status data yet — start monitoring plants
                  </p>
                )}
              </div>
            </div>

            {/* Most active partition */}
            <div className="card flex items-center gap-3">
              <span className="text-3xl">🏆</span>
              <div>
                <p className="font-bold text-gray-900">Most Active: {data.mostActivePartition}</p>
                <p className="text-xs text-gray-400">Highest logging activity</p>
              </div>
            </div>
          </>
        ) : (
          <p className="text-center text-gray-400 py-20">No data available</p>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
