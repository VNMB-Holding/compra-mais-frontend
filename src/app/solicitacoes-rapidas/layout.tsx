"use client";

import React, { useEffect, useState } from "react";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import { useAuth } from "@/hooks/useAuth";
import { usePathname, useRouter } from "next/navigation";

export default function SolicitacoesRapidasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [canRender, setCanRender] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    // If user is a solicitante, only allow the "nova" page
    if (user?.role === "solicitante") {
      if (pathname === "/solicitacoes-rapidas/nova") {
        setCanRender(true);
      } else {
        router.replace("/unauthorized");
      }
      return;
    }

    // For other roles, delegate to ProtectedLayout with admin roles
    setCanRender(true);
  }, [isLoading, isAuthenticated, user, pathname, router]);

  if (isLoading || !canRender) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <p>Carregando...</p>
      </div>
    );
  }

  if (user?.role === "solicitante") {
    return <>{children}</>;
  }

  return (
    <ProtectedLayout allowedRoles={["procurist", "gerente", "admin"]}>
      {children}
    </ProtectedLayout>
  );
}
