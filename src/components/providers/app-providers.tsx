"use client";

import * as React from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useSimulationRuntime } from "@/store/runtime";

export function AppProviders({ children }: { children: React.ReactNode }) {
  useSimulationRuntime();
  return (
    <TooltipProvider delayDuration={120} skipDelayDuration={240}>
      {children}
    </TooltipProvider>
  );
}
