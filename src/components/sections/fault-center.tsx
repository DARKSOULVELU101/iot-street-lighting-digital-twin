"use client";

import { AlertTriangle, RefreshCcw, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/shared/reveal";
import { Section } from "@/components/shared/section";
import { useFaultStore } from "@/store/fault-store";
import { useSimulationStore } from "@/store/simulation-store";

export function FaultCenter() {
  const faults = useFaultStore((state) => state.faults);
  const active = useFaultStore((state) => state.active);
  const lastTransition = useFaultStore((state) => state.lastTransition);
  const time = useSimulationStore((state) => state.time);

  return (
    <Section
      id="faults"
      eyebrow="Self healing"
      title="Fault detection and recovery"
      description="If the commanded duty is above 20 % but the measured current falls below 0.02 A for two consecutive samples, pole Node A is isolated: duty forced to zero, buzzer active and a Telegram alert is sent. Recovery is automatic after the fault window."
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Reveal>
          <div className="surface-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="h-4 w-4 text-warning" />
                <h3 className="text-sm font-semibold text-white">Live fault state</h3>
              </div>
              <Badge variant={active ? "danger" : "success"}>
                {active ? "FAULT ACTIVE" : "ALL CLEAR"}
              </Badge>
            </div>
            <div className="px-5 py-6 sm:px-6">
              {active ? (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-danger/40 bg-danger/12">
                      <AlertTriangle className="h-4.5 w-4.5 text-danger" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-white">Pole {active.poleId} (Node A)</p>
                      <p className="text-xs text-white/45">{active.reason}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Metric label="Severity" value={active.severity} foot="" />
                    <Metric
                      label="Remaining"
                      value={Math.max(0, active.endsAt - time).toFixed(0)}
                      foot="seconds"
                    />
                  </div>
                  <p className="text-xs leading-relaxed text-white/45">
                    The buzzer chirps locally, the lamp is forced to 0 %, current is monitored and
                    the fault closes automatically when the expected load returns.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-success/30 bg-success/10">
                    <RefreshCcw className="h-4.5 w-4.5 text-success" />
                  </span>
                  <p className="text-sm font-medium text-white">System healthy</p>
                  <p className="max-w-xs text-xs text-white/45">
                    No open faults. A fault is injected every ~45 seconds on Node A to demonstrate
                    detection and recovery.
                  </p>
                </div>
              )}
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="surface-card overflow-hidden">
            <div className="border-b border-line px-5 py-4">
              <h3 className="text-sm font-semibold text-white">Fault history</h3>
              <p className="mt-1 text-xs text-white/40">Last transition at {lastTransition.toFixed(0)} s</p>
            </div>
            <div className="max-h-[320px] overflow-y-auto">
              {faults.length === 0 ? (
                <p className="px-5 py-6 text-sm text-white/40">No faults recorded yet.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {faults.slice().reverse().map((fault) => (
                    <li key={fault.id} className="flex items-start gap-3 px-5 py-3">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-danger/70" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-white/80">Pole {fault.poleId}</p>
                          <p className="font-mono text-[10.5px] text-white/35">
                            {fault.startedAt.toFixed(0)} s – {fault.endsAt.toFixed(0)} s
                          </p>
                        </div>
                        <p className="mt-1 text-xs text-white/45">{fault.reason}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}

function Metric({ label, value, foot }: { label: string; value: string; foot: string }) {
  return (
    <div className="rounded-[var(--radius-control)] border border-line bg-white/[0.02] px-4 py-3">
      <p className="text-[10px] uppercase tracking-[0.14em] text-white/35">{label}</p>
      <p className="tabular mt-1 flex items-baseline gap-1 text-lg font-semibold text-white">
        {value}
        {foot ? <span className="text-[11px] font-normal text-white/35">{foot}</span> : null}
      </p>
    </div>
  );
}
