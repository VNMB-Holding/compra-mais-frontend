"use client";

import React from "react";
import Image from "next/image";
import Button from "@/components/ui/Button/Button";
import Icon from "@/components/ui/Icon/Icon";
import styles from "./EmptyState.module.css";

export type EmptyStateIllustration =
  // Conexão / Erros
  | "disconnected"
  | "server-error"
  | "device-offline"
  | "not-found"
  | "connection-lost"
  // E-commerce / Compras
  | "cart-empty"
  | "box-empty"
  | "orders-empty"
  | "zero-items"
  | "basket-empty"
  // Mensagens / Notificações
  | "mailbox-empty"
  | "envelope-empty"
  | "chat-empty"
  | "no-notifications"
  // Social / Fornecedores / Busca
  | "no-suppliers"
  | "no-search"
  | "ghost"
  | "all-done"
  | "no-users"
  // Financeiro / Carteira / Pagamentos
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
  /** Nome semântico da ilustração ou caminho direto da imagem */
  illustration?: EmptyStateIllustration | string;
  /** Título principal do estado vazio */
  title: string;
  /** Mensagem explicativa ou instrução de ação */
  description?: string;
  /** Ação principal (botão) */
  action?: EmptyStateAction | React.ReactNode;
  /** Ação secundária (botão ou link) */
  secondaryAction?: EmptyStateAction | React.ReactNode;
  /** Tamanho da ilustração: sm (120px), md (160px), lg (220px) */
  size?: "sm" | "md" | "lg";
  /** Modo compacto (menos padding para tabelas e gavetas) */
  compact?: boolean;
  /** Classes CSS adicionais */
  className?: string;
  /** Conteúdo extra opcional */
  children?: React.ReactNode;
}

const ILLUSTRATION_MAP: Record<EmptyStateIllustration, string> = {
  // Conexão / Erros
  disconnected: "/illustrations/disconnected.svg",
  "server-error": "/illustrations/server-error.svg",
  "device-offline": "/illustrations/device-offline.svg",
  "not-found": "/illustrations/not-found.svg",
  "connection-lost": "/illustrations/connection-lost.svg",

  // E-commerce / Compras / Cotações
  "cart-empty": "/illustrations/cart-empty.svg",
  "box-empty": "/illustrations/box-empty.svg",
  "orders-empty": "/illustrations/orders-empty.svg",
  "zero-items": "/illustrations/zero-items.svg",
  "basket-empty": "/illustrations/basket-empty.svg",

  // Mensagens
  "mailbox-empty": "/illustrations/mailbox-empty.svg",
  "envelope-empty": "/illustrations/envelope-empty.svg",
  "chat-empty": "/illustrations/chat-empty.svg",
  "no-notifications": "/illustrations/no-notifications.svg",

  // Social / Fornecedores / Busca
  "no-suppliers": "/illustrations/no-suppliers.svg",
  "no-search": "/illustrations/no-search.svg",
  ghost: "/illustrations/ghost.svg",
  "all-done": "/illustrations/all-done.svg",
  "no-users": "/illustrations/no-users.svg",

  // Financeiro / Wallet
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
  // Resolve image source
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
