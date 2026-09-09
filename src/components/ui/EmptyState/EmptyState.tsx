"use client";

import React from "react";
import Image from "next/image";
import Button from "@/components/ui/Button/Button";
import Icon from "@/components/ui/Icon/Icon";
import styles from "./EmptyState.module.css";

export type EmptyStateIllustration =
  
  | "disconnected"
  | "server-error"
  | "device-offline"
  | "not-found"
  | "connection-lost"
  
  | "cart-empty"
  | "box-empty"
  | "orders-empty"
  | "zero-items"
  | "basket-empty"
  
  | "mailbox-empty"
  | "envelope-empty"
  | "chat-empty"
  | "no-notifications"
  
  | "no-suppliers"
  | "no-search"
  | "ghost"
  | "all-done"
  | "no-users"
  
  | "wallet-empty"
  | "card-add"
  | "card-broken"
  | "budget-empty"
  | "cards";

export interface EmptyStateAction {
  label: string;
  onClick: () => void;
  icon?: string;
  variant?: "primary" | "secondary" | "danger";
}

export interface EmptyStateProps {
  
  illustration?: EmptyStateIllustration | string;
  
  title: string;
  
  description?: string;
  
  action?: EmptyStateAction | React.ReactNode;
  
  secondaryAction?: EmptyStateAction | React.ReactNode;
  
  size?: "sm" | "md" | "lg";
  
  compact?: boolean;
  
  className?: string;
  
  children?: React.ReactNode;
}

const ILLUSTRATION_MAP: Record<EmptyStateIllustration, string> = {
  
  disconnected: "/illustrations/disconnected.svg",
  "server-error": "/illustrations/server-error.svg",
  "device-offline": "/illustrations/device-offline.svg",
  "not-found": "/illustrations/not-found.svg",
  "connection-lost": "/illustrations/connection-lost.svg",

  
  "cart-empty": "/illustrations/cart-empty.svg",
  "box-empty": "/illustrations/box-empty.svg",
  "orders-empty": "/illustrations/orders-empty.svg",
  "zero-items": "/illustrations/zero-items.svg",
  "basket-empty": "/illustrations/basket-empty.svg",

  
  "mailbox-empty": "/illustrations/mailbox-empty.svg",
  "envelope-empty": "/illustrations/envelope-empty.svg",
  "chat-empty": "/illustrations/chat-empty.svg",
  "no-notifications": "/illustrations/no-notifications.svg",

  
  "no-suppliers": "/illustrations/no-suppliers.svg",
  "no-search": "/illustrations/no-search.svg",
  ghost: "/illustrations/ghost.svg",
  "all-done": "/illustrations/all-done.svg",
  "no-users": "/illustrations/no-users.svg",

  
  "wallet-empty": "/illustrations/wallet-empty.svg",
  "card-add": "/illustrations/card-add.svg",
  "card-broken": "/illustrations/card-broken.svg",
  "budget-empty": "/illustrations/budget-empty.svg",
  cards: "/illustrations/cards.svg",
};

export default function EmptyState({
  illustration = "box-empty",
  title,
  description,
  action,
  secondaryAction,
  size = "md",
  compact = false,
  className = "",
  children,
}: EmptyStateProps) {
  
  const src = (ILLUSTRATION_MAP as Record<string, string>)[illustration] ||
    (illustration.startsWith("/") ? illustration : `/illustrations/${illustration}.svg`);

  const sizeClass = size === "sm" ? styles.sizeSm : size === "lg" ? styles.sizeLg : styles.sizeMd;
  const imageDimension = size === "sm" ? 120 : size === "lg" ? 220 : 160;

  const renderAction = (btn: EmptyStateAction | React.ReactNode) => {
    if (!btn) return null;
    if (React.isValidElement(btn)) return btn;

    const actionObj = btn as EmptyStateAction;
    return (
      <Button
        variant={actionObj.variant || "primary"}
        onClick={actionObj.onClick}
      >
        {actionObj.icon && <Icon name={actionObj.icon} size={16} />}
        {actionObj.label}
      </Button>
    );
  };

  return (
    <div className={`${styles.emptyState} ${sizeClass} ${compact ? styles.compact : ""} ${className}`}>
      <div className={styles.imageWrap}>
        <Image
          src={src}
          alt={title}
          width={imageDimension}
          height={imageDimension}
          className={styles.illustration}
          priority={size === "lg"}
        />
      </div>

      <h3 className={styles.title}>{title}</h3>

      {description && <p className={styles.description}>{description}</p>}

      {children}

      {(action || secondaryAction) && (
        <div className={styles.actions}>
          {renderAction(action)}
          {renderAction(secondaryAction)}
        </div>
      )}
    </div>
  );
}
