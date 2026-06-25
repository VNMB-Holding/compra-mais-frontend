"use client";

import React from "react";
import Icon from "../Icon/Icon";
import styles from "./ConfirmDialog.module.css";

export interface ConfirmDialogProps {
  /** Se o dialog está visível */
  open: boolean;
  /** Variante visual — define cor do ícone e botão de confirmação */
  variant?: "danger" | "warning" | "success" | "info";
  /** Título em destaque */
  title: string;
  /** Mensagem descritiva (pode ser JSX) */
  message?: React.ReactNode;
  /** Label do botão de confirmação */
  confirmLabel?: string;
  /** Label do botão de cancelamento */
  cancelLabel?: string;
  /** Ícone do header (nome do componente Icon) */
  icon?: string;
  /** Chamado ao confirmar */
  onConfirm: () => void;
  /** Chamado ao cancelar ou fechar */
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

        {/* Ícone */}
        <div className={`${styles.iconWrap} ${cfg.iconBg}`}>
          <Icon name={iconName} />
        </div>

        {/* Conteúdo */}
        <div className={styles.body}>
          <h2 id="confirm-title" className={styles.title}>{title}</h2>
          {message && <p className={styles.message}>{message}</p>}
        </div>

        {/* Ações */}
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
