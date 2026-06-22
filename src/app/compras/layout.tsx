"use client";

import React from "react";
import { ProtectedLayout } from "@/components/ProtectedLayout";

export default function ComprasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedLayout allowedRoles={["procurist", "gerente", "admin"]}>
      {children}
    </ProtectedLayout>
  );
}
