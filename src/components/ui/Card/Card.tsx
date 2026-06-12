import React from 'react';
import styles from './Card.module.css';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  noPadding?: boolean;
}

export default function Card({ children, noPadding = false, className = '', ...props }: CardProps) {
  return (
    <div 
      className={`${styles.card} ${noPadding ? styles.noPadding : ''} ${className}`} 
      {...props}
    >
      {children}
    </div>
  );
}