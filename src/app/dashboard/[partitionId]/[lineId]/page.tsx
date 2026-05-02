"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store/useAppStore";
import { db, seedLocalData } from "@/lib/db/dexie";
import { t } from "@/lib/i18n/translations";
import { BottomNav } from "@/components/BottomNav";
import { PlantTile } from "@/components/PlantTile";
import type { Plant } from "@/lib/types";
import { ArrowLeft } from "lucide-react";

// Demo plants for testing
function makeDemoPlants(lineId: string, partitionId: string): Plant[] {
  const statuses = ["good", "medium", "replace", "no_growth", "pest_attack", "good", "good", null];
  return Array.from({ length: 8 }, (_, i) => ({
    id: `${lineId}-plant-${i + 1}`,
    line_id: lineId,
    plant_master_id: "pm1",
    position: i + 1,
    plant_name: ["Tomato", "Pepper", "Basil", "Lettuce", "Cucumber", "Tomato", "Pepper", "Basil"][i],
    latest_status: (statuses[i] ?? undefined) as Plant["latest_status"],
  }));
}

/**
 * Step 3: Plant grid — color-coded tiles showing all plants in a line.
 */
export default function LinePlantsPage() {
  const params = useParams<{ partitionId: string; lineId: string }>();
  const router = useRouter();
  const { selectedLine, selectedPartition, language } = useAppStore();
  const isDemoMode = process.env.NEXT_PUBLIC_AUTH_MODE === "demo";

  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlants();
  }, [params.lineId]);

  const loadPlants = async () => {
    setLoading(true);
    try {
      let local = await db.plants.where("line_id").equals(params.lineId).toArray();

      if (local.length === 0) {
        if (isDemoMode) {
          // Seed 8 demo plants
          const demoPlants = makeDemoPlants(params.lineId, params.partitionId);
          // Keep plants without latest_status for seedLocalData
          await seedLocalData({
            plants: demoPlants.map(({ plant_name, latest_status, status_updated_at, ...p }) => p),
          });
          local = demoPlants;
        } else {
          const res = await fetch(`/api/plants?line_id=${params.lineId}`);
          if (res.ok) {
            const { data } = await res.json();
            await seedLocalData({ plants: data });
            local = data;
          }
        }
      }

      // Enrich with latest local status logs
      const enriched = await Promise.all(
        local.map(async (p) => {
          const log = await db.plant_status_logs_local
            .where("plant_id")
            .equals(p.id)
            .reverse()
            .sortBy("timestamp")
            .then((logs) => logs[0]);
          return {
            ...p,
            latest_status: log?.status ?? p.latest_status,
          };
        })
      );

      setPlants(enriched.sort((a, b) => a.position - b.position));
    } catch {
      setPlants([]);
    } finally {
      setLoading(false);
    }
  };

  const lineName = selectedLine?.label ?? `Line ${selectedLine?.line_number ?? ""}`;

  return (
    <div className="flex flex-col min-h-dvh bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-farm-gradient px-4 pt-4 pb-5">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-green-200 text-sm mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          {selectedPartition?.name ?? params.partitionId}
        </button>
        <h1 className="text-white text-2xl font-bold">{lineName}</h1>
        <p className="text-green-200 text-sm mt-0.5">
          {plants.length} {t("dashboard.plants", language)}
        </p>
      </header>

      {/* Status legend */}
      <div className="px-4 py-2 bg-white border-b border-gray-100 flex gap-3 overflow-x-auto text-xs">
        {[
          { color: "bg-green-500", label: "Good" },
          { color: "bg-yellow-500", label: "Medium" },
          { color: "bg-red-500", label: "Replace" },
          { color: "bg-gray-400", label: "No Growth" },
          { color: "bg-orange-500", label: "Pest" },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-1 shrink-0">
            <span className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
            <span className="text-gray-600">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Plant grid */}
      <main className="flex-1 px-4 py-4">
        {loading ? (
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : plants.length === 0 ? (
          <div className="text-center text-gray-400 mt-20">
            <p className="text-5xl mb-4">🌱</p>
            <p>{t("misc.no_plants", language)}</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {plants.map((plant) => (
              <PlantTile
                key={plant.id}
                plant={plant}
                partitionId={params.partitionId}
                lineId={params.lineId}
              />
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
