import React from 'react';
import Card from '../Card/Card';
import Icon from '../Icon/Icon';
import styles from './UrgentQuoteCard.module.css';

interface QuoteData {
  title: string;
  code: string;
  comprador?: string;
  quantity?: string;
  category?: string;
  costCenter?: string;
  type?: string;
  timeRemaining: string;
  imageUrl?: string;
}

interface UrgentQuoteCardProps {
  quote: QuoteData;
  onAction?: () => void;
}

export default function UrgentQuoteCard({ quote, onAction }: UrgentQuoteCardProps) {
  const localOuCentro = quote.costCenter || quote.category || "Almoxarifado Geral";
  const estrategia = quote.type || "Menor Preço Equalizado";

  return (
    <Card className={styles.urgentCard}>
      {/* Header Padronizado do Dashboard */}
      <div className={styles.cardHeader}>
        <div className={styles.headerTitles}>
          <div className={styles.titleWithIndicator}>
            <h4>Cotação mais urgente</h4>
            <span className={styles.pulseDot} />
          </div>
          <span className={styles.subtitle}>Encerramento prioritário no módulo RFQ</span>
        </div>
      </div>

      {/* Caixa de Destaque Central */}
      <div className={styles.quoteBox}>
        <div className={styles.quoteBoxHeader}>
          <span className={styles.codeTag}>{quote.code}</span>
          <span className={styles.urgencyTag}>
            <Icon name="clock" size={12} /> {quote.timeRemaining}
          </span>
        </div>

        <h3 className={styles.quoteTitle} title={quote.title}>
          {quote.title}
        </h3>

        <div className={styles.quoteMetaList}>
          <div className={styles.metaItem}>
            <Icon name="building-01" size={14} className={styles.metaIcon} />
            <span className={styles.metaText} title={localOuCentro}>{localOuCentro}</span>
          </div>
          <div className={styles.metaItem}>
            <Icon name="check-verified-01" size={14} className={styles.metaIcon} />
            <span className={styles.metaText}>{estrategia}</span>
          </div>
        </div>
      </div>

      {/* Link de Ação no Rodapé Padronizado */}
      <button className={styles.cardLink} onClick={onAction}>
        Acessar cotação na íntegra <Icon name="arrow-right" size={16} />
      </button>
    </Card>
  );
}