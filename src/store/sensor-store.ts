import { create } from "zustand";
import { currentToAdc } from "@/lib/simulation/lighting";

interface SensorStore {
  /** Raw 12-bit ADC value of the LDR module. */
  ldrAdc: number;
  /** Derived illuminance in lux. */
  ldrLux: number;
  /** LDR pin voltage in volts. */
  ldrVoltage: number;
  /** HC-SR501 output level. */
  pir: boolean;
  /** Load current in amperes measured by the ACS712. */
  currentAmps: number;
  /** Raw ACS712 ADC value (2.5 V = zero current). */
  acs712Adc: number;
  sample: (values: {
    ldrAdc: number;
    ldrLux: number;
    ldrVoltage: number;
    pir: boolean;
    currentAmps: number;
  }) => void;
}

export const useSensorStore = create<SensorStore>()((set) => ({
  ldrAdc: 0,
  ldrLux: 0,
  ldrVoltage: 0,
  pir: false,
  currentAmps: 0,
  acs712Adc: currentToAdc(0),
  sample: (values) =>
    set({
      ...values,
      acs712Adc: currentToAdc(values.currentAmps),
    }),
}));
