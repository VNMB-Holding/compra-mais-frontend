"use client";

import React from "react";
import Image from "next/image";
import Icon from "@/components/ui/Icon/Icon";
import Button from "@/components/ui/Button/Button";
import styles from "./ErrorState.module.css";

interface ErrorStateProps {
  /** Error message to show. Defaults to a generic message. */
  message?: string;
  /** Optional heading. Defaults to "Erro ao carregar dados". */
  title?: string;
  /** Called when the user clicks "Tentar novamente". */
  onRetry?: () => void;
  /** Label for the retry button. Defaults to "Tentar novamente". */
  retryLabel?: string;
  /** Nome da ilustração ou 'none' para o ícone padrão de alerta */
  illustration?: "disconnected" | "server-error" | "not-found" | "connection-lost" | "none";
  /** Optional CSS class added to the root element. */
  className?: string;
}

export default function ErrorState({
  message = "Não foi possível carregar os dados. Verifique sua conexão e tente novamente.",
  title = "Erro ao carregar dados",
  onRetry,
  retryLabel = "Tentar novamente",
  illustration = "disconnected",
  className,
}: ErrorStateProps) {
  return (
    <div className={`${styles.errorState} ${className ?? ""}`}>
      {illustration !== "none" ? (
        <div className={styles.imageWrap}>
          <Image
            src={`/illustrations/${illustration}.svg`}
            alt={title}
            width={160}
            height={160}
            className={styles.illustration}
          />
        </div>
      ) : (
        <div className={styles.iconWrap}>
          <Icon name="alert-triangle" size={32} />
        </div>
      )}
      <h4 className={styles.title}>{title}</h4>
      <p className={styles.message}>{message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          <Icon name="refresh-ccw-01" size={16} />
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
