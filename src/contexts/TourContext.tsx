"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";

export interface TourStep {
  
  target: string;
  
  title: string;
  
  description: string;
  
  placement?: "top" | "bottom" | "left" | "right" | "auto";
  
  onBeforeStep?: () => void;
}

export interface TourDefinition {
  
  id: string;
  
  steps: TourStep[];
  
  onTourStart?: () => void;
  
  onTourEnd?: () => void;
}

export interface TourContextValue {
  
  startTour: (tour: TourDefinition) => void;
  
  endTour: () => void;
  
  nextStep: () => void;
  
  prevStep: () => void;
  
  isActive: boolean;
  
  currentStep: number;
  
  totalSteps: number;
  
  currentTour: TourDefinition | null;
  
  isTourCompleted: (tourId: string) => boolean;
  
  resetTour: (tourId: string) => void;
}

const STORAGE_PREFIX = "compra-tour-done-";

function checkCompleted(tourId: string): boolean {
  try {
    return localStorage.getItem(`${STORAGE_PREFIX}${tourId}`) === "1";
  } catch {
    return false;
  }
}

function markCompleted(tourId: string) {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${tourId}`, "1");
  } catch {
    
  }
}

function clearCompleted(tourId: string) {
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${tourId}`);
  } catch {
    
  }
}

const TourContext = createContext<TourContextValue | null>(null);

export function TourProvider({ children }: { children: React.ReactNode }) {
  const [currentTour, setCurrentTour] = useState<TourDefinition | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  const isActive = currentTour !== null;
  const totalSteps = currentTour?.steps.length ?? 0;

  const startTour = useCallback((tour: TourDefinition) => {
    setCurrentTour(tour);
    setCurrentStep(0);
    tour.onTourStart?.();
    tour.steps[0]?.onBeforeStep?.();
  }, []);

  const endTour = useCallback(() => {
    if (currentTour) {
      markCompleted(currentTour.id);
      currentTour.onTourEnd?.();
    }
    setCurrentTour(null);
    setCurrentStep(0);
  }, [currentTour]);

  const nextStep = useCallback(() => {
    if (!currentTour) return;
    if (currentStep < currentTour.steps.length - 1) {
      const nextIdx = currentStep + 1;
      setCurrentStep(nextIdx);
      currentTour.steps[nextIdx]?.onBeforeStep?.();
    } else {
      endTour();
    }
  }, [currentTour, currentStep, endTour]);

  const prevStep = useCallback(() => {
    if (!currentTour) return;
    const prevIdx = Math.max(0, currentStep - 1);
    setCurrentStep(prevIdx);
    currentTour.steps[prevIdx]?.onBeforeStep?.();
  }, [currentTour, currentStep]);

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
