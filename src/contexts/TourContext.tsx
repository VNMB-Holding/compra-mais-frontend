"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";

/* ─── Types ─── */

export interface TourStep {
  /** CSS selector of the target element (e.g. '[data-tour="kpi-grid"]') */
  target: string;
  /** Tooltip title */
  title: string;
  /** Tooltip body */
  description: string;
  /** Preferred placement relative to the element */
  placement?: "top" | "bottom" | "left" | "right" | "auto";
}

export interface TourDefinition {
  /** Unique identifier (e.g. 'dashboard-intro') */
  id: string;
  /** Ordered list of steps */
  steps: TourStep[];
}

export interface TourContextValue {
  /** Start a specific tour */
  startTour: (tour: TourDefinition) => void;
  /** Finish or dismiss the active tour */
  endTour: () => void;
  /** Advance to the next step */
  nextStep: () => void;
  /** Go back to the previous step */
  prevStep: () => void;
  /** Whether a tour is currently running */
  isActive: boolean;
  /** Zero-based index of the current step */
  currentStep: number;
  /** Total number of steps in the active tour */
  totalSteps: number;
  /** The active tour definition (null when inactive) */
  currentTour: TourDefinition | null;
  /** Check if the user has already completed a tour */
  isTourCompleted: (tourId: string) => boolean;
  /** Reset a specific tour so it can run again */
  resetTour: (tourId: string) => void;
}

/* ─── Helpers ─── */

const STORAGE_PREFIX = "compra-tour-done-";

function markCompleted(tourId: string) {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${tourId}`, "1");
  } catch {
    /* SSR or quota exceeded — silent */
  }
}

function checkCompleted(tourId: string): boolean {
  try {
    return localStorage.getItem(`${STORAGE_PREFIX}${tourId}`) === "1";
  } catch {
    return false;
  }
}

function clearCompleted(tourId: string) {
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${tourId}`);
  } catch {
    /* silent */
  }
}

/* ─── Context ─── */

const TourContext = createContext<TourContextValue | null>(null);

export function TourProvider({ children }: { children: React.ReactNode }) {
  const [currentTour, setCurrentTour] = useState<TourDefinition | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  const isActive = currentTour !== null;
  const totalSteps = currentTour?.steps.length ?? 0;

  const startTour = useCallback((tour: TourDefinition) => {
    setCurrentTour(tour);
    setCurrentStep(0);
  }, []);

  const endTour = useCallback(() => {
    if (currentTour) {
      markCompleted(currentTour.id);
    }
    setCurrentTour(null);
    setCurrentStep(0);
  }, [currentTour]);

  const nextStep = useCallback(() => {
    if (!currentTour) return;
    if (currentStep < currentTour.steps.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      endTour();
    }
  }, [currentTour, currentStep, endTour]);

  const prevStep = useCallback(() => {
    setCurrentStep((s) => Math.max(0, s - 1));
  }, []);

  const isTourCompleted = useCallback((tourId: string) => {
    return checkCompleted(tourId);
  }, []);

  const resetTour = useCallback((tourId: string) => {
    clearCompleted(tourId);
  }, []);

  return (
    <TourContext.Provider
      value={{
        startTour,
        endTour,
        nextStep,
        prevStep,
        isActive,
        currentStep,
        totalSteps,
        currentTour,
        isTourCompleted,
        resetTour,
      }}
    >
      {children}
    </TourContext.Provider>
  );
}

export function useTourContext(): TourContextValue {
  const ctx = useContext(TourContext);
  if (!ctx) {
    throw new Error("useTourContext must be used inside <TourProvider>");
  }
  return ctx;
}
