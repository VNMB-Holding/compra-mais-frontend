"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
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
}

interface DropdownPosition {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
}

const SEARCH_THRESHOLD = 8;
const OPTIONS_PER_PAGE = 8;

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
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<DropdownPosition | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);
  const hasEnhancedMenu = options.length > SEARCH_THRESHOLD;

  const filteredOptions = useMemo(() => {
    const query = normalizeSearch(searchQuery);
    if (!query) return options;

    return options.filter((option) => normalizeSearch(option.label).includes(query));
  }, [options, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredOptions.length / OPTIONS_PER_PAGE));
  const visibleOptions = hasEnhancedMenu
    ? filteredOptions.slice((currentPage - 1) * OPTIONS_PER_PAGE, currentPage * OPTIONS_PER_PAGE)
    : filteredOptions;

  const updateDropdownPosition = () => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const viewportGap = 12;
    const desiredHeight = hasEnhancedMenu ? 380 : 280;
    const spaceBelow = window.innerHeight - rect.bottom - viewportGap;
    const spaceAbove = rect.top - viewportGap;
    const shouldOpenAbove = spaceBelow < 220 && spaceAbove > spaceBelow;
    const maxHeight = Math.max(
      180,
      Math.min(desiredHeight, shouldOpenAbove ? spaceAbove - 4 : spaceBelow - 4),
    );

    setDropdownPosition({
      top: shouldOpenAbove ? rect.top - maxHeight - 4 : rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      maxHeight,
    });
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setCurrentPage(1);
      return;
    }

    window.setTimeout(() => searchInputRef.current?.focus(), 0);
  }, [isOpen]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, options.length]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (containerRef.current?.contains(target) || dropdownRef.current?.contains(target)) {
        return;
      }
      setIsOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    if (isOpen) {
      updateDropdownPosition();
      document.addEventListener("mousedown", handlePointerDown);
      document.addEventListener("keydown", handleKeyDown);
      window.addEventListener("resize", updateDropdownPosition);
      window.addEventListener("scroll", updateDropdownPosition, true);
    }

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", updateDropdownPosition);
      window.removeEventListener("scroll", updateDropdownPosition, true);
    };
  }, [isOpen, hasEnhancedMenu]);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen((open) => !open);
    }
  };

  const handleSelect = (optionValue: any) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const dropdown =
    isOpen && dropdownPosition ? (
      <div
        ref={dropdownRef}
        className={`${styles.dropdown} ${hasEnhancedMenu ? styles.enhancedDropdown : ""}`}
        style={{
          top: dropdownPosition.top,
          left: dropdownPosition.left,
          width: Math.max(dropdownPosition.width, hasEnhancedMenu ? 280 : dropdownPosition.width),
          maxHeight: dropdownPosition.maxHeight,
        }}
      >
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
                : `${(currentPage - 1) * OPTIONS_PER_PAGE + 1}-${Math.min(currentPage * OPTIONS_PER_PAGE, filteredOptions.length)} de ${filteredOptions.length}`}
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
    ) : null;

  return (
    <div
      className={`${styles.container} ${className} ${disabled ? styles.disabled : ""}`}
      ref={containerRef}
    >
      <button
        ref={triggerRef}
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

      {mounted && dropdown ? createPortal(dropdown, document.body) : null}
    </div>
  );
}
