"use client";

import React from "react";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import { ROUTE_ROLES } from "@/lib/auth/roles";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedLayout allowedRoles={ROUTE_ROLES.dashboard}>
      {children}
    </ProtectedLayout>
  );
}
