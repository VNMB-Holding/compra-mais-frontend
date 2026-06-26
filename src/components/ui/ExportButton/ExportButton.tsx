"use client";

import React, { useState, useRef, useEffect } from "react";
import Icon from "../Icon/Icon";
import styles from "./ExportButton.module.css";

interface ExportButtonProps {
  onExport: (type: "PDF" | "XLS") => void;
  defaultType?: "PDF" | "XLS";
}

export default function ExportButton({ onExport, defaultType = "PDF" }: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMainClick = () => {
    onExport(defaultType);
  };

  const handleOptionClick = (type: "PDF" | "XLS") => {
    onExport(type);
    setIsOpen(false);
  };

  return (
    <div className={styles.exportGroup} ref={dropdownRef}>
      <button 
        type="button" 
        className={styles.exportMainBtn} 
        onClick={handleMainClick}
        title={`Exportar como ${defaultType}`}
      >
        <Icon name="download-02" size={16} />
        Exportar
      </button>
      <div className={styles.exportDivider} />
      <button
        type="button"
        className={styles.exportArrowBtn}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Opções de exportação"
        aria-expanded={isOpen}
      >
        <Icon name="chevron-down" size={16} className={`${styles.chevron} ${isOpen ? styles.rotate : ""}`} />
      </button>

      {isOpen && (
        <div className={styles.exportDropdown}>
          <button 
            type="button" 
            className={styles.exportDropdownItem}
            onClick={() => handleOptionClick("PDF")}
          >
            <Icon name="file-02" size={14} style={{ color: "#ef4444" }} />
            <span>Documento PDF (.pdf)</span>
          </button>
          <button 
            type="button" 
            className={styles.exportDropdownItem}
            onClick={() => handleOptionClick("table")}
          >
            <Icon name="table" size={14} style={{ color: "#22c55e" }} />
            <span>Planilha Excel (.xlsx)</span>
          </button>
        </div>
      )}
    </div>
  );
}
