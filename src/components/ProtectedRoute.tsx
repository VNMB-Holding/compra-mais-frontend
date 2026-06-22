"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/types/auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ children, allowedRoles, fallback }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Aguarda o contexto carregar a sessão do localStorage
    const checkAuth = async () => {
      // Aguarda um ciclo para que o contexto hydrate
      await new Promise(resolve => setTimeout(resolve, 100));
      setIsChecking(false);
    };

    checkAuth();
  }, []);

  useEffect(() => {
    if (isChecking || isLoading) return;

    // Se não está autenticado, redireciona para login
    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    // Se há roles permitidas e o usuário não tem nenhuma delas
    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user!.role)) {
      router.push("/unauthorized");
    }
  }, [isAuthenticated, isLoading, isChecking, user, allowedRoles, router, pathname]);

  // Enquanto está verificando autenticação, mostra loading
  if (isChecking || isLoading) {
    return (
      fallback || (
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
      )
    );
  }

  // Se não está autenticado ou não tem permissão, não renderiza nada
  if (!isAuthenticated || (allowedRoles && !allowedRoles.includes(user?.role!))) {
    return null;
  }

  return <>{children}</>;
}
