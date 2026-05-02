"use client";

import { RoleGuard } from "@/components/RoleGuard";

export default function InsightsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={["admin"]}>
      {children}
    </RoleGuard>
  );
}
