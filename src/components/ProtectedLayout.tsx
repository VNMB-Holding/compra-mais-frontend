"use client";

import React, { useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/types/auth";
import { Loading } from "@/components/ui";

interface ProtectedLayoutProps {
  children: ReactNode;
  allowedRoles: UserRole[];
}

export function ProtectedLayout({ children, allowedRoles }: ProtectedLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [canRender, setCanRender] = React.useState(false);

  useEffect(() => {
    // Espera o contexto carregar
    if (isLoading) return;

    if (!isAuthenticated) {
      console.log("Não autenticado, redirecionando para login");
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    if (!allowedRoles.includes(user!.role)) {
      console.log("Acesso negado para role:", user!.role);
      router.replace("/unauthorized");
      return;
    }

    // Se passou em todas as verificações, permite renderizar
    setCanRender(true);
  }, [isLoading, isAuthenticated, user, allowedRoles, router, pathname]);

  if (isLoading || !canRender) {
    return <Loading variant="fullscreen" message="Verificando acesso..." />;
  }

  return <>{children}</>;
}
