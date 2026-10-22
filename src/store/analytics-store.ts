import { create } from "zustand";
import type { TelemetrySample } from "@/lib/simulation/types";

interface AnalyticsStore {
  samples: TelemetrySample[];
  energyWh: number;
  power: number;
  sample: (values: { samples: TelemetrySample[]; energyWh: number; power: number }) => void;
}

export const useAnalyticsStore = create<AnalyticsStore>()((set) => ({
  samples: [],
  energyWh: 0,
  power: 0,
  sample: (values) => set(values),
}));
