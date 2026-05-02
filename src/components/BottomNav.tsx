"use client";

import { usePathname, useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store/useAppStore";
import { t } from "@/lib/i18n/translations";
import { Home, BarChart2, Settings, RefreshCw } from "lucide-react";
import clsx from "clsx";

const userTabs = [
  { href: "/dashboard", icon: Home, key: "nav.home" },
];

const adminTabs = [
  { href: "/dashboard", icon: Home, key: "nav.home" },
  { href: "/insights", icon: BarChart2, key: "nav.insights" },
  { href: "/admin", icon: Settings, key: "nav.admin" },
];

/**
 * BottomNav — fixed mobile tab bar.
 * Shows different tabs based on user role (admin vs user).
 */
export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, language } = useAppStore();

  const tabs = adminTabs;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-pb">
      <div className="flex">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");

          return (
            <button
              key={tab.href}
              onClick={() => router.push(tab.href)}
              className={clsx(
                "flex-1 flex flex-col items-center justify-center py-2 gap-0.5 min-h-[56px] transition-colors",
                isActive
                  ? "text-farm-green"
                  : "text-gray-400 active:text-gray-600"
              )}
            >
              <Icon
                className={clsx("w-6 h-6", isActive && "stroke-[2.5px]")}
              />
              <span className={clsx("text-xs", isActive && "font-semibold")}>
                {t(tab.key, language)}
              </span>
              {isActive && (
                <span className="absolute bottom-0 block w-8 h-0.5 bg-farm-green rounded-t-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
