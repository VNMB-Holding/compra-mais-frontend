"use client";

import React, { createContext, useState, useCallback, useEffect } from "react";
import { User, AuthContextType, UserRole } from "@/types/auth";
import { saveSession, loadStoredSession, clearSession } from "@/lib/auth/session";
import { loginApi, getMeApi, getTenantsApi, logoutApi } from "@/lib/auth/api";
import { setTokenProvider } from "@/lib/api-client";

export const AuthContext = createContext<AuthContextType | null>(null);

function mapApiRole(roles: string[]): UserRole {
  if (!roles || roles.length === 0) return "solicitante";
  const normalized = roles.map((r) => r.toLowerCase().trim());
  if (normalized.some((r) => r === "admin" || r === "administrator" || r === "administrador")) {
    return "admin";
  }
  if (normalized.some((r) => r === "gerente" || r === "manager" || r === "diretor")) {
    return "gerente";
  }
  if (normalized.some((r) => r === "procurist" || r === "procurista" || r === "comprador")) {
    return "procurist";
  }
  return "solicitante";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Provide token dynamically to apiClient
  useEffect(() => {
    setTokenProvider(() => accessToken);
  }, [accessToken]);

  // Restauração da sessão no mount
  useEffect(() => {
    function restore() {
      try {
        const stored = loadStoredSession();
        if (stored) {
          setAccessToken(stored.accessToken);
          setRefreshToken(stored.refreshToken);
          setUser(stored.user);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
        clearSession();
      } finally {
        setIsLoading(false);
      }
    }
    restore();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // 1. Chama vnmb-identity diretamente
      const loginData = await loginApi(email, password);

      setTokenProvider(() => loginData.access_token);

      // 2. Busca os detalhes da identidade/roles na vnmb-identity
      let meRoles: string[] = ["Admin"];
      let meScopes: string[] = ["read", "write", "admin"];
      let tenantId: string | undefined = undefined;

      try {
        const meData = await getMeApi();
        if (meData.roles && meData.roles.length > 0) meRoles = meData.roles;
        if (meData.scopes && meData.scopes.length > 0) meScopes = meData.scopes;
        if (meData.tenant_id) tenantId = meData.tenant_id;
      } catch {
        // Fallback default roles
      }

      // 3. Busca a lista oficial de Tenants/Empresas cadastradas na API do vnmb-identity
      let availableTenants: { id: string; name: string; type?: "Matriz" | "Filial" }[] = [];
      try {
        const tenantsData = await getTenantsApi();
        if (tenantsData && tenantsData.length > 0) {
          availableTenants = tenantsData.map((t) => ({
            id: t.id,
            name: t.name,
            type: t.type,
          }));
        }
      } catch {
        // Se a API /api/tenants falhar ou precisar de permissão admin, fallback para tenant único
      }

      const role = mapApiRole(meRoles);

      const loggedInUser: User = {
        id: loginData.user.id,
        name: loginData.user.name,
        email: loginData.user.email,
        role,
        roles: meRoles,
        scopes: meScopes,
        tenantId,
        availableTenants: availableTenants.length > 0 ? availableTenants : undefined,
        accessToken: loginData.access_token,
        refreshToken: loginData.refresh_token,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(loginData.user.name)}`,
      };

      setAccessToken(loginData.access_token);
      setRefreshToken(loginData.refresh_token);
      setUser(loggedInUser);

      saveSession(loginData.access_token, loginData.refresh_token, loggedInUser);
      return loggedInUser;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    if (refreshToken) {
      logoutApi(refreshToken).catch(console.error);
    }
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    clearSession();
  }, [refreshToken]);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
