"use client";

import React from "react";
import { Button, Icon } from "@/components/ui";
import { formatCurrency } from "@/lib/utils/format-display";
import styles from "./ApprovalModal.module.css";

export interface ApprovalModalProps {
  title: string;
  code: string;
  totalValue: number;
  priority: string;
  priorityLabel?: string;
  onGoToList: () => void;
  onClose: () => void;
}

export default function ApprovalModal({
  title,
  code,
  totalValue,
  priority,
  priorityLabel,
  onGoToList,
  onClose,
}: ApprovalModalProps) {
  const displayPriority = priorityLabel || priority;

  return (
    <div className={styles.modalOverlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalSuccessIcon}>
          <Icon name="check-circle" />
        </div>

        <div className={styles.modalHeader}>
          <h2>Solicitação enviada para aprovação!</h2>
          <p>Sua demanda foi registrada e está aguardando alçada. O que deseja fazer agora?</p>
        </div>

        <div className={styles.modalSummary}>
          <div className={styles.modalSummaryRow}>
            <span>Solicitação</span>
            <strong>{code}</strong>
          </div>
          <div className={styles.modalSummaryRow}>
            <span>Título</span>
            <strong>{title || "Solicitação sem título"}</strong>
          </div>
          <div className={styles.modalSummaryRow}>
            <span>Valor estimado</span>
            <strong className={styles.modalValueHighlight}>{formatCurrency(totalValue)}</strong>
          </div>
          <div className={styles.modalSummaryRow}>
            <span>Prioridade</span>
            <strong>{displayPriority}</strong>
          </div>
        </div>

        <div className={styles.modalActions}>
          <Button variant="primary" className={styles.modalBtnPrimary} onClick={onGoToList}>
            <Icon name="check" />
            Entendido, ir para minhas solicitações
          </Button>
        </div>
      </div>
    </div>
  );
}
