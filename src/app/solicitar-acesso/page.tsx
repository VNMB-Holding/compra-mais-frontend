"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui";
import styles from "./solicitar-acesso.module.css";

const EMPRESAS_DISPONIVEIS = [
  { id: "1", corporateName: "NMB Holdings S.A.", cnpj: "12.345.678/0001-90" },
  { id: "2", corporateName: "Mineradora Ouro Preto Ltda", cnpj: "98.765.432/0001-10" },
  { id: "3", corporateName: "Agro Sul Exportações S.A.", cnpj: "45.678.901/0001-23" },
];

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d{1,4})$/, "$1-$2");
}

export default function SolicitarAcessoPage() {
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    celular: "",
    empresaId: "",
    mensagem: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === "celular") {
      setFormData((prev) => ({ ...prev, celular: formatPhone(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!formData.empresaId) {
      setError("Por favor, selecione a empresa à qual você pertence.");
      return;
    }
    setLoading(true);

    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    setSubmitted(true);
  };

  const selectedEmpresa = EMPRESAS_DISPONIVEIS.find(
    (e) => e.id === formData.empresaId
  );

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
            <h2 className={`${styles.cardTitle} ${styles.cardTitleCenter}`}>Solicitação enviada!</h2>
            <p className={`${styles.cardSub} ${styles.cardSubCenter}`}>
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
                  placeholder="Digite seu nome completo"
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
              <label>Celular / WhatsApp</label>
              <div className={styles.inputWrapper}>
                <Icon name="phone" size={20} className={styles.inputIcon} />
                <input
                  name="celular"
                  type="tel"
                  placeholder="(00) 00000-0000"
                  value={formData.celular}
                  onChange={handleChange}
                  disabled={loading}
                  required
                  maxLength={15}
                />
              </div>
            </div>

            <div className={styles.field}>
              <label>Empresa</label>
              <div className={`${styles.inputWrapper} ${styles.selectWrapper}`}>
                <Icon
                  name="building-01"
                  size={20}
                  className={styles.selectIcon}
                />
                <select
                  name="empresaId"
                  value={formData.empresaId}
                  onChange={handleChange}
                  disabled={loading}
                  required
                  className={`${styles.selectInput} ${!formData.empresaId ? styles.selectInputEmpty : ""}`}
                >
                  <option value="" disabled>Selecione a empresa...</option>
                  {EMPRESAS_DISPONIVEIS.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.corporateName}
                    </option>
                  ))}
                </select>
              </div>
              {selectedEmpresa && (
                <span className={styles.cnpjHint}>
                  CNPJ: {selectedEmpresa.cnpj}
                </span>
              )}
            </div>

            <div className={styles.field}>
              <label>Mensagem <span className={styles.optionalLabel}>(opcional)</span></label>
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
