"use client";

import React, { useEffect } from "react";
import Icon from "@/components/ui/icon/Icon";
import Button from "@/components/ui/button/Button";
import styles from "./QuickDetailDrawer.module.css";

export interface QuickDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  secondaryActionLabel?: string;
}

export default function QuickDetailDrawer({
  open,
  onClose,
  title,
  subtitle,
  badge,
  children,
  primaryActionLabel = "Ver Completo",
  onPrimaryAction,
  secondaryActionLabel = "Fechar",
}: QuickDetailDrawerProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && open) {
        onClose();
      }
    }
    if (open) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  return (
    <>
      <div
        className={`${styles.overlay} ${open ? styles.overlayOpen : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`${styles.drawer} ${open ? styles.drawerOpen : ""}`}
        role="dialog"
        aria-modal="true"
      >
        <div className={styles.header}>
          <div className={styles.titleArea}>
            <div className={styles.titleRow}>
              <h3 className={styles.title}>{title}</h3>
              {badge}
            </div>
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Fechar painel"
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        <div className={styles.body}>{children}</div>

        <div className={styles.footer}>
          <Button variant="secondary" onClick={onClose}>
            {secondaryActionLabel}
          </Button>
          {onPrimaryAction && (
            <Button variant="primary" onClick={onPrimaryAction}>
              {primaryActionLabel}
              <Icon name="arrow-right" size={14} />
            </Button>
          )}
        </div>
      </aside>
    </>
  );
}
