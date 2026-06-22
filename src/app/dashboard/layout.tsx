"use client";

import React from "react";
import { ProtectedLayout } from "@/components/ProtectedLayout";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedLayout allowedRoles={["procurist", "gerente", "admin", "solicitante"]}>
      {children}
    </ProtectedLayout>
  );
}
