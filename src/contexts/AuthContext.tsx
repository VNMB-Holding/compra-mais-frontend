"use client";

import React, { createContext, useState, useCallback, useEffect } from "react";
import { User, AuthContextType, UserRole } from "@/types/auth";
import { saveSession, loadSession, clearSession } from "@/lib/auth/session";
import { loginApi, getMeApi, logoutApi } from "@/lib/auth/api";

export const AuthContext = createContext<AuthContextType | null>(null);

function mapApiRole(roles: string[]): UserRole {
  if (roles.includes("admin")) return "admin";
  if (roles.includes("gerente")) return "gerente";
  if (roles.includes("procurist") || roles.includes("procurista")) return "procurist";
  return "solicitante";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setUser(loadSession());
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const loginData = await loginApi(email, password);
      const meData = await getMeApi(loginData.access_token);
      
      const role = mapApiRole(meData.roles);
      
      const loggedInUser: User = {
        id: loginData.user.id,
        name: loginData.user.name,
        email: loginData.user.email,
        role,
        tenantId: meData.tenant_id,
        accessToken: loginData.access_token,
        refreshToken: loginData.refresh_token,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(loginData.user.name)}`,
      };

      setUser(loggedInUser);
      saveSession(loggedInUser);
      return loggedInUser;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    if (user?.refreshToken && user?.accessToken) {
      logoutApi(user.refreshToken, user.accessToken).catch(console.error);
    }
    setUser(null);
    clearSession();
  }, [user]);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

