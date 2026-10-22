import { create } from "zustand";
import type { EspDecision, LampMode } from "@/lib/simulation/types";

interface LightStore {
  /** Rendered brightness of the monitored lamp, 0..100. */
  brightness: number;
  /** Commanded PWM duty, 0..100. */
  duty: number;
  lampMode: LampMode;
  lampState: 0 | 1;
  boostedPoles: number;
  totalPoles: number;
  zoneCurrent: number;
  zonePower: number;
  decision: EspDecision | null;
  sample: (values: {
    brightness: number;
    duty: number;
    lampMode: LampMode;
    lampState: 0 | 1;
    boostedPoles: number;
    totalPoles: number;
    zoneCurrent: number;
    zonePower: number;
    decision: EspDecision;
  }) => void;
}

export const useLightStore = create<LightStore>()((set) => ({
  brightness: 0,
  duty: 0,
  lampMode: "OFF",
  lampState: 0,
  boostedPoles: 0,
  totalPoles: 48,
  zoneCurrent: 0,
  zonePower: 0,
  decision: null,
  sample: (values) => set(values),
}));
