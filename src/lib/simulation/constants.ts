/**
 * Central tuning constants for the digital twin.
 *
 * Every value here mirrors a real quantity from the ESP32 firmware so the
 * simulation and the hardware report stay consistent. Changing a number in
 * this file changes the behaviour of the 3D scene, the analytics dashboard and
 * the decision panel at once.
 */

/* ------------------------------------------------------------------ clock */

export const SIM_STEP = 1 / 60;
export const SIM_MAX_STEPS_PER_FRAME = 8;
export const PUBLISH_INTERVAL = 1 / 10;
export const TELEMETRY_INTERVAL = 1;
export const TELEMETRY_POINTS = 180;

/* ------------------------------------------------------------- city plan */

/** Road centre-line coordinates on the X and Z axes (metres). */
export const GRID = [-60, -20, 20, 60] as const;
export const ROAD_HALF_WIDTH = 7;
export const LANE_OFFSET = 2.6;
export const SIDEWALK_OFFSET = 9.6;
/** Distance from an intersection centre to the stop line. */
export const STOP_LINE_OFFSET = 11;
/** Length of the crosswalk / intersection box. */
export const INTERSECTION_SIZE = 16;

export const BLOCK_INSET = 12;
export const GROUND_SIZE = 420;

/* -------------------------------------------------------------- lighting */

export const LDR_FULL_SCALE = 4095;
export const LDR_VREF = 3.3;
/** ADC count above which the firmware treats the scene as daylight. */
export const LDR_DUSK_ADC = 1150;

export const DUTY_OFF = 0;
export const DUTY_DIM = 30;
export const DUTY_FULL = 100;

/** Lamp current model: I = I_INTERCEPT + I_SLOPE * duty (0.35 A at 100 %). */
export const LAMP_I_FULL = 0.35;
export const LAMP_I_INTERCEPT = 0.0214;
export const LAMP_I_SLOPE = (LAMP_I_FULL - 0.12) / (DUTY_FULL - DUTY_DIM);

export const SUPPLY_VOLTAGE = 12;

/** PIR cone radius in metres. */
export const PIR_RADIUS = 15;
/** Radius in which an emergency vehicle forces lamps to full output. */
export const EMERGENCY_BOOST_RADIUS = 34;

/* --------------------------------------------------------------- traffic */

export const SIGNAL_GREEN = 10;
export const SIGNAL_AMBER = 2;
export const SIGNAL_ALL_RED = 1;
export const SIGNAL_CYCLE = (SIGNAL_GREEN + SIGNAL_AMBER + SIGNAL_ALL_RED) * 2;

export const VEHICLE_ACCEL = 2.6;
export const VEHICLE_DECEL = 5.2;
export const VEHICLE_LENGTH = 4.4;
export const MIN_HEADWAY = 6;

export const MAX_VEHICLES = 44;
export const MAX_PEDESTRIANS = 26;

/* ------------------------------------------------------------------ faults */

export const FAULT_INTERVAL = 45;
export const FAULT_DURATION = 8;

/* ------------------------------------------------------------------ day */

export const DAY_CYCLE = 160;
export const LUX_DAY = 880;
export const LUX_NIGHT = 7;

/* --------------------------------------------------------------- palette */

export const COLORS = {
  bg: "#050816",
  surface: "rgba(255,255,255,0.05)",
  primary: "#00E5FF",
  success: "#22C55E",
  warning: "#F59E0B",
  danger: "#EF4444",
  accent: "#8B5CF6",
} as const;
