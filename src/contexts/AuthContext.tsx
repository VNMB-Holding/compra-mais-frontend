"use client";

import React, { createContext, useState, useCallback, useEffect } from "react";
import { User, AuthContextType, UserRole } from "@/types/auth";

export const AuthContext = createContext<AuthContextType | null>(null);

// Mock dados de usuários para simulação
const MOCK_USERS: Record<string, { password: string; user: User }> = {
  "procurista@compra.com": {
    password: "123456",
    user: {
      id: "1",
      name: "Maria Silva",
      email: "procurista@compra.com",
      role: "procurist",
      department: "Compras",
      avatar: "https://ui-avatars.com/api/?name=Maria+Silva",
    },
  },
  "joao@fazenda.com": {
    password: "123456",
    user: {
      id: "2",
      name: "João da Fazenda",
      email: "joao@fazenda.com",
      role: "solicitante",
      department: "Fazenda",
      avatar: "https://ui-avatars.com/api/?name=Joao+Fazenda",
    },
  },
  "gerente@compra.com": {
    password: "123456",
    user: {
      id: "3",
      name: "Carlos Gerente",
      email: "gerente@compra.com",
      role: "gerente",
      department: "Aprovações",
      avatar: "https://ui-avatars.com/api/?name=Carlos+Gerente",
    },
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Simula verificação de sessão ao montar
  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error("Erro ao restaurar sessão:", error);
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Simula delay de autenticação
      await new Promise((resolve) => setTimeout(resolve, 800));

      const userCredentials = MOCK_USERS[email];

      if (!userCredentials || userCredentials.password !== password) {
        throw new Error("Email ou senha inválidos");
      }

      const loggedInUser = userCredentials.user;
      setUser(loggedInUser);
      localStorage.setItem("currentUser", JSON.stringify(loggedInUser));
      
      // Salva em cookie para que o middleware possa verificar
      document.cookie = `currentUser=${JSON.stringify(loggedInUser)}; path=/; max-age=86400`;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("currentUser");
    // Limpa o cookie
    document.cookie = "currentUser=; path=/; max-age=0";
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
