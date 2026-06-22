"use client";

import React from "react";
import { ProtectedLayout } from "@/components/ProtectedLayout";

export default function SolicitacoesRapidasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedLayout allowedRoles={["solicitante"]}>
      {children}
    </ProtectedLayout>
  );
}
