import React from 'react';
import Icon from '../Icon/Icon';
import styles from './Badge.module.css';

interface BadgeProps {
  variant?: 'primary' | 'gray' | 'success' | 'warning' | 'danger' | 'dark';
  icon?: string;
  children: React.ReactNode;
  className?: string;
}

export default function Badge({ variant = 'gray', icon, children, className }: BadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[variant]}${className ? ' ' + className : ''}`}>
      {icon && <Icon name={icon} size={14} />}
      {children}
    </span>
  );
}