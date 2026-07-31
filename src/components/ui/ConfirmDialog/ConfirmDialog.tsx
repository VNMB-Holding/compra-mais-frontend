"use client";

import React from "react";
import Icon from "../Icon/Icon";
import styles from "./ConfirmDialog.module.css";

export interface ConfirmDialogProps {
  
  open: boolean;
  
  variant?: "danger" | "warning" | "success" | "info";
  
  title: string;
  
  message?: React.ReactNode;
  
  confirmLabel?: string;
  
  cancelLabel?: string;
  
  icon?: string;
  
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
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  const cfg = VARIANT_CONFIG[variant];
  const iconName = icon ?? cfg.defaultIcon;
  const btnLabel = confirmLabel ?? cfg.defaultLabel;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onCancel();
  };

  return (
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
          <button className={styles.cancelBtn} onClick={onCancel}>
            {cancelLabel}
          </button>
          <button className={`${styles.confirmBtn} ${cfg.confirmBtn}`} onClick={onConfirm}>
            {btnLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
