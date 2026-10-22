import { create } from "zustand";
import type { LampCommand, SimMode } from "@/lib/simulation/types";

export type AmbientOverride = "AUTO" | "DAY" | "NIGHT";

interface SimulationStore {
  /** Simulation clock in seconds. */
  time: number;
  running: boolean;
  mode: SimMode;
  ambientOverride: AmbientOverride;
  command: LampCommand;
  /** Non-null when the engine hit an unrecoverable state and was restarted. */
  error: string | null;
  restarts: number;
  setTime: (time: number) => void;
  setMode: (mode: SimMode) => void;
  setAmbientOverride: (mode: AmbientOverride) => void;
  setCommand: (command: LampCommand) => void;
  setError: (error: string | null) => void;
  registerRestart: () => void;
}

export const useSimulationStore = create<SimulationStore>()((set) => ({
  time: 0,
  running: true,
  mode: "DAY",
  ambientOverride: "AUTO",
  command: "AUTO",
  error: null,
  restarts: 0,
  setTime: (time) => set({ time }),
  setMode: (mode) => set({ mode }),
  setAmbientOverride: (ambientOverride) => set({ ambientOverride }),
  setCommand: (command) => set({ command }),
  setError: (error) => set({ error }),
  registerRestart: () => set((state) => ({ restarts: state.restarts + 1 })),
}));
