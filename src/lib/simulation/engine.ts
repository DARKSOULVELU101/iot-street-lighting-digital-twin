import { CITY, headingOf, lanePoint } from "./city";
import {
  DAY_CYCLE,
  DUTY_DIM,
  DUTY_FULL,
  DUTY_OFF,
  EMERGENCY_BOOST_RADIUS,
  FAULT_DURATION,
  FAULT_INTERVAL,
  LUX_DAY,
  LUX_NIGHT,
  MAX_PEDESTRIANS,
  MAX_VEHICLES,
  MIN_HEADWAY,
  PIR_RADIUS,
  SIM_MAX_STEPS_PER_FRAME,
  SIM_STEP,
  STOP_LINE_OFFSET,
  SUPPLY_VOLTAGE,
  TELEMETRY_INTERVAL,
  TELEMETRY_POINTS,
  VEHICLE_ACCEL,
  VEHICLE_DECEL,
  VEHICLE_LENGTH,
} from "./constants";
import {
  adcToVoltage,
  buildDecision,
  currentForDuty,
  decideLamp,
  luxToAdc,
} from "./lighting";
import { Rng } from "./prng";
import { chooseNextEdge, phaseIsGreen, signalPhaseAt } from "./traffic";
import { clamp, lerp } from "../utils";
import type {
  EspDecision,
  FaultEvent,
  LampCommand,
  LampMode,
  Pedestrian,
  Crosswalker,
  SimMode,
  SignalState,
  TelemetrySample,
  Vehicle,
  VehicleKind,
} from "./types";

const SEED = 0x5eed1a;
const MERGE_CLEARANCE = 11;
const STALL_LIMIT = 26;

export type EngineEvent =
  | { type: "telegram-in"; text: string }
  | { type: "telegram-out"; text: string; kind: MessageKind }
  | { type: "fault"; fault: FaultEvent }
  | { type: "recovery"; fault: FaultEvent }
  | { type: "log"; level: MessageKind; message: string };

export type MessageKind = "info" | "success" | "warning" | "error";

export interface EngineSnapshot {
  time: number;
  mode: SimMode;
  ambientLux: number;
  ldrAdc: number;
  ldrVoltage: number;
  motion: boolean;
  currentAmps: number;
  voltage: number;
  power: number;
  energyWh: number;
  brightness: number;
  duty: number;
  lampMode: LampMode;
  lampState: 0 | 1;
  command: LampCommand;
  ambientOverride: "AUTO" | "DAY" | "NIGHT";
  decision: EspDecision;
  activeFault: FaultEvent | null;
  faults: FaultEvent[];
  signals: SignalState[];
  vehicleCount: number;
  pedestrianCount: number;
  boostedPoles: number;
  totalPoles: number;
  zoneCurrent: number;
  zonePower: number;
  movingVehicles: number;
  emergencyActive: boolean;
  telemetry: TelemetrySample[];
}

export interface EngineStatus {
  running: boolean;
  error: string | null;
  restarts: number;
}

const LANE_PROBE = { x: 0, z: 0 };

/**
 * The digital twin core.
 *
 * The engine owns every piece of mutable simulation state. React never owns
 * it: the 3D scene reads the arrays directly inside `useFrame`, while the
 * dashboard reads throttled snapshots published through the store layer.
 * That keeps the render loop free of React re-renders.
 */
export class SimulationEngine {
  time = 0;
  alpha = 0;

  vehicles: Vehicle[] = [];
  pedestrians: Pedestrian[] = [];
  crosswalkers: Crosswalker[] = [];
  lamps = CITY.poles.map((pole) => ({
    id: pole.id,
    duty: 0,
    glow: 0,
    motion: false,
    faulted: false,
  }));

  faults: FaultEvent[] = [];
  telemetry: TelemetrySample[] = [];
  signals: SignalState[] = [];

  command: LampCommand = "AUTO";
  ambientOverride: "AUTO" | "DAY" | "NIGHT" = "AUTO";

  decision: EspDecision = {
    ldrAdc: luxToAdc(LUX_DAY),
    ldrLux: LUX_DAY,
    ldrVoltage: adcToVoltage(luxToAdc(LUX_DAY)),
    pir: false,
    currentAmps: 0,
    mode: "DAY",
    lampMode: "OFF",
    duty: 0,
    reason: "Boot sequence",
    code: "BOOT",
  };

  status: EngineStatus = { running: false, error: null, restarts: 0 };

  private rng = new Rng(SEED);
  private accumulator = 0;
  private ambientLux = LUX_DAY;
  private poleMotion: boolean[] = CITY.poles.map(() => false);
  private emergencyBoost = 0;
  private zoneCurrent = 0;
  private zonePower = 0;
  private nodeEnergyWh = 0;
  private lastTelemetryAt = 0;
  private nextFaultAt = FAULT_INTERVAL;
  private nextSpawnAt = 0;
  private nextEmergencyAt = 32;
  private vehicleSeq = 0;
  private pedestrianSeq = 0;
  private crosswalkerSeq = 0;
  private faultSeq = 0;
  private listeners = new Set<(event: EngineEvent) => void>();

  constructor() {
    this.reset();
  }

  /* ------------------------------------------------------------ lifecycle */

  reset(): void {
    this.time = 0;
    this.accumulator = 0;
    this.alpha = 0;
    this.rng = new Rng(SEED);
    this.ambientLux = LUX_DAY;
    this.faults = [];
    this.telemetry = [];
    this.nextFaultAt = FAULT_INTERVAL;
    this.lastTelemetryAt = 0;
    this.nextSpawnAt = 0;
    this.nextEmergencyAt = 32;
    this.zoneCurrent = 0;
    this.zonePower = 0;
    this.nodeEnergyWh = 0;
    this.vehicles = [];
    this.pedestrians = [];
    this.crosswalkers = [];
    this.poleMotion = CITY.poles.map(() => false);
    this.lamps = CITY.poles.map((pole) => ({
      id: pole.id,
      duty: 0,
      glow: 0,
      motion: false,
      faulted: false,
    }));

    this.seedTraffic();
    this.seedPedestrians();
    this.seedCrosswalkers();
    this.refreshSignals();
    this.updateAmbient(SIM_STEP);
    this.updateDecision();
    this.updateLamps(SIM_STEP);
    this.recordTelemetry();
  }

  subscribe(listener: (event: EngineEvent) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(event: EngineEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch {
        // A broken subscriber must never take the simulation down.
      }
    }
  }

  /** Advance the simulation with a wall-clock delta (seconds). */
  advance(deltaSeconds: number): void {
    if (this.status.error) return;
    const delta = clamp(deltaSeconds, 0, 0.25);
    this.accumulator += delta;
    let steps = 0;
    while (this.accumulator >= SIM_STEP && steps < SIM_MAX_STEPS_PER_FRAME) {
      this.step(SIM_STEP);
      this.accumulator -= SIM_STEP;
      steps += 1;
    }
    if (steps >= SIM_MAX_STEPS_PER_FRAME) {
      // Drop the backlog instead of spiralling.
      this.accumulator = 0;
    }
    this.alpha = this.accumulator / SIM_STEP;
  }

  private step(dt: number): void {
    this.time += dt;
    this.updateAmbient(dt);
    this.updateVehicles(dt);
    this.updatePedestrians(dt);
    this.updateCrosswalkers(dt);
    this.updateMotion();
    this.updateDecision();
    this.updateLamps(dt);
    this.updateFaults();
    this.updateEnergy(dt);
    this.refreshSignals();
    this.recordTelemetry();
  }

  /* -------------------------------------------------------------- sensors */

  private updateAmbient(dt: number): void {
    const target = this.ambientTarget();
    const diff = target - this.ambientLux;
    const maxStep = 240 * dt;
    this.ambientLux += clamp(diff, -maxStep, maxStep);
  }

  private ambientTarget(): number {
    if (this.ambientOverride === "DAY") return LUX_DAY;
    if (this.ambientOverride === "NIGHT") return LUX_NIGHT;
    const phase = (this.time % DAY_CYCLE) / DAY_CYCLE;
    const rise = smoothstepLocal(0.12, 0.24, phase);
    const fall = 1 - smoothstepLocal(0.52, 0.66, phase);
    return LUX_NIGHT + (LUX_DAY - LUX_NIGHT) * rise * fall;
  }

  private updateMotion(): void {
    const poles = CITY.poles;
    const radiusSq = PIR_RADIUS * PIR_RADIUS;
    for (let i = 0; i < poles.length; i += 1) {
      const pole = poles[i];
      if (!pole) continue;
      let detected = false;
      for (const walker of this.pedestrians) {
        const dx = walker.x - pole.x;
        const dz = walker.z - pole.z;
        if (dx * dx + dz * dz <= radiusSq) {
          detected = true;
          break;
        }
      }
      if (!detected) {
        for (const walker of this.crosswalkers) {
          const dx = walker.x - pole.x;
          const dz = walker.z - pole.z;
          if (dx * dx + dz * dz <= radiusSq) {
            detected = true;
            break;
          }
        }
      }
      if (!detected) {
        for (const vehicle of this.vehicles) {
          const dx = vehicle.x - pole.x;
          const dz = vehicle.z - pole.z;
          if (dx * dx + dz * dz <= radiusSq) {
            detected = true;
            break;
          }
        }
      }
      this.poleMotion[i] = detected;
    }

    // An emergency vehicle forces every pole in its vicinity to full output.
    this.emergencyBoost = 0;
    for (const vehicle of this.vehicles) {
      if (vehicle.kind !== "EMERGENCY") continue;
      this.emergencyBoost = 1;
      for (let i = 0; i < poles.length; i += 1) {
        const pole = poles[i];
        if (!pole) continue;
        const dx = vehicle.x - pole.x;
        const dz = vehicle.z - pole.z;
        if (dx * dx + dz * dz <= EMERGENCY_BOOST_RADIUS * EMERGENCY_BOOST_RADIUS) {
          this.poleMotion[i] = true;
        }
      }
    }
  }

  private updateDecision(): void {
    const primary = CITY.poles[CITY.primaryPoleId];
    const motion = primary ? (this.poleMotion[CITY.primaryPoleId] ?? false) : false;
    const ldrAdc = luxToAdc(this.ambientLux);
    const decisionInput = {
      ldrAdc,
      motion,
      currentAmps: this.primaryCurrent(),
      command: this.command,
    };
    const result = decideLamp(decisionInput);
    this.decision = buildDecision(decisionInput, result);
  }

  private primaryCurrent(): number {
    const lamp = this.lamps[CITY.primaryPoleId];
    if (!lamp || lamp.faulted) return 0;
    return currentForDuty(lamp.duty);
  }

  private updateLamps(dt: number): void {
    const night = this.decision.mode === "NIGHT";
    const base = night ? DUTY_DIM : DUTY_OFF;
    const smoothing = clamp(dt * 7, 0, 1);
    let zoneCurrent = 0;

    for (let i = 0; i < this.lamps.length; i += 1) {
      const lamp = this.lamps[i];
      if (!lamp) continue;
      const faulted = this.faults.some(
        (fault) => fault.poleId === lamp.id && fault.status === "ACTIVE",
      );
      lamp.faulted = faulted;
      lamp.motion = this.poleMotion[i] ?? false;

      let target: number;
      if (faulted) target = DUTY_OFF;
      else if (this.command === "FORCE_OFF") target = DUTY_OFF;
      else if (this.command === "FORCE_ON") target = DUTY_FULL;
      else if (!night) target = DUTY_OFF;
      else if (lamp.motion) target = DUTY_FULL;
      else target = base;

      lamp.duty = target;
      lamp.glow = lerp(lamp.glow, target / 100, smoothing);
      zoneCurrent += currentForDuty(lamp.duty);
    }

    this.zoneCurrent = zoneCurrent;
    this.zonePower = zoneCurrent * SUPPLY_VOLTAGE;

    // Keep the reported decision consistent with the physical lamp state.
    const primaryLamp = this.lamps[CITY.primaryPoleId];
    this.decision.currentAmps = this.primaryCurrent();
    if (primaryLamp?.faulted) {
      this.decision.lampMode = "OFF";
      this.decision.duty = 0;
      this.decision.code = "FAULT_OPEN";
      this.decision.reason = "Lamp circuit open: measured current 0.00 A while PWM duty is commanded";
    }
  }

  /* -------------------------------------------------------------- traffic */

  private seedTraffic(): void {
    const edges = CITY.edges;
    for (let i = 0; i < 24; i += 1) {
      const edge = this.rng.pick(edges);
      const kind: VehicleKind = this.rng.bool(0.24) ? "BIKE" : "CAR";
      this.spawnVehicle(edge.id, kind, this.rng.range(0, edge.length));
    }
  }

  private spawnVehicle(edgeId: number, kind: VehicleKind, s = 0): Vehicle | null {
    if (this.vehicles.length >= MAX_VEHICLES) return null;
    const edge = CITY.edges[edgeId];
    if (!edge) return null;

    const vehicle: Vehicle = {
      id: this.vehicleSeq,
      kind,
      edgeId,
      nextEdgeId: -1,
      s,
      speed: 0,
      maxSpeed:
        kind === "EMERGENCY"
          ? this.rng.range(17, 21)
          : kind === "BIKE"
            ? this.rng.range(9.5, 13.5)
            : this.rng.range(7, 11),
      heading: headingOf(edge.dir),
      x: 0,
      z: 0,
      px: 0,
      pz: 0,
      pHeading: headingOf(edge.dir),
      stalled: 0,
      colour: this.rng.int(0, 8),
    };
    lanePoint(edge, vehicle.s, LANE_PROBE);
    vehicle.x = LANE_PROBE.x;
    vehicle.z = LANE_PROBE.z;
    vehicle.px = vehicle.x;
    vehicle.pz = vehicle.z;
    vehicle.nextEdgeId = chooseNextEdge(edge.to, edge.dir, () => this.rng.next());
    this.vehicleSeq += 1;
    this.vehicles.push(vehicle);
    return vehicle;
  }

  private buildBuckets(): Map<number, Vehicle[]> {
    const buckets = new Map<number, Vehicle[]>();
    for (const vehicle of this.vehicles) {
      const list = buckets.get(vehicle.edgeId);
      if (list) list.push(vehicle);
      else buckets.set(vehicle.edgeId, [vehicle]);
    }
    return buckets;
  }

  private updateVehicles(dt: number): void {
    const buckets = this.buildBuckets();

    for (const vehicle of this.vehicles) {
      vehicle.px = vehicle.x;
      vehicle.pz = vehicle.z;
      vehicle.pHeading = vehicle.heading;

      const edge = CITY.edges[vehicle.edgeId];
      if (!edge) {
        this.recoverVehicle(vehicle);
        continue;
      }

      if (vehicle.nextEdgeId < 0) {
        vehicle.nextEdgeId = chooseNextEdge(edge.to, edge.dir, () => this.rng.next());
      }

      const stopS = edge.length - STOP_LINE_OFFSET;
      const node = CITY.nodes[edge.to];
      const phase = node ? signalPhaseAt(node.id, this.time) : null;
      const green = !node || !node.signalized || !phase || phaseIsGreen(phase.phase, edge.axis);

      // Leader on the current lane.
      let gap = Number.POSITIVE_INFINITY;
      const sameEdge = buckets.get(vehicle.edgeId);
      if (sameEdge) {
        for (const other of sameEdge) {
          if (other === vehicle) continue;
          if (other.s > vehicle.s) {
            gap = Math.min(gap, other.s - vehicle.s - VEHICLE_LENGTH);
          }
        }
      }

      // Leader on the lane we are about to enter - prevents merging overlap.
      let mergeBlocked = false;
      const nextEdge = CITY.edges[vehicle.nextEdgeId];
      if (nextEdge) {
        const nextBucket = buckets.get(nextEdge.id);
        if (nextBucket) {
          for (const other of nextBucket) {
            if (other.s < MERGE_CLEARANCE) {
              mergeBlocked = true;
              gap = Math.min(gap, edge.length - vehicle.s + other.s - VEHICLE_LENGTH);
            } else {
              gap = Math.min(gap, edge.length - vehicle.s + other.s - VEHICLE_LENGTH);
            }
          }
        }
      }

      const gapSpeed = Number.isFinite(gap)
        ? Math.sqrt(Math.max(0, 2 * VEHICLE_DECEL * Math.max(0, gap - MIN_HEADWAY)))
        : Number.POSITIVE_INFINITY;
      let target = Math.min(vehicle.maxSpeed, gapSpeed);

      const passedStop = vehicle.s > stopS + 0.25;
      if (!green || mergeBlocked) {
        if (!passedStop) {
          const distanceToStop = stopS - vehicle.s;
          const brakingDistance = (vehicle.speed * vehicle.speed) / (2 * VEHICLE_DECEL);
          if (distanceToStop <= brakingDistance + 0.4) target = 0;
          if (vehicle.s + vehicle.speed * dt > stopS) {
            vehicle.s = stopS;
            vehicle.speed = 0;
          }
        }
      }

      if (target > vehicle.speed) {
        vehicle.speed = Math.min(target, vehicle.speed + VEHICLE_ACCEL * dt);
      } else {
        vehicle.speed = Math.max(target, vehicle.speed - VEHICLE_DECEL * dt);
      }
      vehicle.speed = clamp(vehicle.speed, 0, vehicle.maxSpeed);
      vehicle.s += vehicle.speed * dt;

      if (vehicle.s >= edge.length) {
        const overshoot = vehicle.s - edge.length;
        const targetEdge = CITY.edges[vehicle.nextEdgeId];
        if (targetEdge) {
          vehicle.edgeId = targetEdge.id;
          vehicle.s = overshoot;
          vehicle.heading = headingOf(targetEdge.dir);
          vehicle.nextEdgeId = chooseNextEdge(targetEdge.to, targetEdge.dir, () => this.rng.next());
        } else {
          vehicle.s = edge.length;
          vehicle.speed = 0;
        }
      }

      lanePoint(CITY.edges[vehicle.edgeId] ?? edge, vehicle.s, LANE_PROBE);
      vehicle.x = LANE_PROBE.x;
      vehicle.z = LANE_PROBE.z;

      // Stall watchdog: a vehicle that never moves again is recycled.
      if (vehicle.speed < 0.08) {
        vehicle.stalled += dt;
        if (vehicle.stalled > STALL_LIMIT) this.recoverVehicle(vehicle);
      } else {
        vehicle.stalled = 0;
      }
    }

    this.separateVehicles();
    this.spawnTraffic(dt);
  }

  /** Guarantee the minimum headway between vehicles sharing a lane. */
  private separateVehicles(): void {
    const buckets = this.buildBuckets();
    for (const list of buckets.values()) {
      list.sort((a, b) => a.s - b.s);
      for (let i = 1; i < list.length; i += 1) {
        const ahead = list[i - 1];
        const behind = list[i];
        if (!ahead || !behind) continue;
        const minimum = ahead.s - VEHICLE_LENGTH;
        if (behind.s > minimum) {
          behind.s = minimum;
          behind.speed = Math.min(behind.speed, ahead.speed);
        }
      }
    }
  }

  private recoverVehicle(vehicle: Vehicle): void {
    const edge = this.rng.pick(CITY.edges);
    vehicle.edgeId = edge.id;
    vehicle.s = 0;
    vehicle.speed = 0;
    vehicle.stalled = 0;
    vehicle.heading = headingOf(edge.dir);
    vehicle.nextEdgeId = chooseNextEdge(edge.to, edge.dir, () => this.rng.next());
    lanePoint(edge, 0, LANE_PROBE);
    vehicle.x = LANE_PROBE.x;
    vehicle.z = LANE_PROBE.z;
    vehicle.px = vehicle.x;
    vehicle.pz = vehicle.z;
  }

  private spawnTraffic(dt: number): void {
    this.nextSpawnAt -= dt;
    this.nextEmergencyAt -= dt;

    if (this.nextEmergencyAt <= 0) {
      this.nextEmergencyAt = this.rng.range(38, 62);
      const edge = this.rng.pick(CITY.edges);
      const vehicle = this.spawnVehicle(edge.id, "EMERGENCY", 0);
      if (vehicle) {
        this.emit({
          type: "telegram-out",
          kind: "warning",
          text: "Priority vehicle detected on the corridor. Adaptive lighting boosted to 100%.",
        });
      }
    }

    if (this.nextSpawnAt > 0) return;
    this.nextSpawnAt = this.rng.range(0.25, 0.7);
    if (this.vehicles.length >= MAX_VEHICLES) return;

    const buckets = this.buildBuckets();
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const edge = this.rng.pick(CITY.edges);
      const bucket = buckets.get(edge.id);
      const occupied = bucket ? bucket.some((v) => v.s < 14) : false;
      if (occupied) continue;
      const kind: VehicleKind = this.rng.bool(0.26) ? "BIKE" : "CAR";
      this.spawnVehicle(edge.id, kind, 0);
      return;
    }
  }

  /* ---------------------------------------------------------- pedestrians */

  private seedPedestrians(): void {
    const blocks = CITY.blocks;
    for (let i = 0; i < MAX_PEDESTRIANS; i += 1) {
      const block = this.rng.pick(blocks);
      this.spawnPedestrian(block.id);
    }
  }

  private spawnPedestrian(blockId: number): Pedestrian | null {
    if (this.pedestrians.length >= MAX_PEDESTRIANS) return null;
    const block = CITY.blocks[blockId];
    if (!block) return null;
    const walker: Pedestrian = {
      id: this.pedestrianSeq,
      x: 0,
      z: 0,
      px: 0,
      pz: 0,
      heading: 0,
      speed: this.rng.range(1.05, 1.6),
      blockId,
      s: this.rng.range(0, block.perimeter),
      perimeter: block.perimeter,
      offset: 0,
    };
    this.placePedestrian(walker);
    walker.px = walker.x;
    walker.pz = walker.z;
    this.pedestrianSeq += 1;
    this.pedestrians.push(walker);
    return walker;
  }

  private placePedestrian(walker: Pedestrian): void {
    const block = CITY.blocks[walker.blockId];
    if (!block) return;
    const { x0, z0, x1, z1 } = block.walk;
    const w = x1 - x0;
    const h = z1 - z0;
    let d = walker.s % walker.perimeter;
    if (d < 0) d += walker.perimeter;

    if (d < w) {
      walker.x = x0 + d;
      walker.z = z0;
      walker.heading = Math.PI / 2;
    } else if (d < w + h) {
      walker.x = x1;
      walker.z = z0 + (d - w);
      walker.heading = 0;
    } else if (d < 2 * w + h) {
      walker.x = x1 - (d - w - h);
      walker.z = z1;
      walker.heading = -Math.PI / 2;
    } else {
      walker.x = x0;
      walker.z = z1 - (d - 2 * w - h);
      walker.heading = Math.PI;
    }
  }

  private updatePedestrians(dt: number): void {
    for (const walker of this.pedestrians) {
      walker.px = walker.x;
      walker.pz = walker.z;
      walker.s = (walker.s + walker.speed * dt) % walker.perimeter;
      this.placePedestrian(walker);
    }
  }

  private seedCrosswalkers(): void {
    const central = [5, 6, 9, 10].filter((id) => {
      const node = CITY.nodes[id];
      return node ? node.signalized : false;
    });
    for (const nodeId of central) {
      for (let i = 0; i < 2; i += 1) {
        this.spawnCrosswalker(nodeId, i === 0 ? "NS" : "EW");
      }
    }
  }

  private spawnCrosswalker(nodeId: number, walkAxis: "NS" | "EW"): Crosswalker | null {
    const node = CITY.nodes[nodeId];
    if (!node) return null;
    const walker: Crosswalker = {
      id: this.crosswalkerSeq,
      nodeId,
      walkAxis,
      phase: "WAITING",
      progress: 0,
      reverse: false,
      speed: this.rng.range(1.2, 1.7),
      x: node.x,
      z: node.z,
      px: node.x,
      pz: node.z,
      heading: 0,
    };
    this.placeCrosswalker(walker);
    walker.px = walker.x;
    walker.pz = walker.z;
    this.crosswalkerSeq += 1;
    this.crosswalkers.push(walker);
    return walker;
  }

  private placeCrosswalker(walker: Crosswalker): void {
    const node = CITY.nodes[walker.nodeId];
    if (!node) return;
    const span = 9.6;
    const t = walker.reverse ? walker.progress : 1 - walker.progress;
    if (walker.walkAxis === "NS") {
      walker.x = node.x + 9.6;
      walker.z = node.z - span + t * span * 2;
      walker.heading = walker.reverse ? 0 : Math.PI;
    } else {
      walker.z = node.z + 9.6;
      walker.x = node.x - span + t * span * 2;
      walker.heading = walker.reverse ? Math.PI / 2 : -Math.PI / 2;
    }
  }

  private updateCrosswalkers(dt: number): void {
    for (const walker of this.crosswalkers) {
      walker.px = walker.x;
      walker.pz = walker.z;
      const node = CITY.nodes[walker.nodeId];
      if (!node) continue;
      const phase = signalPhaseAt(node.id, this.time);
      // Cross the carriageway only while the conflicting traffic is stopped.
      const conflictAxis = walker.walkAxis === "NS" ? "EW" : "NS";
      const trafficMoving = phaseIsGreen(phase.phase, conflictAxis);

      if (walker.phase === "WAITING") {
        if (!trafficMoving) {
          walker.phase = "CROSSING";
          walker.progress = 0;
        }
      }

      if (walker.phase === "CROSSING") {
        walker.progress += (walker.speed * dt) / (9.6 * 2);
        if (walker.progress >= 1) {
          walker.progress = 0;
          walker.phase = "WAITING";
          walker.reverse = !walker.reverse;
        }
      }
      this.placeCrosswalker(walker);
    }
  }

  /* --------------------------------------------------------------- faults */

  private updateFaults(): void {
    if (this.time >= this.nextFaultAt) {
      this.nextFaultAt += FAULT_INTERVAL;
      const fault: FaultEvent = {
        id: `FLT-${(this.faultSeq + 1).toString().padStart(3, "0")}`,
        poleId: CITY.primaryPoleId,
        startedAt: this.time,
        endsAt: this.time + FAULT_DURATION,
        reason: "Lamp current below expected threshold while PWM duty is commanded",
        severity: "CRITICAL",
        status: "ACTIVE",
        currentAtFault: this.primaryCurrent(),
      };
      this.faultSeq += 1;
      this.faults.unshift(fault);
      if (this.faults.length > 12) this.faults.pop();
      this.emit({ type: "fault", fault });
      this.emit({
        type: "telegram-out",
        kind: "error",
        text: `FAULT ${fault.id}: lamp current 0.00 A on node A (expected ${this.primaryCurrent().toFixed(2)} A). Pole marked offline.`,
      });
    }

    for (const fault of this.faults) {
      if (fault.status === "ACTIVE" && this.time >= fault.endsAt) {
        fault.status = "RECOVERED";
        this.emit({ type: "recovery", fault });
        this.emit({
          type: "telegram-out",
          kind: "success",
          text: `${fault.id} cleared automatically. Node A back online, current restored to ${this.primaryCurrent().toFixed(2)} A.`,
        });
      }
    }
  }

  private updateEnergy(dt: number): void {
    const primaryPower = this.primaryCurrent() * SUPPLY_VOLTAGE;
    this.nodeEnergyWh += (primaryPower * dt) / 3600;
  }

  /* ------------------------------------------------------------ telemetry */

  private refreshSignals(): void {
    const next: SignalState[] = [];
    for (const node of CITY.nodes) {
      if (!node.signalized) continue;
      next.push(signalPhaseAt(node.id, this.time));
    }
    this.signals = next;
  }

  private recordTelemetry(): void {
    if (this.time - this.lastTelemetryAt < TELEMETRY_INTERVAL) return;
    this.lastTelemetryAt = this.time;
    const lamp = this.lamps[CITY.primaryPoleId];
    const current = this.primaryCurrent();
    const sample: TelemetrySample = {
      t: Number(this.time.toFixed(1)),
      lux: Number(this.ambientLux.toFixed(1)),
      adc: this.decision.ldrAdc,
      current: Number(current.toFixed(3)),
      voltage: SUPPLY_VOLTAGE,
      power: Number((current * SUPPLY_VOLTAGE).toFixed(2)),
      energy: Number(this.nodeEnergyWh.toFixed(3)),
      lampState: lamp && lamp.duty > 0 ? 1 : 0,
      brightness: lamp ? Math.round(lamp.glow * 100) : 0,
      motion: this.decision.pir ? 1 : 0,
      mode: this.decision.mode,
    };
    this.telemetry.push(sample);
    if (this.telemetry.length > TELEMETRY_POINTS) this.telemetry.shift();
  }

  /* ------------------------------------------------------------ commands */

  setCommand(command: LampCommand): void {
    this.command = command;
    this.updateDecision();
  }

  setAmbientOverride(mode: "AUTO" | "DAY" | "NIGHT"): void {
    this.ambientOverride = mode;
  }

  /** Execute a Telegram bot command and return the bot reply. */
  executeCommand(raw: string): string {
    const command = raw.trim().toLowerCase();
    this.emit({ type: "telegram-in", text: raw.trim() });

    switch (command) {
      case "/status": {
        const lamp = this.lamps[CITY.primaryPoleId];
        const reply = [
          "Street Light Node A - Status",
          `Mode: ${this.decision.mode}`,
          `Ambient: ${this.decision.ldrLux.toFixed(0)} lux (ADC ${this.decision.ldrAdc})`,
          `PIR: ${this.decision.pir ? "motion detected" : "no motion"}`,
          `Lamp: ${this.decision.lampMode} @ ${Math.round((lamp?.duty ?? 0))} %`,
          `Current: ${this.primaryCurrent().toFixed(2)} A`,
          `Power: ${(this.primaryCurrent() * SUPPLY_VOLTAGE).toFixed(2)} W`,
          `Energy: ${this.nodeEnergyWh.toFixed(2)} Wh`,
          `Zone load: ${this.zoneCurrent.toFixed(2)} A across ${this.lamps.length} poles`,
        ].join("\n");
        this.emit({ type: "telegram-out", kind: "info", text: reply });
        return reply;
      }
      case "/on": {
        this.setCommand("FORCE_ON");
        const reply = "Manual control: lamp forced ON at 100 % duty.";
        this.emit({ type: "telegram-out", kind: "success", text: reply });
        return reply;
      }
      case "/off": {
        this.setCommand("FORCE_OFF");
        const reply = "Manual control: lamp forced OFF. PWM duty set to 0 %.";
        this.emit({ type: "telegram-out", kind: "warning", text: reply });
        return reply;
      }
      case "/auto": {
        this.setCommand("AUTO");
        const reply = "Adaptive mode restored. LDR + PIR control is active again.";
        this.emit({ type: "telegram-out", kind: "success", text: reply });
        return reply;
      }
      default: {
        const reply =
          "Unknown command. Use /status, /on, /off or /auto.";
        this.emit({ type: "telegram-out", kind: "error", text: reply });
        return reply;
      }
    }
  }

  /* ------------------------------------------------------------ snapshot */

  snapshot(): EngineSnapshot {
    const lamp = this.lamps[CITY.primaryPoleId];
    const activeFault = this.faults.find((fault) => fault.status === "ACTIVE") ?? null;
    let moving = 0;
    for (const vehicle of this.vehicles) {
      if (vehicle.speed > 0.4) moving += 1;
    }
    let boosted = 0;
    for (const lampState of this.lamps) {
      if (lampState.motion && lampState.duty > 0) boosted += 1;
    }

    return {
      time: this.time,
      mode: this.decision.mode,
      ambientLux: Number(this.ambientLux.toFixed(1)),
      ldrAdc: this.decision.ldrAdc,
      ldrVoltage: Number(this.decision.ldrVoltage.toFixed(3)),
      motion: this.decision.pir,
      currentAmps: Number(this.primaryCurrent().toFixed(3)),
      voltage: SUPPLY_VOLTAGE,
      power: Number((this.primaryCurrent() * SUPPLY_VOLTAGE).toFixed(2)),
      energyWh: Number(this.nodeEnergyWh.toFixed(3)),
      brightness: Math.round((lamp?.glow ?? 0) * 100),
      duty: Math.round(lamp?.duty ?? 0),
      lampMode: this.decision.lampMode,
      lampState: lamp && lamp.duty > 0 ? 1 : 0,
      command: this.command,
      ambientOverride: this.ambientOverride,
      decision: this.decision,
      activeFault,
      faults: this.faults.slice(0, 6),
      signals: this.signals,
      vehicleCount: this.vehicles.length,
      pedestrianCount: this.pedestrians.length + this.crosswalkers.length,
      boostedPoles: boosted,
      totalPoles: this.lamps.length,
      zoneCurrent: Number(this.zoneCurrent.toFixed(2)),
      zonePower: Number(this.zonePower.toFixed(1)),
      movingVehicles: moving,
      emergencyActive: this.emergencyBoost > 0,
      telemetry: this.telemetry.slice(),
    };
  }
}

/** Local smoothstep to avoid a circular import with the UI helpers. */
function smoothstepLocal(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

let singleton: SimulationEngine | null = null;

export function getEngine(): SimulationEngine {
  if (!singleton) singleton = new SimulationEngine();
  return singleton;
}
