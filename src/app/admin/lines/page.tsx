"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { SyncBadge } from "@/components/SyncBadge";
import { db } from "@/lib/db/dexie";
import type { Line, Partition } from "@/lib/types";
import { ArrowLeft, Plus, Trash2, RefreshCw, Activity } from "lucide-react";
import { enqueueLine } from "@/lib/sync/syncEngine";

/**
 * Admin — Line Management (CRUD).
 * Lines belong to partitions.
 */
export default function AdminLinesPage() {
  const router = useRouter();
  const isDemoMode = process.env.NEXT_PUBLIC_AUTH_MODE === "demo";

  const [partitions, setPartitions] = useState<Partition[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [selectedPartitionId, setSelectedPartitionId] = useState("");
  const [newLineNumber, setNewLineNumber] = useState("");
  const [hostPlant, setHostPlant] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    db.partitions.toArray().then((p) => {
      setPartitions(p.sort((a, b) => a.name.localeCompare(b.name)));
      if (p.length > 0) setSelectedPartitionId(p[0].id);
    });
  }, []);

  useEffect(() => {
    if (selectedPartitionId) {
      db.lines.where("partition_id").equals(selectedPartitionId).toArray().then((l) => {
        setLines(l.sort((a, b) => a.line_number - b.line_number));
      });
    }
  }, [selectedPartitionId]);

  const handleAdd = async () => {
    const num = parseInt(newLineNumber);
    if (!num || !selectedPartitionId) return;
    setSaving(true);
    const id = crypto.randomUUID();
    const line: Line = {
      id,
      partition_id: selectedPartitionId,
      line_number: num,
      host_plant: hostPlant.trim() || undefined,
      label: `Line ${num}`,
      created_at: new Date().toISOString(),
    };
    await db.lines.put(line);
    if (!isDemoMode) {
      await enqueueLine(line);
    }
    setLines((prev) => [...prev, line].sort((a, b) => a.line_number - b.line_number));
    setNewLineNumber("");
    setHostPlant("");
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    await db.lines.delete(id);
    setLines((prev) => prev.filter((l) => l.id !== id));
  };

  return (
    <div className="flex flex-col min-h-dvh bg-gray-50 pb-20">
      <header className="bg-farm-gradient px-4 pt-4 pb-5">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => router.back()} className="flex items-center gap-1 text-green-200 text-sm">
            <ArrowLeft className="w-4 h-4" /> Admin
          </button>
          <SyncBadge />
        </div>
        <h1 className="text-white text-2xl font-bold">Lines</h1>
      </header>

      <main className="flex-1 px-4 py-5 space-y-4">
        {/* Partition selector */}
        <div className="card">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Partition</label>
          <select
            value={selectedPartitionId}
            onChange={(e) => setSelectedPartitionId(e.target.value)}
            className="input-farm"
          >
            {partitions.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Add form */}
        <div className="card flex gap-2">
          <input
            type="number"
            value={newLineNumber}
            onChange={(e) => setNewLineNumber(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Line number (e.g. 7)"
            className="input-farm flex-[0.5] text-base py-2.5"
          />
          <input
            type="text"
            value={hostPlant}
            onChange={(e) => setHostPlant(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Host Plant (optional)"
            className="input-farm flex-1 text-base py-2.5"
          />
          <button
            onClick={handleAdd}
            disabled={saving || !newLineNumber}
            className="h-[52px] px-4 bg-farm-green text-white rounded-xl font-bold flex items-center gap-1 disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add
          </button>
        </div>

        {/* Lines list */}
        <div className="space-y-2">
          {lines.map((l) => (
            <div key={l.id} className="card flex items-center justify-between">
              <div>
                <p className="font-bold text-lg">{l.label ?? `Line ${l.line_number}`}</p>
                <p className="text-xs text-gray-400">Line #{l.line_number}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push(`/admin/updates?partitionId=${selectedPartitionId}&lineId=${l.id}`)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl text-blue-500 hover:bg-blue-50 active:scale-90"
                  title="View Updates"
                >
                  <Activity className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(l.id)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl text-red-400 hover:bg-red-50"
                  title="Delete Line"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {lines.length === 0 && (
            <p className="text-center text-gray-400 py-10">No lines for this partition</p>
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
