"use client";

import React, { useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/types/auth";

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
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#f8fafc'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #e2e8f0',
            borderTop: '4px solid #667eea',
            borderRadius: '50%',
            margin: '0 auto 16px',
            animation: 'spin 0.8s linear infinite'
          }} />
          <p style={{ color: '#64748b', margin: 0 }}>Carregando...</p>
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
