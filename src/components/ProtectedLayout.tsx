"use client";

import React, { useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Loading } from "@/components/ui";

interface ProtectedLayoutProps {
  children: ReactNode;
  allowedRoles?: string[];
  requiredScopes?: string[];
}

export function ProtectedLayout({ children, allowedRoles, requiredScopes }: ProtectedLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [canRender, setCanRender] = React.useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || !user) {
      console.log("Não autenticado, redirecionando para login");
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    console.log("ProtectedLayout context check:", {
      userRole: user.role,
      userRoles: user.roles,
      userScopes: user.scopes,
      allowedRoles,
      requiredScopes,
      pathname,
    });

    let isAuthorized = true;

    if ((allowedRoles && allowedRoles.length > 0) || (requiredScopes && requiredScopes.length > 0)) {
      let hasRole = false;
      let hasScope = false;

      if (allowedRoles && allowedRoles.length > 0) {
        const lowerAllowed = allowedRoles.map(r => r.toLowerCase().trim());
        hasRole = lowerAllowed.includes(user.role.toLowerCase()) || 
                  (!!user.roles && user.roles.some(r => lowerAllowed.includes(r.toLowerCase().trim())));
      }

      if (requiredScopes && requiredScopes.length > 0) {
        hasScope = !!user.scopes && user.scopes.some(s => requiredScopes.includes(s));
      }

      isAuthorized = hasRole || hasScope;
    }

    if (!isAuthorized) {
      console.log("Acesso negado para usuário:", user.email);
      router.replace("/unauthorized");
      return;
    }

    setCanRender(true);
  }, [isLoading, isAuthenticated, user, allowedRoles, requiredScopes, router, pathname]);

  if (isLoading || !canRender) {
    return <Loading variant="fullscreen" message="Verificando acesso..." />;
  }

  return <>{children}</>;
}
