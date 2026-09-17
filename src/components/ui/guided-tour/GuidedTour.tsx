"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useTourContext } from "@/contexts/TourContext";
import { Button } from "@/components/ui";
import Icon from "../icon/Icon";
import styles from "./GuidedTour.module.css";

/* ─── Types ─── */

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

type Placement = "top" | "bottom" | "left" | "right";

const SPOTLIGHT_PADDING = 8;
const TOOLTIP_GAP = 14;

/* ─── Placement Calculator ─── */

function computePlacement(
  elRect: Rect,
  tooltipWidth: number,
  tooltipHeight: number,
  preferred?: "top" | "bottom" | "left" | "right" | "auto"
): { placement: Placement; top: number; left: number; caretLeft: number | null; caretTop: number | null } {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const spaceTop = elRect.top - SPOTLIGHT_PADDING;
  const spaceBottom = vh - (elRect.top + elRect.height + SPOTLIGHT_PADDING);
  const spaceLeft = elRect.left - SPOTLIGHT_PADDING;
  const spaceRight = vw - (elRect.left + elRect.width + SPOTLIGHT_PADDING);

  const neededH = tooltipHeight + TOOLTIP_GAP + 16;
  const neededW = tooltipWidth + TOOLTIP_GAP + 16;

  let placement: Placement;

  // Verify if preferred fits. If not, pick the side with the most space
  if (preferred === "bottom" && spaceBottom >= neededH) {
    placement = "bottom";
  } else if (preferred === "top" && spaceTop >= neededH) {
    placement = "top";
  } else if (preferred === "right" && spaceRight >= neededW) {
    placement = "right";
  } else if (preferred === "left" && spaceLeft >= neededW) {
    placement = "left";
  } else {
    // Pick the best available position based on available viewport space
    const spaces = [
      { side: "bottom" as Placement, space: spaceBottom },
      { side: "top" as Placement, space: spaceTop },
      { side: "right" as Placement, space: spaceRight },
      { side: "left" as Placement, space: spaceLeft },
    ];
    spaces.sort((a, b) => b.space - a.space);
    placement = spaces[0].side;
  }

  let top = 0;
  let left = 0;
  let caretLeft: number | null = null;
  let caretTop: number | null = null;

  const elCenterX = elRect.left + elRect.width / 2;
  const elCenterY = elRect.top + elRect.height / 2;

  switch (placement) {
    case "bottom":
      top = elRect.top + elRect.height + SPOTLIGHT_PADDING + TOOLTIP_GAP;
      left = Math.max(16, Math.min(elCenterX - tooltipWidth / 2, vw - tooltipWidth - 16));
      caretLeft = Math.max(20, Math.min(elCenterX - left, tooltipWidth - 20));
      break;
    case "top":
      top = elRect.top - SPOTLIGHT_PADDING - TOOLTIP_GAP - tooltipHeight;
      left = Math.max(16, Math.min(elCenterX - tooltipWidth / 2, vw - tooltipWidth - 16));
      caretLeft = Math.max(20, Math.min(elCenterX - left, tooltipWidth - 20));
      break;
    case "right":
      left = elRect.left + elRect.width + SPOTLIGHT_PADDING + TOOLTIP_GAP;
      top = Math.max(16, Math.min(elCenterY - tooltipHeight / 2, vh - tooltipHeight - 16));
      caretTop = Math.max(20, Math.min(elCenterY - top, tooltipHeight - 20));
      break;
    case "left":
      left = elRect.left - SPOTLIGHT_PADDING - TOOLTIP_GAP - tooltipWidth;
      top = Math.max(16, Math.min(elCenterY - tooltipHeight / 2, vh - tooltipHeight - 16));
      caretTop = Math.max(20, Math.min(elCenterY - top, tooltipHeight - 20));
      break;
  }

  // Final viewport safety clamp — guarantees card never exits screen
  top = Math.max(16, Math.min(top, vh - tooltipHeight - 16));
  left = Math.max(16, Math.min(left, vw - tooltipWidth - 16));

  return { placement, top, left, caretLeft, caretTop };
}

/* ─── Component ─── */

export default function GuidedTour() {
  const {
    isActive,
    currentTour,
    currentStep,
    totalSteps,
    nextStep,
    prevStep,
    endTour,
  } = useTourContext();

  const [mounted, setMounted] = useState(false);
  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{
    placement: Placement;
    top: number;
    left: number;
    caretLeft: number | null;
    caretTop: number | null;
  } | null>(null);

  const tooltipRef = useRef<HTMLDivElement>(null);
  const animationKey = useRef(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Measure target element and compute tooltip position
  const measure = useCallback(() => {
    if (!currentTour || !isActive) return;

    const step = currentTour.steps[currentStep];
    if (!step) return;

    const el = document.querySelector(step.target);
    if (!el) return;

    const rect = el.getBoundingClientRect();
    setTargetRect({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    });

    // Scroll element into view if needed
    const inView =
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= window.innerHeight &&
      rect.right <= window.innerWidth;

    if (!inView) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      const timer = setTimeout(() => {
        const r2 = el.getBoundingClientRect();
        const newRect = { top: r2.top, left: r2.left, width: r2.width, height: r2.height };
        setTargetRect(newRect);
        computeTooltip(newRect, step.placement);
      }, 300);
      return () => clearTimeout(timer);
    }

    computeTooltip(
      { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
      step.placement
    );
  }, [currentTour, currentStep, isActive]);

  const computeTooltip = (rect: Rect, preferred?: "top" | "bottom" | "left" | "right" | "auto") => {
    // Use a default tooltip size for initial calculation, will refine after render
    const tooltipW = tooltipRef.current?.offsetWidth || 340;
    const tooltipH = tooltipRef.current?.offsetHeight || 200;

    const pos = computePlacement(rect, tooltipW, tooltipH, preferred);
    setTooltipPos(pos);
  };

  // Re-measure on step change
  useEffect(() => {
    if (!isActive) return;

    animationKey.current += 1;

    // Small delay to allow DOM to settle (e.g. after navigation)
    const timer = setTimeout(measure, 80);
    return () => clearTimeout(timer);
  }, [isActive, currentStep, measure]);

  // Re-measure on resize and scroll
  useEffect(() => {
    if (!isActive) return;

    const handleResize = () => measure();
    const handleScroll = () => measure();

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [isActive, measure]);

  // Refine tooltip position after render (once we have actual dimensions)
  useEffect(() => {
    if (!tooltipRef.current || !targetRect || !isActive) return;

    const tooltipW = tooltipRef.current.offsetWidth;
    const tooltipH = tooltipRef.current.offsetHeight;
    const step = currentTour?.steps[currentStep];

    const pos = computePlacement(targetRect, tooltipW, tooltipH, step?.placement);
    setTooltipPos((prev) => {
      // Only update if significantly different to avoid infinite loops
      if (prev && Math.abs(prev.top - pos.top) < 2 && Math.abs(prev.left - pos.left) < 2) {
        return prev;
      }
      return pos;
    });
  }, [targetRect, isActive, currentStep, currentTour]);

  // Keyboard navigation
  useEffect(() => {
    if (!isActive) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        endTour();
      } else if (e.key === "ArrowRight" || e.key === "Enter") {
        nextStep();
      } else if (e.key === "ArrowLeft") {
        prevStep();
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isActive, endTour, nextStep, prevStep]);

  if (!mounted || !isActive || !currentTour) return null;

  const step = currentTour.steps[currentStep];
  if (!step) return null;

  const isFirst = currentStep === 0;
  const isLast = currentStep === totalSteps - 1;
  const progressPercent = ((currentStep + 1) / totalSteps) * 100;

  const caretClass =
    tooltipPos?.placement === "bottom"
      ? styles.caretBottom
      : tooltipPos?.placement === "top"
      ? styles.caretTop
      : tooltipPos?.placement === "left"
      ? styles.caretRight
      : styles.caretLeft;

  const caretStyle: React.CSSProperties = {};
  if (tooltipPos?.caretLeft !== null && tooltipPos?.caretLeft !== undefined) {
    caretStyle.left = tooltipPos.caretLeft - 6;
  }
  if (tooltipPos?.caretTop !== null && tooltipPos?.caretTop !== undefined) {
    caretStyle.top = tooltipPos.caretTop - 6;
  }

  return createPortal(
    <>
      {/* Clickable backdrop to dismiss */}
      <div className={styles.backdropClick} onClick={endTour} />

      {/* Spotlight */}
      {targetRect && (
        <div
          className={styles.spotlight}
          style={{
            top: targetRect.top - SPOTLIGHT_PADDING,
            left: targetRect.left - SPOTLIGHT_PADDING,
            width: targetRect.width + SPOTLIGHT_PADDING * 2,
            height: targetRect.height + SPOTLIGHT_PADDING * 2,
          }}
        />
      )}

      {/* Tooltip */}
      {tooltipPos && (
        <div
          ref={tooltipRef}
          key={animationKey.current}
          className={styles.tooltip}
          style={{
            top: tooltipPos.top,
            left: tooltipPos.left,
          }}
        >
          {/* Caret arrow */}
          <div
            className={`${styles.caret} ${caretClass}`}
            style={caretStyle}
          />

          {/* Progress bar */}
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Header */}
          <div className={styles.tooltipHeader}>
            <h3 className={styles.tooltipTitle}>{step.title}</h3>
            <button
              className={styles.closeBtn}
              onClick={endTour}
              title="Fechar tutorial"
              aria-label="Fechar tutorial"
            >
              <Icon name="x-close" size={16} />
            </button>
          </div>

          {/* Description */}
          <p className={styles.tooltipDescription}>{step.description}</p>

          {/* Footer */}
          <div className={styles.tooltipFooter}>
            <button className={styles.skipBtn} onClick={endTour}>
              Pular tutorial
            </button>
            <span className={styles.progressText}>
              {currentStep + 1} de {totalSteps}
            </span>
            <div className={styles.navButtons}>
              {!isFirst && (
                <Button variant="secondary" onClick={prevStep}>
                  <Icon name="arrow-left" size={14} /> Voltar
                </Button>
              )}
              <Button variant="primary" onClick={nextStep}>
                {isLast ? "Concluir" : "Próximo"}{" "}
                {!isLast && <Icon name="arrow-right" size={14} />}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body
  );
}
