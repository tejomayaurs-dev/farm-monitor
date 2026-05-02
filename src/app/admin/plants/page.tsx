"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { SyncBadge } from "@/components/SyncBadge";
import { db } from "@/lib/db/dexie";
import type { Plant, Line, Partition, PlantMaster } from "@/lib/types";
import { ArrowLeft, Plus, Trash2, RefreshCw } from "lucide-react";
import { enqueuePlant } from "@/lib/sync/syncEngine";

/**
 * Admin — Plant placement under lines.
 */
export default function AdminPlantsPage() {
  const router = useRouter();
  const isDemoMode = process.env.NEXT_PUBLIC_AUTH_MODE === "demo";

  const [partitions, setPartitions] = useState<Partition[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [masters, setMasters] = useState<PlantMaster[]>([]);

  const [selPartitionId, setSelPartitionId] = useState("");
  const [selLineId, setSelLineId] = useState("");
  const [selMasterId, setSelMasterId] = useState("");
  const [position, setPosition] = useState("");
  const [plantationYear, setPlantationYear] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    db.partitions.toArray().then((p) => {
      setPartitions(p);
      if (p.length) setSelPartitionId(p[0].id);
    });
    db.plant_master.toArray().then((m) => {
      setMasters(m);
      if (m.length) setSelMasterId(m[0].id);
    });
  }, []);

  useEffect(() => {
    if (selPartitionId) {
      db.lines.where("partition_id").equals(selPartitionId).toArray().then((l) => {
        setLines(l.sort((a, b) => a.line_number - b.line_number));
        if (l.length) setSelLineId(l[0].id);
      });
    }
  }, [selPartitionId]);

  useEffect(() => {
    if (selLineId) {
      db.plants.where("line_id").equals(selLineId).toArray().then((p) =>
        setPlants(p.sort((a, b) => a.position - b.position))
      );
    }
  }, [selLineId]);

  const handleAdd = async () => {
    const pos = parseInt(position);
    const pYear = parseInt(plantationYear);
    if (!pos || !selLineId || !selMasterId) return;
    setSaving(true);
    const id = crypto.randomUUID();
    const plant: Plant = {
      id,
      line_id: selLineId,
      plant_master_id: selMasterId,
      position: pos,
      plantation_year: pYear ? pYear : undefined,
      label: masters.find((m) => m.id === selMasterId)?.name ?? "",
      created_at: new Date().toISOString(),
    };
    await db.plants.put(plant);
    if (!isDemoMode) {
      await enqueuePlant(plant);
    }
    setPlants((prev) => [...prev, plant].sort((a, b) => a.position - b.position));
    setPosition("");
    setPlantationYear("");
    setSaving(false);
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
        <h1 className="text-white text-2xl font-bold">Plants</h1>
      </header>

      <main className="flex-1 px-4 py-5 space-y-4">
        {/* Selectors */}
        <div className="card space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Partition</label>
            <select value={selPartitionId} onChange={(e) => setSelPartitionId(e.target.value)} className="input-farm">
              {partitions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Line</label>
            <select value={selLineId} onChange={(e) => setSelLineId(e.target.value)} className="input-farm">
              {lines.map((l) => <option key={l.id} value={l.id}>{l.label ?? `Line ${l.line_number}`}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Plant Type</label>
            <select value={selMasterId} onChange={(e) => setSelMasterId(e.target.value)} className="input-farm">
              {masters.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="Position #"
              className="input-farm flex-1 py-2.5 text-base"
            />
            <input
              type="number"
              value={plantationYear}
              onChange={(e) => setPlantationYear(e.target.value)}
              placeholder="Year (e.g. 2024)"
              className="input-farm flex-1 py-2.5 text-base"
            />
            <button
              onClick={handleAdd}
              disabled={saving}
              className="h-[52px] px-4 bg-green-600 text-white rounded-xl font-bold flex items-center gap-1 disabled:opacity-50"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Submit
            </button>
          </div>
        </div>

        {/* Plants list */}
        <div className="space-y-2">
          {plants.map((p) => (
            <div key={p.id} className="card flex items-center justify-between">
              <div>
                <p className="font-bold">#{p.position} — {masters.find((m) => m.id === p.plant_master_id)?.name ?? p.label}</p>
                <p className="text-xs text-gray-400">{p.id.slice(0, 8)}…</p>
              </div>
              <button
                onClick={async () => {
                  await db.plants.delete(p.id);
                  setPlants((prev) => prev.filter((pl) => pl.id !== p.id));
                }}
                className="w-10 h-10 flex items-center justify-center rounded-xl text-red-400"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {plants.length === 0 && (
            <p className="text-center text-gray-400 py-10">No plants in this line</p>
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
