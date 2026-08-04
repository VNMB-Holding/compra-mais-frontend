import React from "react";
import styles from "./Loading.module.css";

export interface LoadingProps {
  variant?: "fullscreen" | "inline";
  message?: string;
  size?: "small" | "medium" | "large";
  className?: string;
}

export default function Loading({
  variant = "fullscreen",
  message = "Carregando...",
  size = "medium",
  className = "",
}: LoadingProps) {
  const containerClass = `${styles.container} ${styles[variant]} ${className}`;
  const spinnerClass = `${styles.spinner} ${styles[size]}`;

  return (
    <div className={containerClass}>
      <div className={styles.content}>
        <div className={styles.spinnerWrapper}>
          <div className={spinnerClass} />
        </div>
        {message && <span className={styles.message}>{message}</span>}
      </div>
    </div>
  );
}
