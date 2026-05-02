"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store/useAppStore";
import type { UserRole } from "@/lib/types";

export function RoleGuard({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}) {
  const { profile } = useAppStore();
  const router = useRouter();

  useEffect(() => {
    // If not logged in, they belong on the login page
    if (!profile) {
      router.replace("/login");
      return;
    }

    // User exists, allow them through
    return;
  }, [profile, router, allowedRoles]);

  // Optionally, show nothing or a loader while deciding
  // Only block if no profile exists at all
  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-dvh bg-gray-50">
        <div className="w-8 h-8 border-4 border-farm-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
