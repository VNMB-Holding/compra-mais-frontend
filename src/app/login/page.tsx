"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Icon } from "@/components/ui";
import styles from "./login.module.css";

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const loggedInUser = await login(email, password);

      const params = Object.fromEntries(new URLSearchParams(window.location.search));
      const requested = params.redirect;

      if (loggedInUser.role === "solicitante") {
        router.push("/solicitacoes-rapidas/nova");
        return;
      }

      if (requested) {
        router.push(requested);
        return;
      }

      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao fazer login");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.left} />

      <div className={styles.right}>
        <div className={styles.logoWrapper}>
          <img src="/images/logo-compra-mais.svg" alt="Compra+" className={styles.logoImg} />
        </div>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Bem-vindo de volta!</h2>
          <p className={styles.cardSub}>Faça login para acessar sua conta.</p>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label>E-mail</label>
              <div className={styles.inputWrapper}>
                <Icon name="mail-01" size={20} className={styles.inputIcon} />
                <input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <div className={styles.field}>
              <label>Senha</label>
              <div className={styles.inputWrapper}>
                <Icon name="lock-01" size={20} className={styles.inputIcon} />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <Icon name={showPassword ? "eye-off" : "eye"} size={20} />
                </button>
              </div>
              {error && <div className={styles.errorMessage}>{error}</div>}
            </div>

            <div className={styles.actions}>
              <label className={styles.checkbox}>
                <input type="checkbox" defaultChecked />
                Lembrar-me
              </label>
              <Link href="/esqueci-senha" className={styles.forgot}>Esqueci minha senha</Link>
            </div>

            <button type="submit" className={styles.submit} disabled={isLoading}>
              {isLoading ? "Entrando..." : "Entrar"}
            </button>

            <div className={styles.divider}>
              <span>ou continue com</span>
            </div>

            <button type="button" className={styles.microsoft}>
              <svg width="18" height="18" viewBox="0 0 21 21">
                <path fill="#f25022" d="M1 1h9v9H1z"/>
                <path fill="#00a4ef" d="M1 11h9v9H1z"/>
                <path fill="#7fba00" d="M11 1h9v9h-9z"/>
                <path fill="#ffb900" d="M11 11h9v9h-9z"/>
              </svg>
              Entrar com Microsoft
            </button>
          </form>
        </div>

        <p className={styles.register}>
          Ainda não tem uma conta? <Link href="/solicitar-acesso">Solicitar Acesso</Link>
        </p>
      </div>
    </div>
  );
}
