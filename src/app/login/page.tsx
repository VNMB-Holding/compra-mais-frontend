"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import styles from "./login.module.css";

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await login(email, password);
      // Redirecionamento inteligente:
      // 1) usa ?redirect= se fornecido
      // 2) se usuário for solicitante, abre o formulário rápido
      // 3) senão, abre o dashboard
      const params = Object.fromEntries(new URLSearchParams(window.location.search));
      const requested = params.redirect;

      if (requested) {
        router.push(requested);
        return;
      }

      // Usa o usuário do contexto, que é atualizado pelo `login`
      if (user && user.role === "solicitante") {
        router.push("/solicitacoes-rapidas/nova");
        return;
      }

      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao fazer login");
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.loginHeader}>
          <img src="/images/carrinho-logo.png" alt="Compra+" className={styles.logo} />
          <h1>Compra+</h1>
          <p>Plataforma inteligente para compras estratégicas</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.loginForm}>
          {error && <div className={styles.errorMessage}>{error}</div>}

          <div className={styles.formGroup}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className={styles.formControl}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu.email@empresa.com"
              disabled={isLoading}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              className={styles.formControl}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Sua senha"
              disabled={isLoading}
              required
            />
          </div>

          <button type="submit" className={styles.submitBtn} disabled={isLoading}>
            {isLoading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <div className={styles.credentialsHint}>
          <p><strong>Contas de teste:</strong></p>
          <ul>
            <li><strong>Procurista:</strong> procurista@compra.com / 123456</li>
            <li><strong>Solicitante:</strong> joao@fazenda.com / 123456</li>
            <li><strong>Gerente:</strong> gerente@compra.com / 123456</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
