"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { db } from "@/lib/db/dexie";
import type { Partition } from "@/lib/types";
import { ArrowLeft, Plus, Trash2, RefreshCw, Activity } from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";

/**
 * Admin — Partition Management (CRUD).
 */
export default function AdminPartitionsPage() {
  const router = useRouter();
  const { profile } = useAppStore();
  const isDemoMode = process.env.NEXT_PUBLIC_AUTH_MODE === "demo";

  const [partitions, setPartitions] = useState<Partition[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const local = await db.partitions.toArray();
      if (local.length > 0) {
        setPartitions(local.sort((a, b) => a.name.localeCompare(b.name)));
      } else {
        const res = await fetch("/api/partitions");
        if (res.ok) {
          const { data } = await res.json();
          await db.partitions.bulkPut(data);
          setPartitions(data);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const id = crypto.randomUUID();
      const partition: Partition = {
        id,
        name: newName.trim().toUpperCase(),
        created_at: new Date().toISOString(),
      };
      await db.partitions.put(partition);

      if (!isDemoMode) {
        await fetch("/api/partitions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(partition),
        });
      }

      setPartitions((prev) => [...prev, partition].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName("");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await db.partitions.delete(id);
    setPartitions((prev) => prev.filter((p) => p.id !== id));
    if (!isDemoMode) {
      await fetch(`/api/partitions?id=${id}`, { method: "DELETE" });
    }
  };

  return (
    <div className="flex flex-col min-h-dvh bg-gray-50 pb-20">
      <header className="bg-farm-gradient px-4 pt-4 pb-5">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-green-200 text-sm mb-3">
          <ArrowLeft className="w-4 h-4" /> Admin
        </button>
        <h1 className="text-white text-2xl font-bold">Partitions</h1>
      </header>

      <main className="flex-1 px-4 py-5 space-y-4">
        {/* Add form */}
        <div className="card flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="e.g. P5"
            className="input-farm flex-1 text-base py-2.5"
          />
          <button
            onClick={handleAdd}
            disabled={saving || !newName.trim()}
            className="h-[52px] px-4 bg-farm-green text-white rounded-xl font-bold flex items-center gap-1 disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add
          </button>
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {partitions.map((p) => (
              <div key={p.id} className="card flex items-center justify-between">
                <div>
                  <p className="font-bold text-xl text-gray-900">{p.name}</p>
                  <p className="text-xs text-gray-400">ID: {p.id.slice(0, 8)}…</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => router.push(`/admin/updates?partitionId=${p.id}`)}
                    className="w-10 h-10 flex items-center justify-center rounded-xl text-blue-500 hover:bg-blue-50 active:scale-90"
                    title="View Updates"
                  >
                    <Activity className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="w-10 h-10 flex items-center justify-center rounded-xl text-red-400 hover:bg-red-50 active:scale-90"
                    title="Delete Partition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {partitions.length === 0 && (
              <p className="text-center text-gray-400 py-10">No partitions yet</p>
            )}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
