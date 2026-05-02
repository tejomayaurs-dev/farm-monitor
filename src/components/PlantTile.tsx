"use client";

import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store/useAppStore";
import { t } from "@/lib/i18n/translations";
import type { Plant, PlantStatus } from "@/lib/types";
import clsx from "clsx";

interface PlantTileProps {
  plant: Plant;
  partitionId: string;
  lineId: string;
}

/** Maps plant status to Tailwind background + text colors */
export const STATUS_STYLES: Record<
  PlantStatus | "unknown",
  { bg: string; text: string; border: string; dot: string; label: string }
> = {
  good: {
    bg: "bg-green-50",
    text: "text-green-800",
    border: "border-green-300",
    dot: "bg-green-500",
    label: "Good",
  },
  medium: {
    bg: "bg-yellow-50",
    text: "text-yellow-800",
    border: "border-yellow-300",
    dot: "bg-yellow-500",
    label: "Medium",
  },
  replace: {
    bg: "bg-red-50",
    text: "text-red-800",
    border: "border-red-300",
    dot: "bg-red-500",
    label: "Replace",
  },
  no_growth: {
    bg: "bg-gray-50",
    text: "text-gray-700",
    border: "border-gray-300",
    dot: "bg-gray-400",
    label: "No Growth",
  },
  pest_attack: {
    bg: "bg-orange-50",
    text: "text-orange-800",
    border: "border-orange-300",
    dot: "bg-orange-500",
    label: "Pest",
  },
  unknown: {
    bg: "bg-white",
    text: "text-gray-500",
    border: "border-gray-200",
    dot: "bg-gray-300",
    label: "—",
  },
};

/**
 * PlantTile — color-coded plant status card in the plant grid.
 * Tapping navigates to the plant action screen.
 */
export function PlantTile({ plant, partitionId, lineId }: PlantTileProps) {
  const router = useRouter();
  const { recentPlantStatuses, language } = useAppStore();

  // Prefer optimistic local status over remote
  const rawStatus =
    recentPlantStatuses[plant.id] ?? plant.latest_status ?? "unknown";
  const status = rawStatus as PlantStatus | "unknown";
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.unknown;

  return (
    <button
      onClick={() =>
        router.push(`/dashboard/${partitionId}/${lineId}/${plant.id}`)
      }
      className={clsx(
        "relative flex flex-col items-center justify-center rounded-2xl border-2 p-3 gap-1",
        "min-h-[90px] w-full transition-all active:scale-95 shadow-sm",
        style.bg,
        style.border
      )}
    >
      {/* Status dot */}
      <span
        className={clsx(
          "absolute top-2 right-2 w-2.5 h-2.5 rounded-full",
          style.dot
        )}
      />

      {/* Plant position number */}
      <span className={clsx("text-2xl font-bold", style.text)}>
        {plant.position}
      </span>

      {/* Plant name */}
      <span className={clsx("text-xs text-center leading-tight", style.text)}>
        {plant.plant_name ?? plant.label ?? `Plant ${plant.position}`}
      </span>

      {/* Status label */}
      <span
        className={clsx(
          "text-[10px] font-semibold uppercase tracking-wide",
          style.text,
          "opacity-75"
        )}
      >
        {style.label}
      </span>
    </button>
  );
}
