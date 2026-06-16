import React from 'react';
import styles from './Badge.module.css';

interface BadgeProps {
  variant?: 'primary' | 'gray' | 'success' | 'warning' | 'danger';
  children: React.ReactNode;
  className?: string;
}

export default function Badge({ variant = 'gray', children, className }: BadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[variant]}${className ? ' ' + className : ''}`}>
      {children}
    </span>
  );
}