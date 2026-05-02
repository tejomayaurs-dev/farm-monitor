"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store/useAppStore";

/**
 * Root entry point — checks auth and redirects appropriately.
 * Demo mode: auto-redirects to /dashboard.
 */
export default function HomePage() {
  const router = useRouter();
  const { profile } = useAppStore();

  useEffect(() => {
    const isDemoMode = process.env.NEXT_PUBLIC_AUTH_MODE === "demo";

    if (isDemoMode) {
      // Auto-inject demo profile if not set
      if (!profile) {
        useAppStore.getState().setProfile({
          id: "demo-user",
          role: "admin",
          full_name: "Demo Admin",
        });
      }
      router.replace("/dashboard");
    } else if (profile) {
      router.replace("/dashboard");
    } else {
      router.replace("/login");
    }
  }, []);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-farm-gradient">
      <div className="flex flex-col items-center gap-4">
        {/* Leaf logo */}
        <div className="text-6xl">🌿</div>
        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );
}
