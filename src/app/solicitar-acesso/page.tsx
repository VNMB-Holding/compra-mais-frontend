"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui";
import styles from "./solicitar-acesso.module.css";

export default function SolicitarAcessoPage() {
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    empresa: "",
    mensagem: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // TODO: Conectar com API para enviar solicitação
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className={styles.container}>
        <div className={styles.left} />
        <div className={styles.right}>
          <div className={styles.logoWrapper}>
            <img src="/images/logo-compra-mais.svg" alt="Compra+" className={styles.logoImg} />
          </div>
          <div className={styles.card}>
            <div className={styles.successIcon}>
              <Icon name="check-verified-01" size={48} />
            </div>
            <h2 className={styles.cardTitle} style={{ textAlign: "center" }}>Solicitação enviada!</h2>
            <p className={styles.cardSub} style={{ textAlign: "center", marginBottom: 0 }}>
              Recebemos seus dados. Nossa equipe analisará e criará sua conta em breve.
              Você receberá um e-mail com as instruções de acesso.
            </p>
          </div>
          <p className={styles.register}>
            <Link href="/login">Voltar para o Login</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.left} />

      <div className={styles.right}>
        <div className={styles.logoWrapper}>
          <img src="/images/logo-compra-mais.svg" alt="Compra+" className={styles.logoImg} />
        </div>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Solicitar Acesso</h2>
          <p className={styles.cardSub}>Preencha os dados abaixo e nossa equipe criará sua conta.</p>

          <form onSubmit={handleSubmit} className={styles.form}>
            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.field}>
              <label>Nome Completo</label>
              <div className={styles.inputWrapper}>
                <Icon name="user-01" size={20} className={styles.inputIcon} />
                <input
                  name="nome"
                  type="text"
                  placeholder="Digite seu nome"
                  value={formData.nome}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className={styles.field}>
              <label>E-mail Corporativo</label>
              <div className={styles.inputWrapper}>
                <Icon name="mail-01" size={20} className={styles.inputIcon} />
                <input
                  name="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className={styles.field}>
              <label>Empresa</label>
              <div className={styles.inputWrapper}>
                <Icon name="building-01" size={20} className={styles.inputIcon} />
                <input
                  name="empresa"
                  type="text"
                  placeholder="Nome da sua empresa"
                  value={formData.empresa}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className={styles.field}>
              <label>Como podemos ajudar?</label>
              <div className={styles.textareaWrapper}>
                <textarea
                  name="mensagem"
                  rows={3}
                  placeholder="Conte-nos brevemente sobre sua necessidade..."
                  value={formData.mensagem}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>

            <button type="submit" className={styles.submit} disabled={loading}>
              {loading ? "Enviando..." : "Enviar Solicitação"}
            </button>
          </form>
        </div>

        <p className={styles.register}>
          Já possui uma conta? <Link href="/login">Voltar para o Login</Link>
        </p>
      </div>
    </div>
  );
}
