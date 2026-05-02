"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { db } from "@/lib/db/dexie";
import type { Partition, Line } from "@/lib/types";
import { ArrowLeft, RefreshCw, Activity, CheckCircle2 } from "lucide-react";

function UpdatesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const initialPartitionId = searchParams.get("partitionId") || "";
  const initialLineId = searchParams.get("lineId") || "";

  const [partitions, setPartitions] = useState<Partition[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  
  const [selectedPartitionId, setSelectedPartitionId] = useState(initialPartitionId);
  const [selectedLineId, setSelectedLineId] = useState(initialLineId);

  const [updates, setUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load partitions
  useEffect(() => {
    db.partitions.toArray().then((p) => {
      setPartitions(p.sort((a, b) => a.name.localeCompare(b.name)));
    });
  }, []);

  // Load lines when partition changes
  useEffect(() => {
    if (selectedPartitionId) {
      db.lines.where("partition_id").equals(selectedPartitionId).toArray().then((l) => {
        setLines(l.sort((a, b) => a.line_number - b.line_number));
      });
    } else {
      setLines([]);
    }
  }, [selectedPartitionId]);

  // Fetch updates
  const fetchUpdates = async () => {
    setLoading(true);
    try {
      const url = new URL("/api/updates", window.location.origin);
      if (selectedPartitionId) url.searchParams.set("partitionId", selectedPartitionId);
      if (selectedLineId) url.searchParams.set("lineId", selectedLineId);
      
      const res = await fetch(url.toString());
      if (res.ok) {
        const { data } = await res.json();
        setUpdates(data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpdates();
  }, [selectedPartitionId, selectedLineId]);

  return (
    <div className="flex flex-col min-h-dvh bg-gray-50 pb-20">
      <header className="bg-farm-gradient px-4 pt-4 pb-5">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-green-200 text-sm mb-3">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-white text-2xl font-bold flex items-center justify-between">
          <span>Recent Updates</span>
          <button onClick={fetchUpdates} disabled={loading} className="p-2 rounded-full hover:bg-white/10 transition-colors">
            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </h1>
      </header>

      <main className="flex-1 px-4 py-5 space-y-4">
        {/* Filters */}
        <div className="card space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Partition</label>
            <select
              value={selectedPartitionId}
              onChange={(e) => {
                setSelectedPartitionId(e.target.value);
                setSelectedLineId("");
              }}
              className="input-farm"
            >
              <option value="">All Partitions</option>
              {partitions.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          {selectedPartitionId && (
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Line</label>
              <select
                value={selectedLineId}
                onChange={(e) => setSelectedLineId(e.target.value)}
                className="input-farm"
              >
                <option value="">All Lines</option>
                {lines.map((l) => (
                  <option key={l.id} value={l.id}>{l.label || `Line ${l.line_number}`}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {updates.length === 0 ? (
              <div className="card text-center py-10 text-gray-400">No recent updates found.</div>
            ) : (
              updates.map((item) => (
                <div key={`${item._type}-${item.id}`} className="card flex items-start gap-3">
                  <div className="mt-1">
                    {item._type === "activity" ? (
                      <div className="bg-blue-100 p-2.5 rounded-full text-blue-600">
                        <Activity className="w-5 h-5" />
                      </div>
                    ) : (
                      <div className="bg-green-100 p-2.5 rounded-full text-green-600">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        {item._type === "status" ? "Status Update" : "Activity"}
                      </span>
                      <span className="text-[11px] text-gray-400">
                        {new Date(item.timestamp).toLocaleDateString()} {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="font-bold text-gray-900 mb-1">
                      {item.plants?.plant_name || "Unknown Plant"} (Pos: {item.plants?.position})
                    </p>
                    <p className="text-sm font-medium text-gray-700 capitalize">
                      {item._type === "status" ? `Status: ${item.status?.replace("_", " ")}` : `Activity: ${item.activity_type?.replace("_", " ")}`}
                    </p>
                    {item.notes && <p className="text-sm text-gray-600 mt-1.5 italic bg-gray-50 p-2 rounded-lg">"{item.notes}"</p>}
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100 flex-wrap">
                      <span className="text-[11px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">
                        {item.plants?.lines?.partitions?.name}
                      </span>
                      <span className="text-[11px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                        Line {item.plants?.lines?.line_number}
                      </span>
                      {item.recorded_by && (
                        <span className="text-[11px] text-gray-400 ml-auto">
                          By: <span className="font-medium text-gray-600">{item.recorded_by}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

export default function AdminUpdatesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading viewer...</div>}>
      <UpdatesContent />
    </Suspense>
  );
}
