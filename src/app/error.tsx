"use client";

import React, { useState } from "react";
import { Button, Card, Icon, Badge } from "@/components/ui";
import styles from "./error.module.css";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = `Erro: ${error.message}\nDigest: ${error.digest || "N/A"}\nStack: ${error.stack || "N/A"}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.accentBar} />
        
        <div className={styles.cardBody}>
          <div className={styles.iconWrapper}>
            <div className={styles.iconPulse} />
            <Icon name="alert-triangle" className={styles.icon} />
          </div>

          <div className={styles.badgeWrapper}>
            <span className={styles.errorBadge}>
              <Icon name="alert-circle" size={13} /> Instabilidade Detectada
            </span>
          </div>

          <h2 className={styles.title}>Ops! Algo deu errado</h2>
          <p className={styles.description}>
            Ocorreu uma instabilidade inesperada ao processar esta página. Nossa equipe técnica já foi notificada.
          </p>

          
          <div className={styles.diagnosticsBox}>
            <button
              type="button"
              className={styles.diagnosticsToggle}
              onClick={() => setShowDetails(!showDetails)}
            >
              <span>
                <Icon name="code-browser" size={14} /> Detalhes técnicos do erro
              </span>
              <Icon name={showDetails ? "chevron-up" : "chevron-down"} size={14} />
            </button>

            {showDetails && (
              <div className={styles.errorDetailsContainer}>
                <div className={styles.errorDetailsHeader}>
                  <span>Log de Diagnóstico</span>
                  <button type="button" className={styles.copyBtn} onClick={handleCopy}>
                    <Icon name={copied ? "check" : "copy-01"} size={13} />
                    {copied ? "Copiado!" : "Copiar"}
                  </button>
                </div>
                <pre className={styles.errorDetails}>
                  {error.message || "Erro desconhecido"}
                  {error.digest && `\nDigest: ${error.digest}`}
                </pre>
              </div>
            )}
          </div>

          <div className={styles.actions}>
            <Button variant="primary" onClick={() => reset()}>
              <Icon name="refresh-cw-01" /> Tentar Novamente
            </Button>
            <Button variant="secondary" onClick={() => (window.location.href = "/dashboard")}>
              <Icon name="home-01" /> Voltar ao Início
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
