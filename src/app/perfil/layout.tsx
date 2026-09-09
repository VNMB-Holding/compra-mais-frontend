"use client";

import React from "react";
import { ProtectedLayout } from "@/components/layout";

export default function PerfilLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedLayout>
      {children}
    </ProtectedLayout>
  );
}
