"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, BarChart3, Clock, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/shared/reveal";
import { Section } from "@/components/shared/section";
import { useAnalyticsStore } from "@/store/analytics-store";
import { useLightStore } from "@/store/light-store";
import { useSensorStore } from "@/store/sensor-store";

import type { TooltipContentProps } from "recharts";
import type { ValueType, NameType } from "recharts/types/component/DefaultTooltipContent";

function ChartTooltip(props: Partial<TooltipContentProps<ValueType, NameType>>) {
  const { active, payload, label } = props;
  if (!active || !payload?.length) return null;
  const item = payload[0];
  if (!item) return null;
  return (
    <div className="surface-raised px-3 py-2">
      <p className="font-mono text-[10px] text-white/40">{label}s</p>
      <p className="tabular mt-1 text-sm text-white">
        {typeof item.value === "number" ? item.value.toFixed(item.dataKey === "current" ? 3 : 1) : item.value}
        {item.dataKey === "current" ? " A" : item.dataKey === "power" ? " W" : " lux"}
      </p>
    </div>
  );
}

export function ThingspeakDashboard() {
  const samples = useAnalyticsStore((state) => state.samples);
  const energyWh = useAnalyticsStore((state) => state.energyWh);
  const power = useAnalyticsStore((state) => state.power);
  const decision = useLightStore((state) => state.decision);
  const currentAmps = useSensorStore((state) => state.currentAmps);
  const ldrLux = useSensorStore((state) => state.ldrLux);

  const chartData = React.useMemo(
    () =>
      samples.map((sample) => ({
        time: Math.round(sample.t),
        lux: sample.lux,
        current: sample.current,
        power: sample.power,
      })),
    [samples],
  );

  return (
    <Section
      id="dashboard"
      eyebrow="Cloud telemetry"
      title="ThingSpeak style live analytics"
      description="Six fields published every 15 seconds: ambient light, load current, supply voltage, instantaneous power, cumulative energy and lamp state. The charts below stream from the same simulation."
    >
      <div className="grid gap-4 md:grid-cols-4">
        <Reveal>
          <StatCard
            icon={Activity}
            label="Instant power"
            value={power.toFixed(1)}
            unit="W"
            foot="V × I"
          />
        </Reveal>
        <Reveal delay={0.05}>
          <StatCard
            icon={Zap}
            label="Cumulative energy"
            value={energyWh.toFixed(1)}
            unit="Wh"
            foot="Trapezoidal integral"
          />
        </Reveal>
        <Reveal delay={0.08}>
          <StatCard
            icon={BarChart3}
            label="Load current"
            value={currentAmps.toFixed(3)}
            unit="A"
            foot={`Duty ${decision?.duty ?? 0}%`}
          />
        </Reveal>
        <Reveal delay={0.11}>
          <StatCard
            icon={Clock}
            label="Ambient"
            value={ldrLux.toFixed(0)}
            unit="lux"
            foot={decision?.mode ?? "DAY"}
          />
        </Reveal>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Reveal delay={0.08}>
          <ChartPanel title="Field 1 · Ambient light (lux)" description="LDR mapped to illuminance">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="luxFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00E5FF" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#00E5FF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="time"
                  tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={ChartTooltip} />
                <Area
                  type="monotone"
                  dataKey="lux"
                  stroke="#00E5FF"
                  strokeWidth={1.6}
                  fill="url(#luxFill)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartPanel>
        </Reveal>

        <Reveal delay={0.12}>
          <ChartPanel title="Field 2 · Load current (A)" description="ACS712 reading vs commanded duty">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="curFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.24} />
                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="time"
                  tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 0.4]}
                />
                <Tooltip content={ChartTooltip} />
                <Area
                  type="monotone"
                  dataKey="current"
                  stroke="#22C55E"
                  strokeWidth={1.6}
                  fill="url(#curFill)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartPanel>
        </Reveal>
      </div>

      <Reveal delay={0.16}>
        <div className="mt-6 surface-card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
            <div>
              <h3 className="text-sm font-semibold text-white">ThingSpeak channel mapping</h3>
              <p className="mt-1 text-xs text-white/40">
                Fields written every 15 s by the simulated ESP32
              </p>
            </div>
            <Badge variant="neutral">Channel (simulated)</Badge>
          </div>
          <div className="grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-6">
            {[
              { field: "field1", label: "Ambient", value: `${ldrLux.toFixed(0)} lux` },
              { field: "field2", label: "Current", value: `${currentAmps.toFixed(3)} A` },
              { field: "field3", label: "Voltage", value: "12.00 V" },
              { field: "field4", label: "Power", value: `${power.toFixed(1)} W` },
              { field: "field5", label: "Energy", value: `${energyWh.toFixed(1)} Wh` },
              { field: "field6", label: "Lamp", value: decision && decision.duty > 0 ? "1" : "0" },
            ].map((item) => (
              <div key={item.field} className="bg-ink-950/80 px-4 py-4">
                <p className="font-mono text-[10.5px] text-primary/70">{item.field}</p>
                <p className="mt-1 text-sm text-white/80">{item.label}</p>
                <p className="tabular mt-1.5 text-base font-semibold text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </Section>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  unit,
  foot,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  unit: string;
  foot: string;
}) {
  return (
    <article className="surface-card p-5">
      <div className="flex items-center justify-between">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-white/[0.04]">
          <Icon className="h-4 w-4 text-primary" />
        </span>
        <span className="tabular text-xs text-white/40">{foot}</span>
      </div>
      <p className="mt-4 text-[10px] uppercase tracking-[0.14em] text-white/35">{label}</p>
      <p className="tabular mt-1.5 flex items-baseline gap-1.5 text-2xl font-semibold text-white">
        {value}
        <span className="text-[12px] font-normal text-white/35">{unit}</span>
      </p>
    </article>
  );
}

function ChartPanel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="surface-card flex h-[320px] flex-col overflow-hidden">
      <div className="border-b border-line px-5 py-4">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <p className="mt-1 text-xs text-white/40">{description}</p>
      </div>
      <div className="flex-1 px-2 py-2">{children}</div>
    </div>
  );
}
