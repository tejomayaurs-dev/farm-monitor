"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store/useAppStore";
import { db } from "@/lib/db/dexie";
import { enqueueStatusLog, enqueueActivity } from "@/lib/sync/syncEngine";
import { t } from "@/lib/i18n/translations";
import { BottomNav } from "@/components/BottomNav";
import { STATUS_STYLES } from "@/components/PlantTile";
import type { Plant, PlantStatus, ActivityType } from "@/lib/types";
import {
  ArrowLeft,
  CheckCircle2,
  Leaf,
  Scissors,
  ShoppingBasket,
  Droplets,
  Mic,
  MicOff,
} from "lucide-react";
import clsx from "clsx";

// =============================================
// STATUS OPTIONS
// =============================================
const STATUS_OPTIONS: {
  value: PlantStatus;
  label: string;
  labelKn: string;
  emoji: string;
  colorClass: string;
}[] = [
  { value: "good", label: "Good", labelKn: "ಉತ್ತಮ", emoji: "✅", colorClass: "bg-green-50 border-green-400 text-green-800" },
  { value: "medium", label: "Medium", labelKn: "ಮಧ್ಯಮ", emoji: "⚠️", colorClass: "bg-yellow-50 border-yellow-400 text-yellow-800" },
  { value: "no_growth", label: "No Growth", labelKn: "ಬೆಳವಣಿಗೆ ಇಲ್ಲ", emoji: "⏸️", colorClass: "bg-gray-50 border-gray-400 text-gray-700" },
  { value: "replace", label: "Replace", labelKn: "ಬದಲಾಯಿಸಿ", emoji: "❌", colorClass: "bg-red-50 border-red-400 text-red-800" },
  { value: "pest_attack", label: "Pest Attack", labelKn: "ಕೀಟ ದಾಳಿ", emoji: "🐛", colorClass: "bg-orange-50 border-orange-400 text-orange-800" },
];

// =============================================
// ACTIVITY OPTIONS
// =============================================
const ACTIVITY_OPTIONS: {
  value: ActivityType;
  label: string;
  labelKn: string;
  icon: React.ReactNode;
  colorClass: string;
}[] = [
  { value: "input", label: "Input", labelKn: "ಒಳಸುರಿ", icon: <Leaf className="w-7 h-7" />, colorClass: "bg-green-50 border-green-300 text-green-700" },
  { value: "pruning", label: "Pruning", labelKn: "ಕತ್ತರಿಸುವಿಕೆ", icon: <Scissors className="w-7 h-7" />, colorClass: "bg-purple-50 border-purple-300 text-purple-700" },
  { value: "harvest", label: "Harvest", labelKn: "ಕೊಯ್ಲು", icon: <ShoppingBasket className="w-7 h-7" />, colorClass: "bg-amber-50 border-amber-300 text-amber-700" },
  { value: "water_check", label: "Water Check", labelKn: "ನೀರು ತಪಾಸಣೆ", icon: <Droplets className="w-7 h-7" />, colorClass: "bg-blue-50 border-blue-300 text-blue-700" },
];

/**
 * Plant Action Screen — one-tap status update and activity log.
 * All actions are queued offline-first via syncEngine.
 */
export default function PlantActionPage() {
  const params = useParams<{
    partitionId: string;
    lineId: string;
    plantId: string;
  }>();
  const router = useRouter();
  const { profile, language, setRecentPlantStatus, setPendingSyncCount } = useAppStore();
  const isDemoMode = process.env.NEXT_PUBLIC_AUTH_MODE === "demo";

  const [plant, setPlant] = useState<Plant | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<PlantStatus | null>(null);
  const [lastActivity, setLastActivity] = useState<ActivityType | null>(null);
  const [toast, setToast] = useState("");
  const [listening, setListening] = useState(false);

  useEffect(() => {
    loadPlant();
  }, [params.plantId]);

  const loadPlant = async () => {
    const local = await db.plants.get(params.plantId);
    if (local) {
      // Get latest local status
      const log = await db.plant_status_logs_local
        .where("plant_id")
        .equals(params.plantId)
        .reverse()
        .sortBy("timestamp")
        .then((logs) => logs[0]);
      setPlant({ ...local, latest_status: log?.status ?? local.latest_status });
      setSelectedStatus(log?.status ?? local.latest_status ?? null);
    } else if (isDemoMode) {
      // Create a minimal demo plant
      setPlant({
        id: params.plantId,
        line_id: params.lineId,
        plant_master_id: "pm1",
        position: parseInt(params.plantId.split("-").pop() ?? "1"),
        plant_name: "Tomato",
      });
    }
  };

  const handleStatusTap = async (status: PlantStatus) => {
    setSelectedStatus(status);
    const id = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    await enqueueStatusLog({
      id,
      plant_id: params.plantId,
      status,
      recorded_by: profile?.id,
      timestamp,
    });

    // Optimistic local update in Zustand (updates plant tile color instantly)
    setRecentPlantStatus(params.plantId, status);

    // Update pending count
    const count = await db.sync_queue.where("sync_status").equals("pending").count();
    setPendingSyncCount(count);

    showToast(`Status set to: ${STATUS_OPTIONS.find((s) => s.value === status)?.label}`);
  };

  const handleActivityTap = async (activity: ActivityType) => {
    setLastActivity(activity);
    const id = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    await enqueueActivity({
      id,
      plant_id: params.plantId,
      activity_type: activity,
      recorded_by: profile?.id,
      timestamp,
    });

    const count = await db.sync_queue.where("sync_status").equals("pending").count();
    setPendingSyncCount(count);

    showToast(`Logged: ${ACTIVITY_OPTIONS.find((a) => a.value === activity)?.label}`);
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  // =============================================
  // Voice Input (Web Speech API)
  // =============================================
  const handleVoiceInput = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      showToast("Voice not supported on this device");
      return;
    }

    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    const recognition = new SR();
    recognition.lang = language === "kn" ? "kn-IN" : "en-IN";
    recognition.interimResults = false;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onresult = (event: any) => {
      const transcript: string = event.results[0][0].transcript.toLowerCase();
      parseVoiceCommand(transcript);
    };
    recognition.onerror = () => setListening(false);
    recognition.start();
  };

  const parseVoiceCommand = (transcript: string) => {
    // Example: "pest attack" → sets status
    const statusMatch = STATUS_OPTIONS.find((s) =>
      transcript.includes(s.value.replace("_", " ")) || transcript.includes(s.label.toLowerCase())
    );
    if (statusMatch) {
      handleStatusTap(statusMatch.value);
      return;
    }

    // Example: "pruning" / "harvest" → logs activity
    const actMatch = ACTIVITY_OPTIONS.find((a) =>
      transcript.includes(a.value.replace("_", " ")) || transcript.includes(a.label.toLowerCase())
    );
    if (actMatch) {
      handleActivityTap(actMatch.value);
      return;
    }
    showToast(`Could not understand: "${transcript}"`);
  };

  const plantLabel = plant?.plant_name ?? plant?.label ?? `Plant ${plant?.position}`;
  const currentStyle = selectedStatus ? STATUS_STYLES[selectedStatus] : STATUS_STYLES.unknown;

  return (
    <div className="flex flex-col min-h-dvh bg-gray-50 pb-20">
      {/* Header */}
      <header
        className={clsx(
          "px-4 pt-4 pb-6 transition-colors duration-500",
          selectedStatus ? currentStyle.bg : "bg-farm-gradient"
        )}
      >
        <button
          onClick={() => router.back()}
          className={clsx(
            "flex items-center gap-1 text-sm mb-3",
            selectedStatus ? currentStyle.text : "text-green-200"
          )}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to plants
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h1
              className={clsx(
                "text-2xl font-bold",
                selectedStatus ? currentStyle.text : "text-white"
              )}
            >
              {plantLabel}
            </h1>
            <p
              className={clsx(
                "text-sm mt-0.5",
                selectedStatus ? "opacity-70 " + currentStyle.text : "text-green-200"
              )}
            >
              Position {plant?.position} · {t("misc.tap_to_log", language)}
            </p>
          </div>
          {/* Voice input button */}
          <button
            onClick={handleVoiceInput}
            className={clsx(
              "w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-90",
              listening
                ? "bg-red-500 text-white animate-pulse"
                : selectedStatus
                ? "bg-white/60 " + currentStyle.text
                : "bg-white/20 text-white"
            )}
          >
            {listening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 px-4 py-5 space-y-6">
        {/* ── A. Update Status ── */}
        <section className="card">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">
            {t("action.update_status", language)}
          </h2>
          <div className="grid grid-cols-1 gap-2">
            {STATUS_OPTIONS.map((opt) => {
              const isSelected = selectedStatus === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => handleStatusTap(opt.value)}
                  className={clsx(
                    "flex items-center gap-4 px-4 py-3.5 rounded-xl border-2 transition-all active:scale-98",
                    opt.colorClass,
                    isSelected ? "border-current shadow-md scale-[1.01]" : "border-transparent"
                  )}
                >
                  <span className="text-2xl">{opt.emoji}</span>
                  <span className="text-lg font-bold flex-1 text-left">
                    {language === "kn" ? opt.labelKn : opt.label}
                  </span>
                  {isSelected && (
                    <CheckCircle2 className="w-5 h-5 opacity-80 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* ── B. Add Activity ── */}
        <section className="card">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">
            {t("action.add_activity", language)}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {ACTIVITY_OPTIONS.map((opt) => {
              const isSelected = lastActivity === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => handleActivityTap(opt.value)}
                  className={clsx(
                    "flex flex-col items-center justify-center gap-2 py-4 px-2 rounded-xl border-2 transition-all active:scale-95 min-h-[100px]",
                    opt.colorClass,
                    isSelected ? "border-current shadow-md" : "border-transparent"
                  )}
                >
                  {opt.icon}
                  <span className="text-sm font-bold text-center leading-tight">
                    {language === "kn" ? opt.labelKn : opt.label}
                  </span>
                  {isSelected && <CheckCircle2 className="w-4 h-4 opacity-70" />}
                </button>
              );
            })}
          </div>
        </section>
      </main>

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-24 left-4 right-4 bg-gray-900 text-white text-sm font-medium px-4 py-3 rounded-2xl shadow-xl text-center animate-fade-in-up z-50">
          {toast}
        </div>
      )}

      <BottomNav />
    </div>
  );
}
