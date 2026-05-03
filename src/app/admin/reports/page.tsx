"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/db/dexie";
import { useAppStore } from "@/lib/store/useAppStore";
import { BottomNav } from "@/components/BottomNav";
import { t } from "@/lib/i18n/translations";
import { 
  ArrowLeft, 
  BarChart, 
  PieChart, 
  Table as TableIcon, 
  Leaf, 
  LayoutGrid,
  Trees
} from "lucide-react";
import clsx from "clsx";

interface ReportData {
  plantCountsByPartition: Record<string, Record<string, number>>;
  hostPlantsByPartition: Record<string, string[]>;
  plantCountsByLine: Record<string, Record<string, Record<string, number>>>;
  totalByPartition: Record<string, number>;
  partitionNames: Record<string, string>;
  plantNames: Record<string, string>;
  lineLabels: Record<string, string>;
}

export default function AdminReportsPage() {
  const router = useRouter();
  const { language } = useAppStore();
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateReports();
  }, []);

  const generateReports = async () => {
    setLoading(true);
    try {
      const [partitions, lines, plants, masters] = await Promise.all([
        db.partitions.toArray(),
        db.lines.toArray(),
        db.plants.toArray(),
        db.plant_master.toArray(),
      ]);

      const partitionNames: Record<string, string> = {};
      partitions.forEach(p => partitionNames[p.id] = p.name);

      const plantNames: Record<string, string> = {};
      masters.forEach(m => plantNames[m.id] = m.name);

      const lineLabels: Record<string, string> = {};
      lines.forEach(l => lineLabels[l.id] = l.label || `L${l.line_number}`);

      const plantCountsByPartition: Record<string, Record<string, number>> = {};
      const hostPlantsByPartition: Record<string, Set<string>> = {};
      const plantCountsByLine: Record<string, Record<string, Record<string, number>>> = {};
      const totalByPartition: Record<string, number> = {};

      // Map lines to partitions for easier lookup
      const lineToPartition: Record<string, string> = {};
      lines.forEach(l => {
        lineToPartition[l.id] = l.partition_id;
        if (l.host_plant) {
          if (!hostPlantsByPartition[l.partition_id]) hostPlantsByPartition[l.partition_id] = new Set();
          hostPlantsByPartition[l.partition_id].add(l.host_plant);
        }
      });

      plants.forEach(p => {
        const partId = lineToPartition[p.line_id];
        if (!partId) return;

        // Partition counts
        if (!plantCountsByPartition[partId]) plantCountsByPartition[partId] = {};
        const pName = plantNames[p.plant_master_id] || "Unknown";
        plantCountsByPartition[partId][pName] = (plantCountsByPartition[partId][pName] || 0) + 1;

        // Line counts
        if (!plantCountsByLine[partId]) plantCountsByLine[partId] = {};
        if (!plantCountsByLine[partId][p.line_id]) plantCountsByLine[partId][p.line_id] = {};
        plantCountsByLine[partId][p.line_id][pName] = (plantCountsByLine[partId][p.line_id][pName] || 0) + 1;

        // Totals
        totalByPartition[partId] = (totalByPartition[partId] || 0) + 1;
      });

      // Convert Sets to Arrays for state
      const hostPlants: Record<string, string[]> = {};
      Object.entries(hostPlantsByPartition).forEach(([id, set]) => {
        hostPlants[id] = Array.from(set);
      });

      setData({
        plantCountsByPartition,
        hostPlantsByPartition: hostPlants,
        plantCountsByLine,
        totalByPartition,
        partitionNames,
        plantNames,
        lineLabels
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-dvh bg-gray-50 pb-24">
      <header className="bg-farm-gradient px-4 pt-4 pb-6 shadow-sm">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-green-200 text-sm mb-3">
          <ArrowLeft className="w-4 h-4" /> {t("nav.admin", language)}
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <BarChart className="text-white w-6 h-6" />
          </div>
          <h1 className="text-white text-2xl font-bold">{t("admin.reports", language)}</h1>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 space-y-8">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-gray-200 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : data ? (
          <>
            {/* 1. Overall Summary */}
            <section>
              <h2 className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                <PieChart className="w-3 h-3" /> Dashboard Summary
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(data.partitionNames).map(([id, name]) => (
                  <div key={id} className="card p-4 flex flex-col items-center justify-center text-center">
                    <p className="text-2xl font-black text-gray-900">{data.totalByPartition[id] || 0}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">{name}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* 2. Plant Counts by Partition */}
            <section>
              <h2 className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                <Leaf className="w-3 h-3" /> Plant Variety by Partition
              </h2>
              {Object.entries(data.partitionNames).map(([id, name]) => (
                <div key={id} className="card p-0 overflow-hidden mb-3">
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-100 flex justify-between items-center">
                    <span className="font-bold text-gray-700">{name}</span>
                    <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      {data.totalByPartition[id] || 0} Total
                    </span>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {data.plantCountsByPartition[id] ? (
                      Object.entries(data.plantCountsByPartition[id]).map(([pName, count]) => (
                        <div key={pName} className="px-4 py-3 flex justify-between items-center">
                          <span className="text-sm text-gray-600">{pName}</span>
                          <span className="font-bold text-gray-900">{count}</span>
                        </div>
                      ))
                    ) : (
                      <p className="p-4 text-center text-gray-400 text-sm italic">No plants recorded</p>
                    )}
                  </div>
                </div>
              ))}
            </section>

            {/* 3. Host Plants */}
            <section>
              <h2 className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                <Trees className="w-3 h-3" /> Host Plant Allocation
              </h2>
              <div className="space-y-3">
                {Object.entries(data.partitionNames).map(([id, name]) => (
                  <div key={id} className="card flex items-start gap-4">
                    <div className="w-10 h-10 bg-farm-green/10 text-farm-green rounded-xl flex items-center justify-center shrink-0">
                      <LayoutGrid className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{name}</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {data.hostPlantsByPartition[id]?.length ? (
                          data.hostPlantsByPartition[id].map(hp => (
                            <span key={hp} className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg text-xs font-medium">
                              {hp}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400 italic">No host plants defined</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 4. Detailed Breakdown by Line */}
            <section>
              <h2 className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                <TableIcon className="w-3 h-3" /> Granular Line Breakdown
              </h2>
              {Object.entries(data.partitionNames).map(([id, name]) => (
                <div key={id} className="mb-6">
                  <p className="font-black text-gray-300 text-3xl mb-2 opacity-50 uppercase">{name}</p>
                  <div className="space-y-2">
                    {data.plantCountsByLine[id] ? (
                      Object.entries(data.plantCountsByLine[id]).map(([lineId, lineData]) => (
                        <div key={lineId} className="card p-4 border-l-4 border-l-farm-green">
                          <p className="font-bold text-gray-900 mb-2">{data.lineLabels[lineId]}</p>
                          <div className="grid grid-cols-2 gap-y-1 gap-x-4">
                            {Object.entries(lineData).map(([pName, count]) => (
                              <div key={pName} className="flex justify-between text-xs">
                                <span className="text-gray-500">{pName}</span>
                                <span className="font-bold text-gray-800">{count}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="card p-4 text-center text-gray-400 text-sm">No rows configured</div>
                    )}
                  </div>
                </div>
              ))}
            </section>
          </>
        ) : (
          <div className="card p-12 text-center text-gray-400">
            <p>No farm data found to generate reports.</p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
