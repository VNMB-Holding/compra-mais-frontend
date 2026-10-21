"use client";

import React from "react";
import Icon from "../icon/Icon";
import { detectMarketplaceFromUrl, MarketplaceSource } from "@/lib/utils/item-description";
import styles from "./MarketplaceLogo.module.css";

export interface MarketplaceLogoProps {
  /** Marketplace ID, URL, or supplier name */
  source?: string | MarketplaceSource | null;
  size?: "sm" | "md" | "lg";
  className?: string;
  showFallbackIcon?: boolean;
}

export default function MarketplaceLogo({
  source,
  size = "sm",
  className = "",
  showFallbackIcon = true,
}: MarketplaceLogoProps) {
  const resolved: MarketplaceSource | null =
    typeof source === "object" && source !== null
      ? source
      : detectMarketplaceFromUrl(source);

  const sizeClass = styles[size] || styles.sm;
  const isMagalu = resolved?.id === "magalu";

  if (resolved?.logoPath) {
    return (
      <span
        className={`${styles.logoWrapper} ${sizeClass} ${
          isMagalu ? styles.magaluAdjust : ""
        } ${className}`}
        title={resolved.label}
      >
        <img
          src={resolved.logoPath}
          alt={resolved.label}
          className={styles.logoImage}
        />
      </span>
    );
  }

  if (!showFallbackIcon) return null;

  const iconSize = size === "lg" ? 18 : size === "md" ? 15 : 13;
  return (
    <span className={`${styles.logoWrapper} ${className}`}>
      <Icon name="link-external-01" size={iconSize} />
    </span>
  );
}
