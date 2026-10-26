"use client";

import React from "react";
import Link from "next/link";
import Icon from "../icon/Icon";
import styles from "./Breadcrumb.module.css";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumb({ items, className = "" }: BreadcrumbProps) {
  if (!items || items.length === 0) return null;

  return (
    <nav aria-label="Navegação estrutural" className={`${styles.nav} ${className}`}>
      <ol className={styles.list}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className={styles.item}>
              {index > 0 && (
                <span className={styles.separator} aria-hidden="true">
                  <Icon name="chevron-right" size={12} />
                </span>
              )}
              {item.href && !isLast ? (
                <Link href={item.href} className={styles.link}>
                  {item.icon && <Icon name={item.icon} size={14} className={styles.icon} />}
                  <span>{item.label}</span>
                </Link>
              ) : (
                <span
                  className={`${styles.current} ${isLast ? styles.active : ""}`}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.icon && <Icon name={item.icon} size={14} className={styles.icon} />}
                  <span>{item.label}</span>
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
