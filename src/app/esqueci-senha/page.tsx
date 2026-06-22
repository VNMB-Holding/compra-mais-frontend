"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui";
import styles from "./esqueci-senha.module.css";

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // TODO: Conectar com API de recuperação de senha
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    setIsSubmitted(true);
  };

  return (
    <div className={styles.container}>
      <div className={styles.left} />

      <div className={styles.right}>
        <div className={styles.logoWrapper}>
          <img src="/images/logo-compra-mais.svg" alt="Compra+" className={styles.logoImg} />
        </div>
        <div className={styles.card}>
          {!isSubmitted ? (
            <>
              <h2 className={styles.cardTitle}>Esqueceu a senha?</h2>
              <p className={styles.cardSub}>
                Digite o e-mail associado à sua conta e enviaremos um link para você criar uma nova senha.
              </p>

              <form onSubmit={handleSubmit} className={styles.form}>
                {error && <div className={styles.error}>{error}</div>}

                <div className={styles.field}>
                  <label>E-mail</label>
                  <div className={styles.inputWrapper}>
                    <Icon name="mail-01" size={20} className={styles.inputIcon} />
                    <input
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                <button type="submit" className={styles.submit} disabled={loading}>
                  {loading ? "Enviando..." : "Enviar link de recuperação"}
                </button>
              </form>
            </>
          ) : (
            <div className={styles.successContainer}>
              <div className={styles.successIcon}>
                <Icon name="check-verified-01" size={48} />
              </div>
              <h2 className={styles.cardTitle} style={{ textAlign: "center" }}>E-mail enviado!</h2>
              <p className={styles.cardSub} style={{ textAlign: "center", marginBottom: 0 }}>
                Se o e-mail constar em nossa base de dados, você receberá um link de redefinição de senha em instantes. Verifique também sua caixa de spam.
              </p>
            </div>
          )}
        </div>

        <p className={styles.register}>
          Lembrou a senha? <Link href="/login">Voltar para o Login</Link>
        </p>
      </div>
    </div>
  );
}
