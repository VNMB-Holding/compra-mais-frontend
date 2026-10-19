"use client";

import React, { useEffect, useState } from "react";
import { Badge, Icon } from "@/components/ui";
import { SupplierTrackingStatus } from "@/types/supplier-tracking";
import { supplierTrackingApi } from "@/lib/api/supplier-tracking";
import styles from "./SupplierEngagementBadge.module.css";

export interface SupplierEngagementBadgeProps {
  status?: SupplierTrackingStatus;
  lastActivityAt?: string;
  rfqId?: string;
  supplierId?: string;
  supplierName?: string;
  proposalStatus?: string;
  onClick?: () => void;
  compact?: boolean;
  className?: string;
}

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return "";
  try {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "agora";
    if (diffMins < 60) return `há ${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `há ${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `há ${diffDays}d`;
  } catch {
    return "";
  }
}

export default function SupplierEngagementBadge({
  status: propStatus,
  lastActivityAt: propLastActivity,
  rfqId,
  supplierId,
  supplierName,
  proposalStatus,
  onClick,
  compact = false,
  className,
}: SupplierEngagementBadgeProps) {
  const [internalStatus, setInternalStatus] = useState<SupplierTrackingStatus>(
    propStatus || (proposalStatus === "received" ? "submitted" : proposalStatus === "declined" ? "declined" : "pending")
  );
  const [internalLastActivity, setInternalLastActivity] = useState<string | undefined>(propLastActivity);

  useEffect(() => {
    if (propStatus) {
      setInternalStatus(propStatus);
      return;
    }

    if (rfqId && supplierId) {
      let isMounted = true;
      supplierTrackingApi
        .getSupplierTracking(rfqId, supplierId, {
          name: supplierName,
          status: proposalStatus,
        })
        .then((res) => {
          if (isMounted) {
            setInternalStatus(res.status);
            setInternalLastActivity(res.lastActivityAt);
          }
        })
        .catch(() => {});

      return () => {
        isMounted = false;
      };
    }
  }, [propStatus, rfqId, supplierId, supplierName, proposalStatus]);

  const activeStatus = propStatus || internalStatus;
  const activeActivity = propLastActivity || internalLastActivity;
  const relativeTime = formatRelativeTime(activeActivity);

  const config: Record<
    SupplierTrackingStatus,
    {
      variant: "primary" | "gray" | "success" | "warning" | "danger" | "dark";
      icon: string;
      label: string;
    }
  > = {
    submitted: {
      variant: "success",
      icon: "check-done-01",
      label: "Proposta Enviada",
    },
    declined: {
      variant: "danger",
      icon: "x-close",
      label: "Cotação Declinada",
    },
    drafting: {
      variant: "warning",
      icon: "edit-01",
      label: "Preenchendo Proposta",
    },
    accessed: {
      variant: "primary",
      icon: "eye",
      label: "Link Acessado",
    },
    opened: {
      variant: "primary",
      icon: "mail-01",
      label: "E-mail Visualizado",
    },
    delivered: {
      variant: "gray",
      icon: "check",
      label: "E-mail Entregue",
    },
    pending: {
      variant: "gray",
      icon: "clock",
      label: "Aguardando Abertura",
    },
  };

  const item = config[activeStatus] || config.pending;

  const badgeElement = (
    <Badge
      variant={item.variant}
      icon={item.icon}
      className={`${styles.interactiveBadge} ${className || ""}`}
    >
      <span className={styles.badgeContent}>
        <span>{item.label}</span>
        {!compact && relativeTime && (
          <span className={styles.timeText}>· {relativeTime}</span>
        )}
      </span>
    </Badge>
  );

  if (onClick) {
    return (
      <button
        type="button"
        className={styles.badgeButton}
        onClick={onClick}
        title="Clique para ver a linha do tempo completa de atividades do fornecedor"
      >
        {badgeElement}
      </button>
    );
  }

  return badgeElement;
}
