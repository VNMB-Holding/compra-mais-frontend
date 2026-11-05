import React from "react";
import Card from "../card/Card";
import Icon from "../icon/Icon";
import Badge from "../badge/Badge";
import styles from "./UrgentQuoteCard.module.css";

interface QuoteData {
  title: string;
  code: string;
  comprador?: string;
  quantity?: string;
  category?: string;
  type?: string;
  timeRemaining: string;
  imageUrl?: string;
}

interface UrgentQuoteCardProps {
  quote: QuoteData;
  onAction?: () => void;
}

export default function UrgentQuoteCard({ quote, onAction }: UrgentQuoteCardProps) {
  const localOuCentro = quote.category || "Almoxarifado Geral";
  const estrategia = quote.type || "Menor Preço Equalizado";
  const isUrgentToday =
    quote.timeRemaining.toLowerCase().includes("hoje") ||
    quote.timeRemaining.toLowerCase().includes("vence");

  return (
    <Card className={styles.urgentCard}>
      <div className={styles.cardHeader}>
        <div className={styles.headerRow}>
          <div>
            <h4>Cotação mais urgente</h4>
            <span className={styles.subtitle}>Prazo mais próximo de encerramento</span>
          </div>
          <Badge
            variant={isUrgentToday ? "danger" : "warning"}
            icon="clock"
          >
            {quote.timeRemaining}
          </Badge>
        </div>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.quoteHeader}>
          <Badge variant="gray">{quote.code}</Badge>
        </div>

        <h3
          className={`${styles.quoteTitle}${onAction ? ` ${styles.clickableTitle}` : ""}`}
          title={quote.title}
          onClick={onAction}
        >
          {quote.title}
        </h3>

        <div className={styles.quoteMetaList}>
          <div className={styles.metaItem}>
            <Icon name="building-01" size={15} className={styles.metaIcon} />
            <div className={styles.metaContent}>
              <span className={styles.metaLabel}>Almoxarifado</span>
              <span className={styles.metaValue} title={localOuCentro}>
                {localOuCentro}
              </span>
            </div>
          </div>
          <div className={styles.metaItem}>
            <Icon name="tag-01" size={15} className={styles.metaIcon} />
            <div className={styles.metaContent}>
              <span className={styles.metaLabel}>Critério</span>
              <span className={styles.metaValue} title={estrategia}>
                {estrategia}
              </span>
            </div>
          </div>
        </div>
      </div>

      <button className={styles.cardLink} onClick={onAction}>
        Ver detalhes da cotação <Icon name="arrow-right" size={16} />
      </button>
    </Card>
  );
}
