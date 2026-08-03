"use client";

import React, { createContext, useState, useCallback, useEffect, useRef } from "react";
import { User, AuthContextType, UserRole } from "@/types/auth";
import { saveSession, loadStoredSession, clearSession } from "@/lib/auth/session";
import { loginApi, getTenantsApi, getUserByIdApi, logoutApi } from "@/lib/auth/api";
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

  useEffect(() => {
    setTokenProvider(() => accessToken);
  }, [accessToken]);

  const logoutRef = useRef<() => void>(() => {});

  useEffect(() => {
    setUnauthorizedHandler(() => {
      logoutRef.current();
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.href = "/login?reason=session_expired";
      }
    });
  }, []);

  useEffect(() => {
    async function restore() {
      try {
        const stored = loadStoredSession();
        if (stored) {
          setAccessToken(stored.accessToken);
          setRefreshToken(stored.refreshToken);
          setTokenProvider(() => stored.accessToken);

          let updatedUser = stored.user;

          try {
            let tenantId = updatedUser.tenantId;
            let meRoles = updatedUser.roles || [];
            let meScopes = updatedUser.scopes || [];

            if (updatedUser.id) {
              const userData = await getUserByIdApi(updatedUser.id).catch(() => null);
              if (userData && userData.tenant_id) {
                tenantId = userData.tenant_id;
              }
            }

            let availableTenants = updatedUser.availableTenants || [];
            if (!availableTenants || availableTenants.length === 0) {
              const tenantsData = await getTenantsApi().catch(() => []);
              if (tenantsData && tenantsData.length > 0) {
                availableTenants = tenantsData.map((t) => ({
                  id: t.id,
                  name: t.name,
                  type: t.type,
                }));
              }
            }

            let tenantName = updatedUser.tenantName;
            let currentTenantObj = availableTenants.find((t: any) => t.id === tenantId);

            const isVnmb = updatedUser.email?.toLowerCase().includes("vnmb");
            if (!currentTenantObj && isVnmb && availableTenants.length > 0) {
              currentTenantObj = availableTenants.find((t: any) => t.name.toUpperCase().includes("VNMB")) || availableTenants[0];
              if (currentTenantObj) tenantId = currentTenantObj.id;
            } else if (!currentTenantObj && availableTenants.length > 0) {
              currentTenantObj = availableTenants[0];
              tenantId = currentTenantObj.id;
            }

            if (currentTenantObj) {
              tenantName = currentTenantObj.name;
            }

            const enrichedUser: User = {
              ...updatedUser,
              tenantId: tenantId || updatedUser.tenantId,
              tenantName: tenantName || updatedUser.tenantName,
              availableTenants: availableTenants.length > 0 ? availableTenants : updatedUser.availableTenants,
              roles: meRoles.length > 0 ? meRoles : updatedUser.roles,
              scopes: meScopes.length > 0 ? meScopes : updatedUser.scopes,
            };

            updatedUser = enrichedUser;
            saveSession(stored.accessToken, stored.refreshToken, enrichedUser);
          } catch (e) {
            logError("AuthContext/restoreEnrichment", e);
          }

          setUser(updatedUser);
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
      const backendUser = loginData.user || {};

      const token = loginData.access_token;
      setTokenProvider(() => token);

      let meRoles: string[] = backendUser.roles || [];
      let meScopes: string[] = backendUser.scopes || [];
      let tenantId: string | undefined = backendUser.tenant_id;
      const userId = backendUser.id;

      if (userId) {
        try {
          const userData = await getUserByIdApi(userId);
          if (userData && userData.tenant_id) {
            tenantId = userData.tenant_id;
          }
        } catch (err) {
          logError("AuthContext/getUserByIdApi", err);
        }
      }

      if (!meRoles || meRoles.length === 0) meRoles = ["Admin"];
      if (!meScopes || meScopes.length === 0) meScopes = ["read", "write", "admin"];

      let tenantName: string | undefined = backendUser.tenant_name;
      let availableTenants = (backendUser as { availableTenants?: { id: string; name: string; type?: "Matriz" | "Filial" }[] }).availableTenants || [];

      if (!availableTenants || availableTenants.length === 0) {
        try {
          const tenantsData = await getTenantsApi();
          if (tenantsData && tenantsData.length > 0) {
            availableTenants = tenantsData.map((t) => ({
              id: t.id,
              name: t.name,
              type: t.type,
            }));
          }
        } catch {}
      }

      let currentTenantObj = availableTenants.find((t) => t.id === tenantId);
      const isVnmb = (email || "").toLowerCase().includes("vnmb");

      if (!currentTenantObj && isVnmb && availableTenants.length > 0) {
        currentTenantObj = availableTenants.find((t: any) => t.name.toUpperCase().includes("VNMB")) || availableTenants[0];
        if (currentTenantObj) tenantId = currentTenantObj.id;
      } else if (!currentTenantObj && availableTenants.length > 0) {
        currentTenantObj = availableTenants[0];
        tenantId = currentTenantObj.id;
      }

      if (currentTenantObj) {
        tenantName = currentTenantObj.name;
      }

      const role = mapApiRole(meRoles);

      const loggedInUser: User = {
        id: backendUser.id || loginData.user?.id,
        name: backendUser.name || loginData.user?.name,
        email: backendUser.email || loginData.user?.email,
        role,
        roles: meRoles,
        scopes: meScopes,
        tenantId,
        tenantName,
        availableTenants: availableTenants.length > 0 ? availableTenants : undefined,
        accessToken: token,
        refreshToken: loginData.refresh_token,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(backendUser.name || "User")}`,
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
