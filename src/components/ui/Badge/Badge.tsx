import React from 'react';
import styles from './Badge.module.css';

interface BadgeProps {
  variant?: 'primary' | 'gray' | 'success' | 'warning' | 'danger';
  children: React.ReactNode;
}

export default function Badge({ variant = 'gray', children }: BadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[variant]}`}>
      {children}
    </span>
  );
}