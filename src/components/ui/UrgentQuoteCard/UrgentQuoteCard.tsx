import React from 'react';
import Card from '../Card/Card';
import Button from '../Button/Button';
import Badge from '../Badge/Badge';
import styles from './UrgentQuoteCard.module.css';

interface QuoteData {
  title: string;
  code: string;
  comprador?: string;
  quantity?: string;
  category: string;
  type: string;
  timeRemaining: string;
  imageUrl: string; // Caminho para o arquivo PNG (ex: '/images/diesel-tower.png')
}

interface UrgentQuoteCardProps {
  quote: QuoteData;
  onAction?: () => void;
}

export default function UrgentQuoteCard({ quote, onAction }: UrgentQuoteCardProps) {
  return (
    <Card noPadding className={styles.urgentWrapper}>
      {/* Coluna da Esquerda: Textos e Lógica */}
      <div className={styles.content}>
        <div className={styles.headerRow}>
          <Badge variant="warning">{quote.timeRemaining}</Badge>
        </div>
        
        <div className={styles.titleBox}>
          <span className={styles.sectionSubtitle}>Cotação mais urgente</span>
          <h3>{quote.title}</h3>
          <span className={styles.code}>{quote.code}</span>
        </div>

        <div className={styles.detailsGrid}>
          {quote.quantity && (
            <div>
              <small>Quantidade</small>
              <p>{quote.quantity}</p>
            </div>
          )}
          <div>
            <small>Categoria</small>
            <p>{quote.category}</p>
          </div>
          <div className={styles.fullWidth}>
            <small>Tipo</small>
            <p>{quote.type}</p>
          </div>
        </div>

        <Button variant="primary" onClick={onAction} className={styles.actionBtn}>
          Acessar RFQ <span className="material-symbols-outlined">arrow_forward</span>
        </Button>
      </div>

      <div 
        className={styles.imageContainer}
        style={{ backgroundImage: `url(${quote.imageUrl})` }}
      />
    </Card>
  );
}