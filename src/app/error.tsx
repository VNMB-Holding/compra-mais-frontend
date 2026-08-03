"use client";

import React from "react";
import { Button, Card, Icon } from "@/components/ui";
import styles from "./error.module.css";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <div className={styles.iconWrapper}>
          <Icon name="alert-triangle" className={styles.icon} />
        </div>
        <h2 className={styles.title}>Ops! Algo deu errado</h2>
        <p className={styles.description}>
          Ocorreu um erro inesperado ao carregar esta página. Nossa equipe já foi notificada.
        </p>
        {process.env.NODE_ENV === "development" && (
          <pre className={styles.errorDetails}>{error.message}</pre>
        )}
        <div className={styles.actions}>
          <Button variant="primary" onClick={() => reset()}>
            Tentar Novamente
          </Button>
          <Button variant="secondary" onClick={() => (window.location.href = "/")}>
            Voltar ao Início
          </Button>
        </div>
      </Card>
    </div>
  );
}
