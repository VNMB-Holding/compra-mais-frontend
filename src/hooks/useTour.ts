"use client";

import { useContext } from "react";
import { useTourContext } from "@/contexts/TourContext";

export type { TourStep, TourDefinition, TourContextValue } from "@/contexts/TourContext";

/**
 * Convenience hook to access the guided-tour context.
 * Must be used within `<TourProvider>`.
 */
export function useTour() {
  return useTourContext();
}
