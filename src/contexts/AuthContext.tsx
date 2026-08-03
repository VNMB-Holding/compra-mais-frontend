"use client";

import React, { createContext, useState, useCallback, useEffect, useRef } from "react";
import { User, AuthContextType, UserRole } from "@/types/auth";
import { saveSession, loadStoredSession, clearSession } from "@/lib/auth/session";
import { loginApi, getTenantsApi, logoutApi } from "@/lib/auth/api";
import { setTokenProvider, setUnauthorizedHandler } from "@/lib/api-client";
import { logError } from "@/lib/utils/error";

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

  // Keep the token provider in sync so every api-client request gets a fresh token.
  useEffect(() => {
    setTokenProvider(() => accessToken);
  }, [accessToken]);

  // Use a ref to the logout function so the 401 handler never captures a stale closure.
  const logoutRef = useRef<() => void>(() => {});

  // Register a global 401 handler once on mount.
  // When any API request returns 401, we log the user out and redirect.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      logoutRef.current();
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.href = "/login?reason=session_expired";
      }
    });
  }, []);

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
      const loginData = await loginApi(email, password);

      setTokenProvider(() => loginData.access_token);

      let meRoles: string[] = ["Admin"];
      let meScopes: string[] = ["read", "write", "admin"];
      let tenantId: string | undefined = (loginData.user as any)?.tenantId || (loginData.user as any)?.tenant_id;

      let availableTenants: { id: string; name: string; type?: "Matriz" | "Filial" }[] = [];
      try {
        const tenantsData = await getTenantsApi();
        if (tenantsData && tenantsData.length > 0) {
          const currentTenant = tenantsData.find((t) => t.id === tenantId);
          const isVnmbAdmin = currentTenant
            ? currentTenant.name.toUpperCase().includes("VNMB")
            : loginData.user.email.toLowerCase().includes("vnmb");

          if (isVnmbAdmin) {
            availableTenants = tenantsData.map((t) => ({
              id: t.id,
              name: t.name,
              type: t.type,
            }));
          } else if (currentTenant) {
            availableTenants = [
              {
                id: currentTenant.id,
                name: currentTenant.name,
                type: currentTenant.type,
              },
            ];
          }
        }
      } catch {
      }

      const currentTenantObj = availableTenants.find((t) => t.id === tenantId);
      const tenantName = currentTenantObj?.name || (loginData.user as any)?.tenant_name || (loginData.user as any)?.tenantName;

      const role = mapApiRole(meRoles);

      const loggedInUser: User = {
        id: loginData.user.id,
        name: loginData.user.name,
        email: loginData.user.email,
        role,
        roles: meRoles,
        scopes: meScopes,
        tenantId,
        tenantName,
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
      logoutApi(refreshToken).catch((err) => logError("logout", err));
    }
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    clearSession();
  }, [refreshToken]);

  // Keep the ref in sync so the 401 handler always calls the latest logout.
  useEffect(() => {
    logoutRef.current = logout;
  }, [logout]);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
