import React from "react";
import { parseItemDescription, detectMarketplaceFromUrl } from "@/lib/utils/item-description";
import Icon from "../icon/Icon";
import MarketplaceLogo from "../marketplace-logo/MarketplaceLogo";
import styles from "./ItemCell.module.css";

export interface ItemCellProps {
  description?: string | null;
  referenceUrl?: string | null;
  subtitle?: React.ReactNode;
  itemNumber?: number | string;
  hideLink?: boolean;
  linkText?: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function ItemCell({
  description,
  referenceUrl,
  subtitle,
  itemNumber,
  hideLink = false,
  linkText,
  className = "",
  style,
}: ItemCellProps) {
  const { cleanDescription, referenceUrl: parsedUrl } = parseItemDescription(
    description,
    referenceUrl
  );

  const marketplace = parsedUrl ? detectMarketplaceFromUrl(parsedUrl) : null;
  const resolvedLinkText =
    linkText ||
    (marketplace
      ? marketplace.id === "ecommerce"
        ? `Ver anúncio (${marketplace.shortLabel})`
        : `Ver no ${marketplace.label}`
      : "Link de referência");

  return (
    <div className={`${styles.itemCell} ${className}`} style={style}>
      <div className={styles.itemHeader}>
        {itemNumber !== undefined && (
          <span className={styles.itemNumber}>{itemNumber}.</span>
        )}
        <strong className={styles.itemTitle}>{cleanDescription}</strong>
      </div>

      {subtitle && <div className={styles.itemSubtitle}>{subtitle}</div>}

      {!hideLink && parsedUrl && (
        <a
          href={parsedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`${styles.referenceBadge} ${marketplace?.isMercadoLivre ? styles.mercadoLivreBadge : ""}`}
          title={`Abrir referência externa: ${parsedUrl}`}
          onClick={(e) => e.stopPropagation()}
        >
          {marketplace?.logoPath ? (
            <MarketplaceLogo source={marketplace} size="sm" />
          ) : (
            <Icon
              name={marketplace ? "shopping-cart-01" : "link-01"}
              size={12}
              className={styles.referenceIcon}
            />
          )}
          <span>{resolvedLinkText}</span>
          <Icon name="arrow-up-right" size={11} className={styles.arrowIcon} />
        </a>
      )}
    </div>
  );
}
