"use client";

import React, { createContext, useState, useCallback, useEffect } from "react";
import { User, AuthContextType, UserRole } from "@/types/auth";
import { saveSession, loadSession, clearSession } from "@/lib/auth/session";
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

  useEffect(() => {
    async function checkAuth() {
      try {
        const meData = await getMeApi();
        console.log("BFF checkAuth (me) response:", meData);
        const role = mapApiRole(meData.user.roles || []);
        console.log("Mapped role for checkAuth:", role);
        const loggedInUser: User = {
          id: meData.user.id,
          name: meData.user.name,
          email: meData.user.email,
          role,
          roles: meData.user.roles,
          scopes: meData.user.scopes,
          tenantId: meData.user.tenantId,
          tenantName: meData.user.tenantName,
          availableTenants: meData.user.availableTenants,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(meData.user.name)}`,
        };
        setUser(loggedInUser);
        saveSession(loggedInUser);
      } catch (err) {
        console.error("BFF checkAuth error:", err);
        setUser(null);
        clearSession();
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
      console.log("BFF login response:", loginData);
      const role = mapApiRole(loginData.user.roles || []);
      console.log("Mapped role for login:", role);
      
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
      saveSession(loggedInUser);
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

