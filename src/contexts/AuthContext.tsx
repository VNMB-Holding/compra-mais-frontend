"use client";

import React, { createContext, useState, useCallback, useEffect } from "react";
import { User, AuthContextType, UserRole } from "@/types/auth";
import { markSessionActive, clearSession } from "@/lib/auth/session";
import { loginApi, getMeApi, logoutApi } from "@/lib/auth/api";

export const AuthContext = createContext<AuthContextType | null>(null);

function mapApiRole(roles: string[]): UserRole {
  if (!roles) return "solicitante";
  const normalized = roles.map(r => r.toLowerCase().trim());
  if (normalized.some(r => r === "admin" || r === "administrator" || r === "administrador")) {
    return "admin";
  }
  if (normalized.some(r => r === "gerente" || r === "manager" || r === "diretor")) {
    return "gerente";
  }
  if (normalized.some(r => r === "procurist" || r === "procurista" || r === "comprador")) {
    return "procurist";
  }
  return "solicitante";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount, validate session by calling the BFF's /api/auth/me
  useEffect(() => {
    async function checkAuth() {
      try {
        const data = await getMeApi();
        if (data?.user) {
          const u = data.user;
          const role = mapApiRole(u.roles || []);
          setUser({
            id: u.id,
            name: u.name,
            email: u.email,
            role,
            roles: u.roles,
            scopes: u.scopes,
            tenantId: u.tenantId,
            tenantName: u.tenantName,
            availableTenants: u.availableTenants,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}`,
          });
        } else {
          setUser(null);
        }
      } catch {
        // No active session — user is not logged in
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    checkAuth();
  }, []);

  const login = useCallback(async (email: string, password: string, rememberMe?: boolean) => {
    setIsLoading(true);
    try {
      const loginData = await loginApi(email, password, rememberMe);
      const role = mapApiRole(loginData.user.roles || []);

      const loggedInUser: User = {
        id: loginData.user.id,
        name: loginData.user.name,
        email: loginData.user.email,
        role,
        roles: loginData.user.roles,
        scopes: loginData.user.scopes,
        tenantId: loginData.user.tenantId,
        tenantName: loginData.user.tenantName,
        availableTenants: loginData.user.availableTenants,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(loginData.user.name)}`,
      };

      setUser(loggedInUser);
      markSessionActive();
      return loggedInUser;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    logoutApi().catch(console.error);
    setUser(null);
    clearSession();
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
