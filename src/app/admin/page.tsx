"use client";

import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store/useAppStore";
import { BottomNav } from "@/components/BottomNav";
import { t } from "@/lib/i18n/translations";
import {
  Map,
  Rows3,
  Sprout,
  BookOpen,
   ChevronRight,
  Settings,
  BarChart,
} from "lucide-react";
import clsx from "clsx";
import { useEffect } from "react";

const ADMIN_ITEMS = [
  {
    href: "/admin/partitions",
    icon: Map,
    label: "admin.partitions",
    sublabel: "Manage farm areas (P1, P2, P3…)",
    color: "bg-green-50 text-green-700",
  },
  {
    href: "/admin/lines",
    icon: Rows3,
    label: "admin.lines",
    sublabel: "Add rows under each partition",
    color: "bg-blue-50 text-blue-700",
  },
  {
    href: "/admin/plant-master",
    icon: BookOpen,
    label: "admin.plant_master",
    sublabel: "Manage plant name catalogue",
    color: "bg-amber-50 text-amber-700",
  },
  {
    href: "/admin/plants",
    icon: Sprout,
    label: "admin.plants",
    sublabel: "Place plants under lines",
    color: "bg-emerald-50 text-emerald-700",
  },
  {
    href: "/admin/reports",
    icon: BarChart,
    label: "admin.reports",
    sublabel: "Farm analytics and plant counts",
    color: "bg-purple-50 text-purple-700",
  },
];

/**
 * Admin dashboard — grid of management sections.
 * Only accessible to users with role === "admin".
 */
export default function AdminPage() {
  const router = useRouter();
  const { profile, language } = useAppStore();

  // Role guard removed per user request to show admin features to all authenticated users
  // useEffect(() => { ... }, [profile]);
  // if (profile?.role !== "admin") return null;

  return (
    <div className="flex flex-col min-h-dvh bg-gray-50 pb-20">
      <header className="bg-farm-gradient px-4 pt-8 pb-6">
        <div className="flex items-center gap-2 mb-1">
          <Settings className="w-5 h-5 text-green-200" />
          <span className="text-green-200 text-sm font-medium">Admin Panel</span>
        </div>
        <h1 className="text-white text-2xl font-bold">Farm Setup</h1>
      </header>

      <main className="flex-1 px-4 py-5 space-y-3">
        {ADMIN_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className="w-full flex items-center gap-4 bg-white rounded-2xl px-4 py-4 shadow-sm active:scale-98 transition-transform border border-gray-100"
            >
              <div
                className={clsx(
                  "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                  item.color
                )}
              >
                <Icon className="w-6 h-6" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-bold text-gray-900">
                  {t(item.label, language)}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{item.sublabel}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0" />
            </button>
          );
        })}
      </main>

      <BottomNav />
    </div>
  );
}
