"use client";

import React from "react";
import { ProtectedLayout } from "@/components/layout";
import { ROUTE_ROLES } from "@/lib/auth/roles";

export default function AdministracaoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedLayout allowedRoles={["admin"]}>
      {children}
    </ProtectedLayout>
  );
}
