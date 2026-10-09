"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import styles from "./Select.module.css";
import { Icon } from "@/components/ui";

export interface SelectOption {
  label: string;
  value: any;
  icon?: string;
}

interface SelectProps {
  options: SelectOption[];
  value: any;
  onChange: (value: any) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  icon?: string;
  searchable?: boolean;
  searchThreshold?: number;
  pageSize?: number;
}

const DEFAULT_SEARCH_THRESHOLD = 8;
const DEFAULT_PAGE_SIZE = 8;

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export default function Select({
  options,
  value,
  onChange,
  placeholder = "Selecione...",
  disabled = false,
  className = "",
  triggerClassName = "",
  icon,
  searchable = true,
  searchThreshold = DEFAULT_SEARCH_THRESHOLD,
  pageSize = DEFAULT_PAGE_SIZE,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);
  const effectivePageSize = Math.max(1, pageSize);
  const hasEnhancedMenu = searchable && options.length > searchThreshold;

  const filteredOptions = useMemo(() => {
    const query = normalizeSearch(searchQuery);
    if (!query) return options;

    return options.filter((option) => normalizeSearch(option.label).includes(query));
  }, [options, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredOptions.length / effectivePageSize));
  const visibleOptions = hasEnhancedMenu
    ? filteredOptions.slice((currentPage - 1) * effectivePageSize, currentPage * effectivePageSize)
    : filteredOptions;

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setCurrentPage(1);
      return;
    }

    if (hasEnhancedMenu) {
      window.setTimeout(() => searchInputRef.current?.focus(), 0);
    }
  }, [isOpen, hasEnhancedMenu]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, options.length]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (containerRef.current?.contains(target)) return;
      setIsOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    if (isOpen) {
      document.addEventListener("mousedown", handlePointerDown);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen((open) => !open);
    }
  };

  const handleSelect = (optionValue: any) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div
      className={`${styles.container} ${className} ${disabled ? styles.disabled : ""}`}
      ref={containerRef}
    >
      <button
        type="button"
        className={`${styles.trigger} ${triggerClassName} ${isOpen ? styles.triggerOpen : ""}`}
        onClick={handleToggle}
        disabled={disabled}
      >
        <div className={styles.triggerLeft}>
          {icon && <Icon name={icon} className={styles.leadingIcon} />}
          {selectedOption?.icon && (
            <Icon name={selectedOption.icon} className={styles.leadingIcon} />
          )}
          <span className={styles.valueText}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <Icon
          name="chevron-down"
          className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ""}`}
        />
      </button>

      {isOpen && (
        <div className={`${styles.dropdown} ${hasEnhancedMenu ? styles.enhancedDropdown : ""}`}>
          {hasEnhancedMenu && (
            <div className={styles.searchArea}>
              <div className={styles.searchInputWrap}>
                <Icon name="search-md" className={styles.searchIcon} />
                <input
                  ref={searchInputRef}
                  className={styles.searchInput}
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Buscar opção..."
                />
                {searchQuery && (
                  <button
                    type="button"
                    className={styles.clearSearchBtn}
                    onClick={() => setSearchQuery("")}
                    aria-label="Limpar busca"
                  >
                    <Icon name="x-close" size={14} />
                  </button>
                )}
              </div>
            </div>
          )}

          <ul className={styles.optionsList}>
            {visibleOptions.length > 0 ? (
              visibleOptions.map((option, idx) => (
                <li key={`${String(option.value)}-${idx}`} className={styles.optionItem}>
                  <button
                    type="button"
                    className={`${styles.optionButton} ${option.value === value ? styles.selected : ""}`}
                    onClick={() => handleSelect(option.value)}
                  >
                    {option.icon && <Icon name={option.icon} className={styles.optionIcon} />}
                    <span>{option.label}</span>
                  </button>
                </li>
              ))
            ) : (
              <li className={styles.emptyOption}>Nenhuma opção encontrada</li>
            )}
          </ul>

          {hasEnhancedMenu && (
            <div className={styles.paginationBar}>
              <span>
                {filteredOptions.length === 0
                  ? "0 opções"
                  : `${(currentPage - 1) * effectivePageSize + 1}-${Math.min(currentPage * effectivePageSize, filteredOptions.length)} de ${filteredOptions.length}`}
              </span>
              <div className={styles.paginationActions}>
                <button
                  type="button"
                  className={styles.pageButton}
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  aria-label="Página anterior"
                >
                  <Icon name="chevron-left" size={14} />
                </button>
                <span className={styles.pageIndicator}>
                  {currentPage}/{totalPages}
                </span>
                <button
                  type="button"
                  className={styles.pageButton}
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  aria-label="Próxima página"
                >
                  <Icon name="chevron-right" size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
