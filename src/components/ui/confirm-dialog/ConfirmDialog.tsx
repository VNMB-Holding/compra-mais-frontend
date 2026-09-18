"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Icon from "../icon/Icon";
import styles from "./ConfirmDialog.module.css";

export interface ConfirmDialogProps {
  
  open: boolean;
  
  variant?: "danger" | "warning" | "success" | "info";
  
  title: string;
  
  message?: React.ReactNode;
  
  confirmLabel?: string;
  
  cancelLabel?: string;
  
  icon?: string;
  
  loading?: boolean;
  
  loadingConfirmLabel?: string;
  
  onConfirm: () => void;
  
  onCancel: () => void;
}

const VARIANT_CONFIG = {
  danger: {
    iconBg: styles.iconBgDanger,
    confirmBtn: styles.confirmDanger,
    defaultIcon: "trash-01",
    defaultLabel: "Sim, confirmar",
  },
  warning: {
    iconBg: styles.iconBgWarning,
    confirmBtn: styles.confirmWarning,
    defaultIcon: "alert-triangle",
    defaultLabel: "Continuar",
  },
  success: {
    iconBg: styles.iconBgSuccess,
    confirmBtn: styles.confirmSuccess,
    defaultIcon: "check-circle",
    defaultLabel: "Confirmar",
  },
  info: {
    iconBg: styles.iconBgInfo,
    confirmBtn: styles.confirmInfo,
    defaultIcon: "info-circle",
    defaultLabel: "Confirmar",
  },
};

export default function ConfirmDialog({
  open,
  variant = "info",
  title,
  message,
  confirmLabel,
  cancelLabel = "Cancelar",
  icon,
  loading = false,
  loadingConfirmLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!open || !mounted) return null;

  const cfg = VARIANT_CONFIG[variant];
  const iconName = icon ?? cfg.defaultIcon;
  const btnLabel = loading && loadingConfirmLabel ? loadingConfirmLabel : (confirmLabel ?? cfg.defaultLabel);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!loading && e.target === e.currentTarget) onCancel();
  };

  return createPortal(
    <div className={styles.overlay} onClick={handleOverlayClick} role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className={styles.dialog}>

        <div className={`${styles.iconWrap} ${cfg.iconBg}`}>
          <Icon name={iconName} />
        </div>

        <div className={styles.body}>
          <h2 id="confirm-title" className={styles.title}>{title}</h2>
          {message && <p className={styles.message}>{message}</p>}
        </div>

        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </button>
          <button
            className={`${styles.confirmBtn} ${cfg.confirmBtn} ${loading ? styles.loadingBtn : ''}`}
            onClick={onConfirm}
            disabled={loading}
            aria-busy={loading ? 'true' : undefined}
          >
            {loading && (
              <svg
                className={styles.spinner}
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeOpacity="0.25"
                />
                <path
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            )}
            <span>{btnLabel}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
