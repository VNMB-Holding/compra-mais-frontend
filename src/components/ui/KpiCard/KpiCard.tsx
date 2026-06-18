import React from 'react';
import Card from '../Card/Card';
import Icon from '../Icon/Icon';
import styles from './KpiCard.module.css';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: string;
  linkLabel?: string;
  onLinkClick?: () => void;
  description?: string;
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
  description,
  trend
}: KpiCardProps) {
  return (
    <Card className={styles.kpiCard}>
      <div className={styles.iconWrapper}>
        <Icon name={icon} />
      </div>

      <div className={styles.content}>
        <span className={styles.title}>{title}</span>
        <h3 className={styles.value}>{value}</h3>

        {description && (
          <span className={styles.description}>{description}</span>
        )}

        {trend && (
          <div className={styles.trend}>
            <span className={styles.trendValue}>{trend.value}</span>
            <span className={styles.trendLabel}>{trend.label}</span>
          </div>
        )}
      </div>

      {linkLabel && (
        <button className={styles.linkButton} onClick={onLinkClick}>
          {linkLabel}
          <Icon name="arrow-right" size={16} />
        </button>
      )}
    </Card>
  );
}