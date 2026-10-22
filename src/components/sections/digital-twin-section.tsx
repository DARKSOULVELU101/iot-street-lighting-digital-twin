"use client";

import * as React from "react";
import { Boxes, Crosshair, Moon, RotateCcw, Sun, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/shared/reveal";
import { Section } from "@/components/shared/section";
import { CityCanvas } from "@/components/three/city-canvas";
import { focusCamera, resetCamera } from "@/components/three/scene/camera-rig";
import { CITY } from "@/lib/simulation/city";
import { useLightStore } from "@/store/light-store";
import { useSimulationStore } from "@/store/simulation-store";
import { useTrafficStore } from "@/store/traffic-store";

const FOCUS_POINTS = [
  { id: "overview", label: "Overview", x: 0, z: 0, distance: 118, height: 62 },
  { id: "node-a", label: "Node A", x: 0, z: 0, distance: 48, height: 26 },
  { id: "corridor", label: "Corridor", x: -40, z: -40, distance: 78, height: 40 },
  { id: "junction", label: "Junction", x: 20, z: 20, distance: 56, height: 30 },
] as const;

export function DigitalTwinSection() {
  const mode = useSimulationStore((state) => state.mode);
  const duty = useLightStore((state) => state.duty);
  const boosted = useLightStore((state) => state.boostedPoles);
  const total = useLightStore((state) => state.totalPoles);
  const vehicles = useTrafficStore((state) => state.vehicles);
  const pedestrians = useTrafficStore((state) => state.pedestrians);
  const emergency = useTrafficStore((state) => state.emergencyActive);

  const primaryPole = CITY.poles[CITY.primaryPoleId];

  const focus = React.useCallback((id: (typeof FOCUS_POINTS)[number]["id"]) => {
    const point = FOCUS_POINTS.find((item) => item.id === id);
    if (!point) return;
    if (id === "node-a" && primaryPole) {
      focusCamera(primaryPole.x, primaryPole.z, 46, 24);
      return;
    }
    focusCamera(point.x, point.z, point.distance, point.height);
  }, [primaryPole]);

  return (
    <Section
      id="digital-twin"
      eyebrow="Live simulation"
      title="A working digital twin, not a video"
      description="Traffic, pedestrians and lamp state are produced by a deterministic engine running in the browser at a fixed 60 Hz step. The scene renders the engine state directly, so every vehicle on screen obeys the same signal logic and every lamp glow follows the same duty cycle as the firmware."
    >
      <Reveal>
        <div className="surface-card relative overflow-hidden">
          <div className="relative h-[520px] w-full sm:h-[620px] lg:h-[680px]">
            <CityCanvas />

            {/* Top-left readout */}
            <div className="pointer-events-none absolute left-4 top-4 flex flex-col gap-2 sm:left-5 sm:top-5">
              <div className="surface-raised flex items-center gap-3 px-3.5 py-2.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/70" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success" />
                </span>
                <span className="text-xs text-white/75">Engine running · 60 Hz</span>
              </div>
              <div className="surface-raised flex flex-wrap items-center gap-2 px-3.5 py-2.5">
                <Badge variant={mode === "DAY" ? "warning" : "primary"}>
                  {mode === "DAY" ? <Sun className="h-3 w-3" /> : <Moon className="h-3 w-3" />}
                  {mode}
                </Badge>
                <span className="tabular text-xs text-white/60">{duty}% duty</span>
                <span className="text-white/20">·</span>
                <span className="tabular text-xs text-white/60">
                  {boosted}/{total} poles lit
                </span>
              </div>
              {emergency ? (
                <div className="surface-raised flex items-center gap-2 border-danger/40 px-3.5 py-2.5">
                  <TrendingUp className="h-3.5 w-3.5 text-danger" />
                  <span className="text-xs text-danger">Priority vehicle · lamps boosted</span>
                </div>
              ) : null}
            </div>

            {/* Bottom-left traffic counters */}
            <div className="pointer-events-none absolute bottom-4 left-4 flex gap-2 sm:bottom-5 sm:left-5">
              <div className="surface-raised px-3.5 py-2.5">
                <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">Vehicles</p>
                <p className="tabular mt-0.5 text-base font-semibold text-white">{vehicles}</p>
              </div>
              <div className="surface-raised px-3.5 py-2.5">
                <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">People</p>
                <p className="tabular mt-0.5 text-base font-semibold text-white">{pedestrians}</p>
              </div>
            </div>

            {/* Right-hand camera controls */}
            <div className="absolute right-4 top-4 flex flex-col gap-1.5 sm:right-5 sm:top-5">
              <div className="surface-raised p-1.5">
                {FOCUS_POINTS.map((point) => (
                  <button
                    key={point.id}
                    type="button"
                    onClick={() => focus(point.id)}
                    className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[11px] text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white"
                  >
                    {point.id === "node-a" ? (
                      <Crosshair className="h-3.5 w-3.5 text-primary" />
                    ) : point.id === "overview" ? (
                      <RotateCcw className="h-3.5 w-3.5" />
                    ) : (
                      <Boxes className="h-3.5 w-3.5" />
                    )}
                    {point.label}
                  </button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="justify-start"
                onClick={() => {
                  resetCamera();
                }}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </Button>
            </div>

            {/* Legend */}
            <div className="pointer-events-none absolute bottom-4 right-4 hidden flex-col gap-1.5 rounded-[var(--radius-control)] border border-line bg-ink-950/70 px-3 py-2.5 backdrop-blur-md sm:flex">
              {[
                { colour: "#ffca7a", label: "Lamp at 30 % / 100 %" },
                { colour: "#22c55e", label: "Signal green" },
                { colour: "#f59e0b", label: "Signal amber" },
                { colour: "#ef4444", label: "Signal red / faulted pole" },
                { colour: "#00e5ff", label: "Monitored node A" },
              ].map((entry) => (
                <span key={entry.label} className="flex items-center gap-2 text-[10.5px] text-white/50">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: entry.colour, boxShadow: `0 0 8px ${entry.colour}` }}
                  />
                  {entry.label}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-line px-5 py-4 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p>
              Drag to orbit, scroll to zoom. The cyan beacon marks the monitored pole; its glow
              follows the commanded PWM duty cycle.
            </p>
            <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-white/30">
              16 nodes · 48 edges · 48 poles · 12 signals
            </p>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
