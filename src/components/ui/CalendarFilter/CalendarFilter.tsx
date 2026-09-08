"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import styles from "./CalendarFilter.module.css";
import Icon from "../Icon/Icon";

export interface DateFilterValue {
  mode: "range" | "single" | "all";
  startDate?: string; // Formato YYYY-MM-DD
  endDate?: string;   // Formato YYYY-MM-DD
  preset?: string;
}

export interface CalendarFilterProps {
  value: DateFilterValue;
  onChange: (val: DateFilterValue) => void;
  className?: string;
  placeholder?: string;
}

const PRESETS = [
  { label: "Todo o Período", id: "all" },
  { label: "Hoje", id: "today" },
  { label: "Últimos 7 dias", id: "7d" },
  { label: "Últimos 30 dias", id: "30d" },
  { label: "Este Mês", id: "month" },
  { label: "Últimos 90 dias", id: "90d" },
];

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function formatDateToIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatIsoToBr(iso?: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export default function CalendarFilter({
  value,
  onChange,
  className = "",
  placeholder = "Filtrar por data",
}: CalendarFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Local draft state
  const [activeMode, setActiveMode] = useState<"range" | "single">(
    value.mode === "single" ? "single" : "range"
  );
  const [tempStart, setTempStart] = useState<string | undefined>(value.startDate);
  const [tempEnd, setTempEnd] = useState<string | undefined>(value.endDate);
  const [activePreset, setActivePreset] = useState<string | undefined>(value.preset);

  // Calendar month/year navigation state
  const [viewDate, setViewDate] = useState<Date>(() => {
    if (value.startDate) {
      const [y, m] = value.startDate.split("-").map(Number);
      return new Date(y, m - 1, 1);
    }
    return new Date();
  });

  // Sync internal state when prop changes
  useEffect(() => {
    setActiveMode(value.mode === "single" ? "single" : "range");
    setTempStart(value.startDate);
    setTempEnd(value.endDate);
    setActivePreset(value.preset);
  }, [value]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const monthLabel = useMemo(() => {
    return viewDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  }, [viewDate]);

  const prevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  // Calendar days calculation
  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

    const days: Array<{ dayNumber: number | null; iso: string | null }> = [];

    // Empty cells before first day
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ dayNumber: null, iso: null });
    }

    // Days in month
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const date = new Date(year, month, d);
      days.push({
        dayNumber: d,
        iso: formatDateToIso(date),
      });
    }

    return days;
  }, [viewDate]);

  // Handle Day Click
  const handleDayClick = (iso: string) => {
    setActivePreset(undefined);

    if (activeMode === "single") {
      setTempStart(iso);
      setTempEnd(iso);
      return;
    }

    // Range mode
    if (!tempStart || (tempStart && tempEnd)) {
      setTempStart(iso);
      setTempEnd(undefined);
    } else {
      // tempStart exists, selecting end
      if (iso < tempStart) {
        setTempEnd(tempStart);
        setTempStart(iso);
      } else {
        setTempEnd(iso);
      }
    }
  };

  // Apply Preset
  const handleSelectPreset = (presetId: string) => {
    setActivePreset(presetId);
    const today = new Date();
    const todayIso = formatDateToIso(today);

    if (presetId === "all") {
      setTempStart(undefined);
      setTempEnd(undefined);
      onChange({ mode: "all", startDate: undefined, endDate: undefined, preset: "all" });
      setIsOpen(false);
      return;
    }

    if (presetId === "today") {
      setActiveMode("single");
      setTempStart(todayIso);
      setTempEnd(todayIso);
      onChange({ mode: "single", startDate: todayIso, endDate: todayIso, preset: "today" });
      setIsOpen(false);
      return;
    }

    setActiveMode("range");
    if (presetId === "7d") {
      const past = new Date(today);
      past.setDate(past.getDate() - 7);
      const pastIso = formatDateToIso(past);
      setTempStart(pastIso);
      setTempEnd(todayIso);
      onChange({ mode: "range", startDate: pastIso, endDate: todayIso, preset: "7d" });
      setIsOpen(false);
      return;
    }

    if (presetId === "30d") {
      const past = new Date(today);
      past.setDate(past.getDate() - 30);
      const pastIso = formatDateToIso(past);
      setTempStart(pastIso);
      setTempEnd(todayIso);
      onChange({ mode: "range", startDate: pastIso, endDate: todayIso, preset: "30d" });
      setIsOpen(false);
      return;
    }

    if (presetId === "90d") {
      const past = new Date(today);
      past.setDate(past.getDate() - 90);
      const pastIso = formatDateToIso(past);
      setTempStart(pastIso);
      setTempEnd(todayIso);
      onChange({ mode: "range", startDate: pastIso, endDate: todayIso, preset: "90d" });
      setIsOpen(false);
      return;
    }

    if (presetId === "month") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      const firstIso = formatDateToIso(firstDay);
      const lastIso = formatDateToIso(lastDay);
      setTempStart(firstIso);
      setTempEnd(lastIso);
      onChange({ mode: "range", startDate: firstIso, endDate: lastIso, preset: "month" });
      setIsOpen(false);
      return;
    }
  };

  const handleApply = () => {
    if (!tempStart) {
      onChange({ mode: "all", startDate: undefined, endDate: undefined });
    } else if (activeMode === "single" || !tempEnd || tempStart === tempEnd) {
      onChange({
        mode: "single",
        startDate: tempStart,
        endDate: tempStart,
        preset: activePreset,
      });
    } else {
      onChange({
        mode: "range",
        startDate: tempStart,
        endDate: tempEnd,
        preset: activePreset,
      });
    }
    setIsOpen(false);
  };

  const handleClear = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setTempStart(undefined);
    setTempEnd(undefined);
    setActivePreset("all");
    onChange({ mode: "all", startDate: undefined, endDate: undefined, preset: "all" });
  };

  // Label display for trigger button
  const triggerDisplayLabel = useMemo(() => {
    if (value.mode === "all" || (!value.startDate && !value.endDate)) {
      return "Todo o Período";
    }
    if (value.mode === "single" || value.startDate === value.endDate) {
      return formatIsoToBr(value.startDate);
    }
    if (value.startDate && value.endDate) {
      return `${formatIsoToBr(value.startDate)} até ${formatIsoToBr(value.endDate)}`;
    }
    if (value.startDate) {
      return `A partir de ${formatIsoToBr(value.startDate)}`;
    }
    return placeholder;
  }, [value, placeholder]);

  const todayIso = formatDateToIso(new Date());

  return (
    <div className={`${styles.calendarWrapper} ${className}`} ref={containerRef}>
      <button
        type="button"
        className={`${styles.triggerButton} ${isOpen ? styles.triggerButtonActive : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <div className={styles.triggerLeft}>
          <span className={styles.calendarIcon}>
            <Icon name="calendar" size={18} />
          </span>
          <span className={styles.triggerLabel}>{triggerDisplayLabel}</span>
        </div>

        <div className={styles.triggerRight}>
          {value.startDate && (
            <span
              className={styles.clearIcon}
              onClick={handleClear}
              title="Limpar filtro de data"
            >
              <Icon name="x" size={14} />
            </span>
          )}
          <span className={`${styles.chevronIcon} ${isOpen ? styles.chevronRotated : ""}`}>
            <Icon name="chevron-down" size={16} />
          </span>
        </div>
      </button>

      {isOpen && (
        <div className={styles.popover}>
          {/* Mode Switcher */}
          <div className={styles.modeSwitcher}>
            <button
              type="button"
              className={`${styles.modeButton} ${activeMode === "range" ? styles.modeButtonActive : ""}`}
              onClick={() => {
                setActiveMode("range");
                setActivePreset(undefined);
              }}
            >
              Período
            </button>
            <button
              type="button"
              className={`${styles.modeButton} ${activeMode === "single" ? styles.modeButtonActive : ""}`}
              onClick={() => {
                setActiveMode("single");
                setActivePreset(undefined);
                if (tempStart) setTempEnd(tempStart);
              }}
            >
              Dia Único
            </button>
          </div>

          {/* Presets */}
          <div className={styles.presetsContainer}>
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`${styles.presetBadge} ${activePreset === p.id ? styles.presetBadgeActive : ""}`}
                onClick={() => handleSelectPreset(p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Month/Year Navigation */}
          <div className={styles.calendarNav}>
            <button
              type="button"
              className={styles.navButton}
              onClick={prevMonth}
              title="Mês anterior"
            >
              <Icon name="chevron-left" />
            </button>
            <span className={styles.monthLabel}>{monthLabel}</span>
            <button
              type="button"
              className={styles.navButton}
              onClick={nextMonth}
              title="Próximo mês"
            >
              <Icon name="chevron-right" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className={styles.calendarGrid}>
            {WEEKDAYS.map((w) => (
              <div key={w} className={styles.weekHeader}>
                {w}
              </div>
            ))}
            {calendarDays.map((item, idx) => {
              if (!item.iso || !item.dayNumber) {
                return <div key={`empty-${idx}`} className={`${styles.dayCell} ${styles.dayEmpty}`} />;
              }

              const iso = item.iso;
              const isToday = iso === todayIso;
              const isStart = iso === tempStart;
              const isEnd = iso === tempEnd;
              const isInRange =
                activeMode === "range" &&
                tempStart &&
                tempEnd &&
                iso > tempStart &&
                iso < tempEnd;

              let cellClass = styles.dayCell;
              if (isToday) cellClass += ` ${styles.dayToday}`;

              if (activeMode === "single" && isStart) {
                cellClass += ` ${styles.daySelected}`;
              } else if (activeMode === "range") {
                if (isStart && isEnd) {
                  cellClass += ` ${styles.daySelected}`;
                } else if (isStart) {
                  cellClass += ` ${styles.dayRangeStart}`;
                } else if (isEnd) {
                  cellClass += ` ${styles.dayRangeEnd}`;
                } else if (isInRange) {
                  cellClass += ` ${styles.dayInRange}`;
                }
              }

              return (
                <button
                  key={iso}
                  type="button"
                  className={cellClass}
                  onClick={() => handleDayClick(iso)}
                >
                  {item.dayNumber}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className={styles.footer}>
            <div className={styles.selectedSummary}>
              {tempStart && tempEnd && tempStart !== tempEnd
                ? `${formatIsoToBr(tempStart)} - ${formatIsoToBr(tempEnd)}`
                : tempStart
                ? formatIsoToBr(tempStart)
                : "Nenhuma data selecionada"}
            </div>
            <div className={styles.footerActions}>
              <button type="button" className={styles.btnClean} onClick={() => handleClear()}>
                Limpar
              </button>
              <button type="button" className={styles.btnApply} onClick={handleApply}>
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
