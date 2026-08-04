import React from "react";
import styles from "./Skeleton.module.css";

export interface SkeletonProps {
  variant?: "text" | "title" | "rectangular" | "circular";
  width?: string | number;
  height?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({
  variant = "text",
  width,
  height,
  className = "",
  style = {},
}: SkeletonProps) {
  const customStyle: React.CSSProperties = {
    ...(width ? { width } : {}),
    ...(height ? { height } : {}),
    ...style,
  };

  const variantClass = styles[variant] || styles.text;

  return (
    <span
      className={`${styles.skeleton} ${variantClass} ${className}`}
      style={customStyle}
    />
  );
}

export interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export function TableSkeleton({ rows = 5, columns = 4 }: TableSkeletonProps) {
  return (
    <div style={{ width: "100%" }}>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div key={rIdx} className={styles.tableRow}>
          {Array.from({ length: columns }).map((_, cIdx) => (
            <div
              key={cIdx}
              className={styles.tableCell}
              style={{
                flex: cIdx === 0 ? 2 : 1,
                opacity: 1 - cIdx * 0.12,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export interface CardSkeletonProps {
  height?: string | number;
}

export function CardSkeleton({ height = 180 }: CardSkeletonProps) {
  return (
    <div
      style={{
        padding: 20,
        background: "#ffffff",
        borderRadius: 12,
        border: "1px solid #e2e8f0",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        height,
      }}
    >
      <Skeleton variant="title" width="40%" />
      <Skeleton variant="text" width="90%" />
      <Skeleton variant="text" width="75%" />
      <div style={{ marginTop: "auto", display: "flex", gap: 10 }}>
        <Skeleton variant="rectangular" height={32} width="30%" />
        <Skeleton variant="rectangular" height={32} width="30%" />
      </div>
    </div>
  );
}

export function KpiCardSkeleton({ hasLink = false }: { hasLink?: boolean }) {
  return (
    <div
      style={{
        padding: "20px",
        background: "#ffffff",
        borderRadius: "12px",
        border: "1px solid #e2e8f0",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        minHeight: "180px",
        position: "relative",
      }}
    >
      <Skeleton variant="rectangular" width={40} height={40} style={{ borderRadius: 8, marginBottom: 16 }} />

      <div style={{ display: "flex", flexDirection: "column", gap: 6, flexGrow: 1 }}>
        <Skeleton variant="text" width="55%" height={14} />
        <Skeleton variant="title" width="40%" height={28} />
        <Skeleton variant="text" width="70%" height={12} />
      </div>

      {hasLink && (
        <div style={{ marginTop: 16 }}>
          <Skeleton variant="text" width="35%" height={14} />
        </div>
      )}
    </div>
  );
}

export default Skeleton;

