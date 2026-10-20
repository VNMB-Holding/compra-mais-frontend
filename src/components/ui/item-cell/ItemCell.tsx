import React from "react";
import { parseItemDescription } from "@/lib/utils/item-description";
import Icon from "../icon/Icon";
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
  linkText = "Link de referência",
  className = "",
  style,
}: ItemCellProps) {
  const { cleanDescription, referenceUrl: parsedUrl } = parseItemDescription(
    description,
    referenceUrl
  );

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
          className={styles.referenceBadge}
          title={`Abrir referência externa: ${parsedUrl}`}
          onClick={(e) => e.stopPropagation()}
        >
          <Icon name="link-01" size={12} className={styles.referenceIcon} />
          <span>{linkText}</span>
          <Icon name="arrow-up-right" size={11} className={styles.arrowIcon} />
        </a>
      )}
    </div>
  );
}
