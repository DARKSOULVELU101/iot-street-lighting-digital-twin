import {
  DUTY_DIM,
  DUTY_FULL,
  DUTY_OFF,
  LAMP_I_FULL,
  LAMP_I_INTERCEPT,
  LAMP_I_SLOPE,
  LDR_DUSK_ADC,
  LDR_FULL_SCALE,
  LDR_VREF,
  SUPPLY_VOLTAGE,
} from "./constants";
import { clamp } from "../utils";
import type { EspDecision, LampCommand, LampMode, SimMode } from "./types";

/* --------------------------------------------------------------- sensors */

/** LDR module output: the analog pin rises as the scene gets brighter. */
export function luxToAdc(lux: number): number {
  const normalised = clamp(lux / 900, 0, 1);
  return Math.round(clamp(normalised, 0, 1) * LDR_FULL_SCALE);
}

export function adcToLux(adc: number): number {
  return (clamp(adc, 0, LDR_FULL_SCALE) / LDR_FULL_SCALE) * 900;
}

export function adcToVoltage(adc: number): number {
  return (clamp(adc, 0, LDR_FULL_SCALE) / LDR_FULL_SCALE) * LDR_VREF;
}

/**
 * ACS712 current model.
 * The device idles at 2.5 V with a sensitivity of 185 mV/A, so the ESP32 ADC
 * reading is reconstructed from the simulated load current.
 */
export function currentToAdc(current: number): number {
  const voltage = 2.5 + Math.max(0, current) * 0.185;
  return Math.round(clamp((voltage / 3.3) * LDR_FULL_SCALE, 0, LDR_FULL_SCALE));
}

export function currentForDuty(duty: number): number {
  if (duty <= DUTY_OFF) return 0;
  return LAMP_I_INTERCEPT + LAMP_I_SLOPE * duty;
}

export function powerForCurrent(current: number): number {
  return current * SUPPLY_VOLTAGE;
}

/* -------------------------------------------------------------- decision */

export interface LampDecisionInput {
  ldrAdc: number;
  motion: boolean;
  currentAmps: number;
  command: LampCommand;
}

export interface LampDecisionResult {
  mode: SimMode;
  lampMode: LampMode;
  duty: number;
  reason: string;
  code: string;
}

/**
 * Mirrors `controlStreetLight()` from the Arduino sketch.
 *
 *   if (ambientADC > DUSK_LIMIT)  -> DAY   -> lamp fully OFF
 *   else if (motionDetected)     -> NIGHT -> lamp at 100 %
 *   else                         -> NIGHT -> lamp at 30 %
 */
export function decideLamp(input: LampDecisionInput): LampDecisionResult {
  const isDay = input.ldrAdc > LDR_DUSK_ADC;

  if (input.command === "FORCE_OFF") {
    return {
      mode: isDay ? "DAY" : "NIGHT",
      lampMode: "OFF",
      duty: DUTY_OFF,
      reason: "Manual override: lamp forced OFF by Telegram command /off",
      code: "CMD_OFF",
    };
  }

  if (input.command === "FORCE_ON") {
    return {
      mode: isDay ? "DAY" : "NIGHT",
      lampMode: "FULL",
      duty: DUTY_FULL,
      reason: "Manual override: lamp forced ON by Telegram command /on",
      code: "CMD_ON",
    };
  }

  if (isDay) {
    return {
      mode: "DAY",
      lampMode: "OFF",
      duty: DUTY_OFF,
      reason: `Ambient level ${input.ldrAdc} ADC above dusk limit ${LDR_DUSK_ADC}`,
      code: "DAY_OFF",
    };
  }

  if (input.motion) {
    return {
      mode: "NIGHT",
      lampMode: "FULL",
      duty: DUTY_FULL,
      reason: `Ambient level ${input.ldrAdc} ADC below dusk limit and PIR triggered`,
      code: "NIGHT_MOTION",
    };
  }

  return {
    mode: "NIGHT",
    lampMode: "DIM",
    duty: DUTY_DIM,
    reason: `Ambient level ${input.ldrAdc} ADC below dusk limit, no motion detected`,
    code: "NIGHT_IDLE",
  };
}

export function buildDecision(
  input: LampDecisionInput,
  result: LampDecisionResult,
): EspDecision {
  return {
    ldrAdc: input.ldrAdc,
    ldrLux: adcToLux(input.ldrAdc),
    ldrVoltage: adcToVoltage(input.ldrAdc),
    pir: input.motion,
    currentAmps: input.currentAmps,
    mode: result.mode,
    lampMode: result.lampMode,
    duty: result.duty,
    reason: result.reason,
    code: result.code,
  };
}

export function lampStateLabel(mode: LampMode): string {
  if (mode === "OFF") return "OFF";
  if (mode === "DIM") return "DIM 30%";
  return "FULL 100%";
}

export { DUTY_DIM, DUTY_FULL, DUTY_OFF, LAMP_I_FULL };
