"use client";

import * as React from "react";
import { Activity, ArrowDown, Cpu, RadioTower, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Reveal } from "@/components/shared/reveal";
import { Counter } from "@/components/shared/counter";
import { useLightStore } from "@/store/light-store";
import { useSensorStore } from "@/store/sensor-store";
import { useSimulationStore } from "@/store/simulation-store";

const HERO_STATS = [
  { label: "Street poles", value: 48, suffix: "", hint: "Two per street segment" },
  { label: "Telemetry fields", value: 6, suffix: "", hint: "Pushed every 15 s" },
  { label: "Control period", value: 500, suffix: " ms", hint: "Sensor sampling loop" },
];

export function HeroSection() {
  const mode = useSimulationStore((state) => state.mode);
  const time = useSimulationStore((state) => state.time);
  const ldrAdc = useSensorStore((state) => state.ldrAdc);
  const ldrLux = useSensorStore((state) => state.ldrLux);
  const pir = useSensorStore((state) => state.pir);
  const current = useSensorStore((state) => state.currentAmps);
  const duty = useLightStore((state) => state.duty);
  const brightness = useLightStore((state) => state.brightness);
  const lampMode = useLightStore((state) => state.lampMode);

  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);

  return (
    <section id="top" className="relative overflow-hidden pt-28 pb-16 sm:pt-36 lg:pb-24">
      <div className="pointer-events-none absolute inset-0 grid-backdrop opacity-60" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 radial-veil" aria-hidden="true" />
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-primary/10 blur-[130px]"
        aria-hidden="true"
      />

      <div className="relative mx-auto w-full max-w-[1400px] px-5 sm:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-[1.04fr_0.96fr]">
          <div>
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/[0.07] px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.2em] text-primary">
                <RadioTower className="h-3.5 w-3.5" />
                ESP32 · Smart city digital twin
              </span>
            </Reveal>

            <Reveal delay={0.06}>
              <h1 className="mt-6 text-[2.6rem] font-semibold leading-[1.04] tracking-tight text-white sm:text-6xl lg:text-[4.1rem]">
                Adaptive street lighting,
                <span className="block bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
                  simulated end to end.
                </span>
              </h1>
            </Reveal>

            <Reveal delay={0.12}>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-white/60 sm:text-lg">
                An ESP32 reads ambient light, presence and load current, then drives a 12 V LED
                lamp through hardware PWM. This page reproduces that loop: a live 3D city, real
                sensor telemetry, ThingSpeak style charts, Telegram control and automatic fault
                recovery.
              </p>
            </Reveal>

            <Reveal delay={0.18}>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Button asChild size="lg">
                  <a href="#digital-twin">
                    Open the digital twin
                    <ArrowDown className="h-4 w-4" />
                  </a>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <a href="#dashboard">
                    <Activity className="h-4 w-4" />
                    Live analytics
                  </a>
                </Button>
              </div>
            </Reveal>

            <Reveal delay={0.24}>
              <dl className="mt-12 grid max-w-xl grid-cols-3 gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line">
                {HERO_STATS.map((stat) => (
                  <div key={stat.label} className="bg-ink-950/80 px-4 py-4">
                    <dt className="text-[10.5px] uppercase tracking-[0.16em] text-white/40">
                      {stat.label}
                    </dt>
                    <dd className="tabular mt-1.5 text-2xl font-semibold text-white sm:text-[1.7rem]">
                      <Counter value={stat.value} suffix={stat.suffix} />
                    </dd>
                    <dd className="mt-1 text-[11px] leading-snug text-white/35">{stat.hint}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>

          <Reveal direction="left" delay={0.16}>
            <div className="surface-raised scanline relative overflow-hidden rounded-[var(--radius-card)] p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/30 bg-primary/10">
                    <Cpu className="h-4 w-4 text-primary" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-white">Node A · monitored pole</p>
                    <p className="font-mono text-[10.5px] tracking-[0.14em] text-white/35 uppercase">
                      Running {minutes}m {seconds.toString().padStart(2, "0")}s
                    </p>
                  </div>
                </div>
                <Badge variant={mode === "DAY" ? "warning" : "primary"}>
                  <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-beacon rounded-full bg-current" />
                  {mode}
                </Badge>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Readout
                  label="Ambient (LDR)"
                  value={ldrLux.toFixed(0)}
                  unit="lux"
                  foot={`ADC ${ldrAdc} · threshold 1150`}
                />
                <Readout
                  label="PIR presence"
                  value={pir ? "DETECTED" : "CLEAR"}
                  unit=""
                  foot="HC-SR501 · GPIO27"
                  tone={pir ? "success" : "muted"}
                />
                <Readout
                  label="PWM duty"
                  value={duty.toFixed(0)}
                  unit="%"
                  foot={`Lamp mode ${lampMode}`}
                  tone="primary"
                />
                <Readout
                  label="Load current"
                  value={current.toFixed(2)}
                  unit="A"
                  foot={`${(current * 12).toFixed(2)} W at 12 V`}
                  tone="accent"
                />
              </div>

              <div className="mt-6">
                <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-[0.14em] text-white/40">
                  <span>Rendered brightness</span>
                  <span className="tabular text-white/70">{brightness}%</span>
                </div>
                <Progress value={brightness} tone="primary" />
              </div>

              <div className="mt-6 flex items-center gap-2 border-t border-line pt-4 text-[11px] text-white/40">
                <Zap className="h-3.5 w-3.5 text-warning" />
                Duty is 0 % by day, 30 % at rest and 100 % while motion is detected.
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

interface ReadoutProps {
  label: string;
  value: string;
  unit: string;
  foot: string;
  tone?: "primary" | "success" | "accent" | "muted";
}

const READOUT_TONE: Record<NonNullable<ReadoutProps["tone"]>, string> = {
  primary: "text-primary",
  success: "text-success",
  accent: "text-accent",
  muted: "text-white/70",
};

function Readout({ label, value, unit, foot, tone = "muted" }: ReadoutProps) {
  return (
    <div className="rounded-[var(--radius-control)] border border-line bg-white/[0.025] px-4 py-3">
      <p className="text-[10.5px] uppercase tracking-[0.15em] text-white/40">{label}</p>
      <p className="tabular mt-1.5 flex items-baseline gap-1.5 text-xl font-semibold">
        <span className={READOUT_TONE[tone]}>{value}</span>
        {unit ? <span className="text-[11px] text-white/40">{unit}</span> : null}
      </p>
      <p className="mt-1 font-mono text-[10.5px] text-white/30">{foot}</p>
    </div>
  );
}
