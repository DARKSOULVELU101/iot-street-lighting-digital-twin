import { create } from "zustand";
import type { SignalState } from "@/lib/simulation/types";

interface TrafficStore {
  vehicles: number;
  movingVehicles: number;
  pedestrians: number;
  emergencyActive: boolean;
  signals: SignalState[];
  sample: (values: {
    vehicles: number;
    movingVehicles: number;
    pedestrians: number;
    emergencyActive: boolean;
    signals: SignalState[];
  }) => void;
}

export const useTrafficStore = create<TrafficStore>()((set) => ({
  vehicles: 0,
  movingVehicles: 0,
  pedestrians: 0,
  emergencyActive: false,
  signals: [],
  sample: (values) => set(values),
}));
