import { create } from "zustand";
import type { FaultEvent } from "@/lib/simulation/types";

interface FaultStore {
  faults: FaultEvent[];
  active: FaultEvent | null;
  /** Timestamp of the last fault lifecycle transition. */
  lastTransition: number;
  sample: (faults: FaultEvent[], active: FaultEvent | null, lastTransition: number) => void;
}

export const useFaultStore = create<FaultStore>()((set) => ({
  faults: [],
  active: null,
  lastTransition: 0,
  sample: (faults, active, lastTransition) => set({ faults, active, lastTransition }),
}));
