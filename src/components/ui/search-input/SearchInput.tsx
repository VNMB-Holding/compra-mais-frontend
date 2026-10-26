"use client";

import React from "react";
import Icon from "../icon/Icon";
import styles from "./SearchInput.module.css";

export interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value?: string;
  onSearch?: (value: string) => void;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear?: () => void;
  wrapperClassName?: string;
  loading?: boolean;
}

export default function SearchInput({
  value,
  onSearch,
  onChange,
  onClear,
  className = "",
  wrapperClassName = "",
  placeholder = "Buscar...",
  loading = false,
  ...props
}: SearchInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) onChange(e);
    if (onSearch) onSearch(e.target.value);
  };

  const handleClear = () => {
    if (onClear) {
      onClear();
    } else if (onSearch) {
      onSearch("");
    }
  };

  const hasValue = Boolean(value && String(value).length > 0);

  return (
    <div className={`${styles.searchWrapper} ${wrapperClassName}`}>
      <span className={styles.searchIcon}>
        <Icon name="search-md" size={16} />
      </span>
      <input
        type="text"
        className={`${styles.input} ${className}`}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        {...props}
      />
      {loading ? (
        <span className={styles.loadingSpinner} aria-label="Buscando..." />
      ) : hasValue && (onClear || onSearch) ? (
        <button
          type="button"
          className={styles.clearBtn}
          onClick={handleClear}
          title="Limpar busca"
          aria-label="Limpar busca"
        >
          <Icon name="x-close" size={14} />
        </button>
      ) : null}
    </div>
  );
}
