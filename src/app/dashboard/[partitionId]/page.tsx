"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAppStore } from "@/lib/store/useAppStore";
import { db, seedLocalData } from "@/lib/db/dexie";
import { t } from "@/lib/i18n/translations";
import { BottomNav } from "@/components/BottomNav";
import type { Line } from "@/lib/types";
import { ArrowLeft, Rows3 } from "lucide-react";
import clsx from "clsx";

// Demo lines seeded for 4 partitions
const DEMO_LINES: Line[] = Array.from({ length: 6 }, (_, i) => ({
  id: `line-${i + 1}`,
  partition_id: "p1",
  line_number: i + 1,
  label: `Line ${i + 1}`,
}));

/**
 * Step 2: Select a line within a partition.
 */
export default function PartitionPage() {
  const router = useRouter();
  const params = useParams<{ partitionId: string }>();
  const { selectedPartition, setSelectedLine, language } = useAppStore();
  const isDemoMode = process.env.NEXT_PUBLIC_AUTH_MODE === "demo";

  const [lines, setLines] = useState<Line[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLines();
  }, [params.partitionId]);

  const loadLines = async () => {
    setLoading(true);
    try {
      let local = await db.lines
        .where("partition_id")
        .equals(params.partitionId)
        .toArray();

      if (local.length === 0) {
        if (isDemoMode) {
          // Seed demo lines for all partitions
          const demoAllLines: Line[] = ["p1", "p2", "p3", "p4"].flatMap((pid, pi) =>
            Array.from({ length: 6 }, (_, i) => ({
              id: `${pid}-line-${i + 1}`,
              partition_id: pid,
              line_number: i + 1,
              label: `Line ${i + 1}`,
            }))
          );
          await seedLocalData({ lines: demoAllLines });
          local = demoAllLines.filter((l) => l.partition_id === params.partitionId);
        } else {
          const res = await fetch(`/api/lines?partition_id=${params.partitionId}`);
          if (res.ok) {
            const { data } = await res.json();
            await seedLocalData({ lines: data });
            local = data;
          }
        }
      }

      setLines(local.sort((a, b) => a.line_number - b.line_number));
    } catch {
      setLines([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectLine = (line: Line) => {
    setSelectedLine(line);
    router.push(`/dashboard/${params.partitionId}/${line.id}`);
  };

  return (
    <div className="flex flex-col min-h-dvh bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-farm-gradient px-4 pt-4 pb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-green-200 text-sm mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("dashboard.select_partition", language)}
        </button>
        <h1 className="text-white text-2xl font-bold">
          {selectedPartition?.name ?? params.partitionId} — {t("dashboard.select_line", language)}
        </h1>
        <p className="text-green-200 text-sm mt-1">{lines.length} lines</p>
      </header>

      {/* Lines list */}
      <main className="flex-1 px-4 py-6 space-y-3">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded-2xl animate-pulse" />
            ))
          : lines.map((line) => (
              <button
                key={line.id}
                onClick={() => handleSelectLine(line)}
                className="w-full flex items-center gap-4 bg-white rounded-2xl px-5 py-4 shadow-sm active:scale-98 transition-transform border border-gray-100"
              >
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Rows3 className="w-5 h-5 text-green-700" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-bold text-gray-900 text-lg">
                    {line.label ?? `Line ${line.line_number}`}
                  </p>
                  <p className="text-gray-400 text-sm">Line {line.line_number}</p>
                </div>
                <ArrowLeft className="w-5 h-5 text-gray-300 rotate-180" />
              </button>
            ))}

        {!loading && lines.length === 0 && (
          <div className="text-center text-gray-400 mt-20">
            <p className="text-5xl mb-4">🌿</p>
            <p>No lines in this partition yet</p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
