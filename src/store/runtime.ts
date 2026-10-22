"use client";

import { useEffect } from "react";
import { getEngine, type EngineEvent, type SimulationEngine } from "@/lib/simulation/engine";
import { useAnalyticsStore } from "@/store/analytics-store";
import { useFaultStore } from "@/store/fault-store";
import { useLightStore } from "@/store/light-store";
import { useSensorStore } from "@/store/sensor-store";
import { useSimulationStore } from "@/store/simulation-store";
import { useTrafficStore } from "@/store/traffic-store";
import { useTelegramStore } from "@/store/telegram-store";

const PUBLISH_INTERVAL = 1 / 10;

let engine: SimulationEngine | null = null;
let frameHandle = 0;
let lastTimestamp = 0;
let publishAccumulator = 0;
let telemetryCursor = -1;
let mounted = 0;
let unsubscribe: (() => void) | null = null;

function ensureEngine(): SimulationEngine {
  if (!engine) engine = getEngine();
  return engine;
}

function handleEvent(event: EngineEvent): void {
  const telegram = useTelegramStore.getState();
  switch (event.type) {
    case "telegram-in":
      telegram.push({ role: "user", text: event.text, kind: "info" });
      break;
    case "telegram-out":
      telegram.push({ role: "bot", text: event.text, kind: event.kind });
      break;
    case "fault":
    case "recovery":
    case "log":
      break;
  }
}

function publish(): void {
  const active = ensureEngine();
  const snapshot = active.snapshot();

  useSimulationStore.setState({
    time: snapshot.time,
    mode: snapshot.mode,
    ambientOverride: snapshot.ambientOverride,
    command: snapshot.command,
  });

  useSensorStore.getState().sample({
    ldrAdc: snapshot.ldrAdc,
    ldrLux: snapshot.decision.ldrLux,
    ldrVoltage: snapshot.ldrVoltage,
    pir: snapshot.motion,
    currentAmps: snapshot.currentAmps,
  });

  useLightStore.getState().sample({
    brightness: snapshot.brightness,
    duty: snapshot.duty,
    lampMode: snapshot.lampMode,
    lampState: snapshot.lampState,
    boostedPoles: snapshot.boostedPoles,
    totalPoles: snapshot.totalPoles,
    zoneCurrent: snapshot.zoneCurrent,
    zonePower: snapshot.zonePower,
    decision: snapshot.decision,
  });

  useTrafficStore.getState().sample({
    vehicles: snapshot.vehicleCount,
    movingVehicles: snapshot.movingVehicles,
    pedestrians: snapshot.pedestrianCount,
    emergencyActive: snapshot.emergencyActive,
    signals: snapshot.signals,
  });

  useFaultStore.getState().sample(
    snapshot.faults,
    snapshot.activeFault,
    snapshot.activeFault ? snapshot.activeFault.startedAt : snapshot.time,
  );

  if (telemetryCursor !== snapshot.telemetry.length || snapshot.telemetry.length === 0) {
    telemetryCursor = snapshot.telemetry.length;
    useAnalyticsStore.getState().sample({
      samples: snapshot.telemetry,
      energyWh: snapshot.energyWh,
      power: snapshot.power,
    });
  }
}

function tick(timestamp: number): void {
  frameHandle = requestAnimationFrame(tick);
  if (lastTimestamp === 0) {
    lastTimestamp = timestamp;
    return;
  }
  const delta = (timestamp - lastTimestamp) / 1000;
  lastTimestamp = timestamp;
  if (document.hidden) return;

  const active = ensureEngine();
  try {
    active.advance(delta);
    publishAccumulator += delta;
    if (publishAccumulator >= PUBLISH_INTERVAL) {
      publishAccumulator = 0;
      publish();
    }
  } catch (error) {
    // Self-healing: rebuild the engine instead of showing a white screen.
    const message = error instanceof Error ? error.message : "Unknown simulation error";
    useSimulationStore.getState().setError(message);
    active.reset();
    publishAccumulator = 0;
    useSimulationStore.getState().registerRestart();
    useTelegramStore.getState().push({
      role: "bot",
      kind: "error",
      text: `Simulation watchdog: ${message}. Engine restarted from a clean state.`,
    });
  }
}

export function startRuntime(): void {
  if (frameHandle !== 0) return;
  const active = ensureEngine();
  if (!unsubscribe) {
    unsubscribe = active.subscribe(handleEvent);
  }
  lastTimestamp = 0;
  frameHandle = requestAnimationFrame(tick);
  publish();
}

export function stopRuntime(): void {
  if (frameHandle !== 0) {
    cancelAnimationFrame(frameHandle);
    frameHandle = 0;
  }
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
}

/**
 * Mounts the simulation runtime for the lifetime of the page.
 * The runtime is reference counted so React strict mode double mounts do not
 * create two animation loops.
 */
export function useSimulationRuntime(): void {
  useEffect(() => {
    mounted += 1;
    startRuntime();
    return () => {
      mounted -= 1;
      if (mounted <= 0) {
        mounted = 0;
        stopRuntime();
      }
    };
  }, []);
}
