import React from 'react';
import Card from '../Card/Card';
import styles from './KpiCard.module.css';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: string;
  linkLabel: string;
  onLinkClick?: () => void;
  trend?: {
    value: string;
    label: string;
  };
}

export default function KpiCard({
  title,
  value,
  icon,
  linkLabel,
  onLinkClick,
  trend
}: KpiCardProps) {
  return (
    <Card className={styles.kpiCard}>
      <div className={styles.iconWrapper}>
        <span className="material-symbols-outlined">{icon}</span>
      </div>

      <div className={styles.content}>
        <span className={styles.title}>{title}</span>
        <h3 className={styles.value}>{value}</h3>
        
        {trend && (
          <div className={styles.trend}>
            <span className={styles.trendValue}>{trend.value}</span>
            <span className={styles.trendLabel}>{trend.label}</span>
          </div>
        )}
      </div>

      <button className={styles.linkButton} onClick={onLinkClick}>
        {linkLabel}
        <span className="material-symbols-outlined">arrow_forward</span>
      </button>
    </Card>
  );
}