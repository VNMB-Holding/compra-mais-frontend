"use client";

import React, { useState, useMemo } from "react";
import Icon from "../icon/Icon";
import styles from "./DataTable.module.css";

export interface ColumnDef<T> {
  header: string;
  width?: string;
  accessorKey?: keyof T;
  cell?: (row: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  density?: "normal" | "compact";
}

type SortDirection = "asc" | "desc" | null;

export function DataTable<T>({
  columns,
  data,
  onRowClick,
  density = "normal",
}: DataTableProps<T>) {
  const isCompact = density === "compact";
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const handleHeaderClick = (col: ColumnDef<T>) => {
    if (!col.accessorKey && !col.sortable) return;
    const key = col.accessorKey;
    if (!key) return;

    if (sortKey !== key) {
      setSortKey(key);
      setSortDirection("asc");
    } else if (sortDirection === "asc") {
      setSortDirection("desc");
    } else {
      setSortKey(null);
      setSortDirection(null);
    }
  };

  const sortedData = useMemo(() => {
    if (!sortKey || !sortDirection) return data;

    return [...data].sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];

      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      let comparison = 0;
      if (typeof valA === "number" && typeof valB === "number") {
        comparison = valA - valB;
      } else {
        comparison = String(valA).localeCompare(String(valB), "pt-BR", { numeric: true });
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [data, sortKey, sortDirection]);

  return (
    <div className={styles.tableResponsive}>
      <table className={`${styles.dataTable} ${isCompact ? styles.compact : ""}`}>
        <thead>
          <tr>
            {columns.map((col, idx) => {
              const isSortable = Boolean(col.sortable !== false && col.accessorKey);
              const isCurrentSort = sortKey === col.accessorKey;

              return (
                <th
                  key={idx}
                  style={{ width: col.width }}
                  className={isSortable ? styles.sortableHeader : ""}
                  onClick={isSortable ? () => handleHeaderClick(col) : undefined}
                  title={isSortable ? `Ordenar por ${col.header}` : undefined}
                >
                  <div className={styles.headerContent}>
                    <span>{col.header}</span>
                    {isSortable && (
                      <span className={styles.sortIcon}>
                        {isCurrentSort ? (
                          sortDirection === "asc" ? (
                            <Icon name="chevron-up" size={13} />
                          ) : (
                            <Icon name="chevron-down" size={13} />
                          )
                        ) : (
                          <span className={styles.sortIndicatorDefault} />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              onClick={() => onRowClick && onRowClick(row)}
              className={`${styles.animatedRow} ${onRowClick ? styles.clickableRow : ""}`}
              style={{ "--row-index": Math.min(rowIndex, 8) } as React.CSSProperties}
            >
              {columns.map((col, colIndex) => (
                <td key={colIndex}>
                  {col.cell ? col.cell(row) : col.accessorKey ? String(row[col.accessorKey]) : null}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
