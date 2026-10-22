export type SimMode = "DAY" | "NIGHT";

export type LampMode = "OFF" | "DIM" | "FULL";

export type VehicleKind = "CAR" | "BIKE" | "EMERGENCY";

export type SignalPhase = "NS_GREEN" | "NS_AMBER" | "ALL_RED" | "EW_GREEN" | "EW_AMBER";

export type Direction = "E" | "W" | "S" | "N";

export type Axis = "EW" | "NS";

export type LampCommand = "AUTO" | "FORCE_ON" | "FORCE_OFF";

export interface CityNode {
  id: number;
  i: number;
  j: number;
  x: number;
  z: number;
  signalized: boolean;
  /** Outgoing directed edge for each travel direction. -1 when absent. */
  out: Record<Direction, number>;
}

export interface CityEdge {
  id: number;
  from: number;
  to: number;
  dir: Direction;
  axis: Axis;
  length: number;
  /** Unit travel vector. */
  dx: number;
  dz: number;
  /** Lane offset vector (right-hand traffic). */
  ox: number;
  oz: number;
}

export interface Pole {
  id: number;
  x: number;
  z: number;
  /** Yaw in radians, used to orient the lamp arm. */
  yaw: number;
  nodeId: number;
  /** True for the primary monitored unit (ESP32 node A). */
  primary: boolean;
}

export interface Vehicle {
  id: number;
  kind: VehicleKind;
  edgeId: number;
  /** Edge the vehicle will take at the next intersection. */
  nextEdgeId: number;
  /** Distance travelled along the current edge (metres). */
  s: number;
  speed: number;
  maxSpeed: number;
  /** Heading in radians. */
  heading: number;
  x: number;
  z: number;
  /** Previous frame position, used for render interpolation. */
  px: number;
  pz: number;
  /** Previous heading, used for render interpolation. */
  pHeading: number;
  /** Seconds spent stationary; used for the stall-recovery watchdog. */
  stalled: number;
  colour: number;
}

export interface Pedestrian {
  id: number;
  x: number;
  z: number;
  px: number;
  pz: number;
  heading: number;
  speed: number;
  /** Loop patrol: rectangular circuit around a city block. */
  blockId: number;
  /** Progress along the circuit, metres. */
  s: number;
  /** Length of the circuit, metres. */
  perimeter: number;
  /** Sidewalk offset applied to the circuit. */
  offset: number;
}

export interface Crosswalker {
  id: number;
  nodeId: number;
  /** Crossing axis: walking along Z crosses the EW carriageway. */
  walkAxis: Axis;
  /** Current crossing state. */
  phase: "WAITING" | "CROSSING";
  /** Progress across the road, 0..1. */
  progress: number;
  /** True when the walker is heading back to the opposite kerb. */
  reverse: boolean;
  speed: number;
  x: number;
  z: number;
  px: number;
  pz: number;
  heading: number;
}

export interface SignalState {
  nodeId: number;
  phase: SignalPhase;
  /** Seconds remaining in the current phase. */
  remaining: number;
  /** 0..1 progress through the current phase. */
  progress: number;
}

export interface LampState {
  id: number;
  /** Commanded PWM duty cycle, 0..100. */
  duty: number;
  /** Rendered brightness, 0..1 (smoothly follows duty). */
  glow: number;
  motion: boolean;
  faulted: boolean;
}

export interface TelemetrySample {
  t: number;
  lux: number;
  adc: number;
  current: number;
  voltage: number;
  power: number;
  energy: number;
  lampState: 0 | 1;
  brightness: number;
  motion: 0 | 1;
  mode: SimMode;
}

export interface FaultEvent {
  id: string;
  poleId: number;
  startedAt: number;
  endsAt: number;
  reason: string;
  severity: "WARNING" | "CRITICAL";
  status: "ACTIVE" | "RECOVERED";
  currentAtFault: number;
}

export interface EspDecision {
  ldrAdc: number;
  ldrLux: number;
  ldrVoltage: number;
  pir: boolean;
  currentAmps: number;
  mode: SimMode;
  lampMode: LampMode;
  duty: number;
  reason: string;
  code: string;
}
