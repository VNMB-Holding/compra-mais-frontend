import React from "react";
import styles from "./Loading.module.css";

interface LoadingProps {
  variant?: "fullscreen" | "inline";
  message?: string;
  size?: "small" | "medium" | "large";
}

export default function Loading({
  variant = "fullscreen",
  message = "Carregando...",
  size = "medium",
}: LoadingProps) {
  const containerClass = `${styles.container} ${styles[variant]}`;
  const spinnerClass = `${styles.spinner} ${styles[size]}`;

  return (
    <div className={containerClass}>
      <div className={styles.content}>
        <div className={spinnerClass} />
        {message && <span className={styles.message}>{message}</span>}
      </div>
    </div>
  );
}
