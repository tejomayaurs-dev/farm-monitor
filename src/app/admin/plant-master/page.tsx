"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { db } from "@/lib/db/dexie";
import type { PlantMaster } from "@/lib/types";
import { ArrowLeft, Plus, Trash2, RefreshCw } from "lucide-react";
import { enqueuePlantMaster } from "@/lib/sync/syncEngine";

/**
 * Admin — Plant Master list (reusable plant name catalogue).
 */
export default function AdminPlantMasterPage() {
  const router = useRouter();
  const isDemoMode = process.env.NEXT_PUBLIC_AUTH_MODE === "demo";

  const [masters, setMasters] = useState<PlantMaster[]>([]);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    db.plant_master.toArray().then((m) => {
      if (m.length === 0 && isDemoMode) {
        const demo: PlantMaster[] = ["Tomato", "Pepper", "Basil", "Lettuce", "Cucumber"].map(
          (name) => ({ id: crypto.randomUUID(), name, created_at: new Date().toISOString() })
        );
        db.plant_master.bulkPut(demo).then(() => setMasters(demo));
      } else {
        setMasters(m.sort((a, b) => a.name.localeCompare(b.name)));
      }
    });
  }, []);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    const item: PlantMaster = {
      id: crypto.randomUUID(),
      name: newName.trim(),
      created_at: new Date().toISOString(),
    };
    await db.plant_master.put(item);
    if (!isDemoMode) {
      await enqueuePlantMaster(item);
    }
    setMasters((prev) => [...prev, item].sort((a, b) => a.name.localeCompare(b.name)));
    setNewName("");
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    await db.plant_master.delete(id);
    setMasters((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <div className="flex flex-col min-h-dvh bg-gray-50 pb-20">
      <header className="bg-farm-gradient px-4 pt-4 pb-5">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-green-200 text-sm mb-3">
          <ArrowLeft className="w-4 h-4" /> Admin
        </button>
        <h1 className="text-white text-2xl font-bold">Plant Names</h1>
      </header>

      <main className="flex-1 px-4 py-5 space-y-4">
        <div className="card flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="e.g. Broccoli"
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

        <div className="space-y-2">
          {masters.map((m) => (
            <div key={m.id} className="card flex items-center justify-between">
              <p className="font-bold text-lg">{m.name}</p>
              <button
                onClick={() => handleDelete(m.id)}
                className="w-10 h-10 flex items-center justify-center rounded-xl text-red-400 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
