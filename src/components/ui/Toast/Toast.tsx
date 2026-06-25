"use client";

import React, { useEffect, useRef, useState } from "react";
import { ToastItem, ToastVariant, useToast } from "@/contexts/ToastContext";
import styles from "./Toast.module.css";

// ---------------------------------------------------------------------------
// Ícones SVG inline por variante
// ---------------------------------------------------------------------------

const ICONS: Record<ToastVariant, React.ReactNode> = {
  success: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  error: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  warning: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
};

// ---------------------------------------------------------------------------
// Single Toast
// ---------------------------------------------------------------------------

function ToastCard({ toast }: { toast: ToastItem }) {
  const { dismiss } = useToast();
  const [exiting, setExiting] = useState(false);

  const handleDismiss = () => {
    setExiting(true);
    setTimeout(() => dismiss(toast.id), 240);
  };

  return (
    <div
      className={`${styles.toast} ${exiting ? styles.exiting : ""}`}
      role="alert"
      aria-live="polite"
    >
      {/* Ícone */}
      <div className={`${styles.iconWrap} ${styles[`icon_${toast.variant}`]}`}>
        {ICONS[toast.variant]}
      </div>

      {/* Corpo */}
      <div className={styles.body}>
        <p className={styles.title}>{toast.title}</p>
        {toast.message && <p className={styles.message}>{toast.message}</p>}
      </div>

      {/* Fechar */}
      <button
        className={styles.closeBtn}
        onClick={handleDismiss}
        aria-label="Fechar"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Toast Container
// ---------------------------------------------------------------------------

export default function ToastContainer() {
  const { toasts } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className={styles.container} aria-label="Notificações">
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} />
      ))}
    </div>
  );
}
