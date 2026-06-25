"use client";

import React, { useState, useRef, useEffect } from 'react';
import styles from './Select.module.css';
import { Icon } from '@/components/ui';

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

export default function Select({
  options,
  value,
  onChange,
  placeholder = "Selecione...",
  disabled = false,
  className = "",
  triggerClassName = "",
  icon
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleSelect = (optionValue: any) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div 
      className={`${styles.container} ${className} ${disabled ? styles.disabled : ''}`} 
      ref={containerRef}
    >
      <button
        type="button"
        className={`${styles.trigger} ${triggerClassName} ${isOpen ? styles.triggerOpen : ''}`}
        onClick={handleToggle}
        disabled={disabled}
      >
        <div className={styles.triggerLeft}>
          {icon && <Icon name={icon} className={styles.leadingIcon} />}
          {selectedOption && selectedOption.icon && (
            <Icon name={selectedOption.icon} className={styles.leadingIcon} />
          )}
          <span className={styles.valueText}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <Icon 
          name="chevron-down" 
          className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`} 
        />
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <ul className={styles.optionsList}>
            {options.map((option, idx) => (
              <li key={idx} className={styles.optionItem}>
                <button
                  type="button"
                  className={`${styles.optionButton} ${option.value === value ? styles.selected : ''}`}
                  onClick={() => handleSelect(option.value)}
                >
                  {option.icon && <Icon name={option.icon} className={styles.optionIcon} />}
                  <span>{option.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
