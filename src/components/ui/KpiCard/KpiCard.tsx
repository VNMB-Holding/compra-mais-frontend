import React from 'react';
import Card from '../Card/Card';
import Icon from '../Icon/Icon';
import Skeleton, { KpiCardSkeleton } from '../Skeleton/Skeleton';

import styles from './KpiCard.module.css';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: string;
  loading?: boolean;
  linkLabel?: string;
  onLinkClick?: () => void;
  onClick?: () => void;
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
  loading = false,
  linkLabel,
  onLinkClick,
  onClick,
  description,
  trend
}: KpiCardProps) {
  const handleClick = onLinkClick || onClick;

  if (loading) {
    return (
      <Card className={styles.kpiCard}>
        <div className={styles.iconWrapper} style={{ background: "transparent", padding: 0 }}>
          <Skeleton variant="rectangular" width={40} height={40} style={{ borderRadius: 8 }} />
        </div>

        <div className={styles.content}>
          <Skeleton variant="text" width="55%" height={14} style={{ marginBottom: 6 }} />
          <Skeleton variant="title" width="40%" height={28} style={{ marginBottom: 6 }} />
          {description && <Skeleton variant="text" width="70%" height={12} />}
        </div>

        {linkLabel && (
          <div style={{ marginTop: 16 }}>
            <Skeleton variant="text" width="35%" height={14} />
          </div>
        )}
      </Card>
    );
  }

  return (
    <Card className={`${styles.kpiCard} ${handleClick ? styles.clickableCard : ""}`} onClick={handleClick}>
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
        <button 
          className={styles.linkButton} 
          onClick={(e) => {
            e.stopPropagation();
            if (handleClick) handleClick();
          }}
        >
          {linkLabel}
          <Icon name="arrow-right" size={16} />
        </button>
      )}
    </Card>
  );
}