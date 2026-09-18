"use client";

import { useContext } from "react";
import { useTourContext } from "@/contexts/TourContext";

export type { TourStep, TourDefinition, TourContextValue } from "@/contexts/TourContext";

export function useTour() {
  return useTourContext();
}
