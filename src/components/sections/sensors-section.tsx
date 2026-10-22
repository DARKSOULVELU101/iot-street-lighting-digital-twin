"use client";

import * as React from "react";
import { Braces, Gauge, Radio, Waves } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Reveal } from "@/components/shared/reveal";
import { Section } from "@/components/shared/section";
import { LDR_DUSK_ADC, LDR_FULL_SCALE, DUTY_DIM, DUTY_FULL, DUTY_OFF } from "@/lib/simulation/constants";
import { useLightStore } from "@/store/light-store";
import { useSensorStore } from "@/store/sensor-store";

const FIRMWARE = `void controlStreetLight() {
  uint16_t ambientADC = readLDR();
  bool motionDetected = readPIR();

  if (ambientADC > DUSK_LIMIT) {
    setLamp(OFF, 0);            // DAY
  } else if (motionDetected) {
    setLamp(FULL, 100);         // NIGHT + movement
  } else {
    setLamp(DIM, 30);           // NIGHT, street is quiet
  }
}`;

const RULES = [
  { code: "CMD_OFF", condition: "Telegram /off received", duty: `${DUTY_OFF} %`, mode: "Override" },
  { code: "CMD_ON", condition: "Telegram /on received", duty: `${DUTY_FULL} %`, mode: "Override" },
  { code: "DAY_OFF", condition: `ADC > ${LDR_DUSK_ADC}`, duty: `${DUTY_OFF} %`, mode: "DAY" },
  {
    code: "NIGHT_MOTION",
    condition: `ADC ≤ ${LDR_DUSK_ADC} · PIR = 1`,
    duty: `${DUTY_FULL} %`,
    mode: "NIGHT",
  },
  {
    code: "NIGHT_IDLE",
    condition: `ADC ≤ ${LDR_DUSK_ADC} · PIR = 0`,
    duty: `${DUTY_DIM} %`,
    mode: "NIGHT",
  },
];

export function SensorsSection() {
  const ldrAdc = useSensorStore((state) => state.ldrAdc);
  const ldrLux = useSensorStore((state) => state.ldrLux);
  const ldrVoltage = useSensorStore((state) => state.ldrVoltage);
  const pir = useSensorStore((state) => state.pir);
  const currentAmps = useSensorStore((state) => state.currentAmps);
  const decision = useLightStore((state) => state.decision);

  const ldrPercent = (ldrAdc / LDR_FULL_SCALE) * 100;
  const expectedCurrent = decision ? (decision.duty <= 0 ? 0 : 0.0214 + 0.003286 * decision.duty) : 0;

  return (
    <Section
      id="sensors"
      title="Three inputs, one decision"
      description="The controller samples its sensors every 500 ms and maps them onto a five row policy. The values below are the live output of the simulated firmware, not a recording."
    >
      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="flex flex-col gap-4">
          <Reveal>
            <div className="surface-card p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-accent/30 bg-accent/10">
                    <Waves className="h-4 w-4 text-accent" />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-white">LDR · ambient light</h3>
                    <p className="font-mono text-[10.5px] text-white/35">GPIO34 · ADC1_CH6</p>
                  </div>
                </div>
                <Badge variant={ldrAdc > LDR_DUSK_ADC ? "warning" : "primary"}>
                  {ldrAdc > LDR_DUSK_ADC ? "DAY" : "NIGHT"}
                </Badge>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-4">
                <Metric label="ADC" value={ldrAdc.toFixed(0)} foot={`of ${LDR_FULL_SCALE}`} />
                <Metric label="Illuminance" value={ldrLux.toFixed(0)} foot="lux" />
                <Metric label="Sensor output" value={ldrVoltage.toFixed(2)} foot="V" />
              </div>

              <div className="mt-5">
                <Progress value={ldrPercent} tone={ldrAdc > LDR_DUSK_ADC ? "warning" : "primary"} />
                <div className="mt-2 flex justify-between font-mono text-[10px] text-white/30">
                  <span>0</span>
                  <span className="text-white/55">dusk limit {LDR_DUSK_ADC}</span>
                  <span>{LDR_FULL_SCALE}</span>
                </div>
              </div>
            </div>
          </Reveal>

          <div className="grid gap-4 sm:grid-cols-2">
            <Reveal delay={0.06}>
              <div className="surface-card h-full p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/30 bg-primary/10">
                      <Radio className="h-4 w-4 text-primary" />
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-white">PIR · presence</h3>
                      <p className="font-mono text-[10.5px] text-white/35">GPIO27 · HC-SR501</p>
                    </div>
                  </div>
                  <span
                    className={
                      pir
                        ? "flex h-2.5 w-2.5 rounded-full bg-success shadow-[0_0_12px_rgba(34,197,94,0.9)]"
                        : "h-2.5 w-2.5 rounded-full bg-white/20"
                    }
                  />
                </div>
                <p className="tabular mt-5 text-2xl font-semibold">
                  <span className={pir ? "text-success" : "text-white/70"}>
                    {pir ? "DETECTED" : "CLEAR"}
                  </span>
                </p>
                <p className="mt-2 text-xs leading-relaxed text-white/45">
                  A detection forces the lamp to {DUTY_FULL} % for the presence window, then it
                  falls back to the {DUTY_DIM} % idle level.
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="surface-card h-full p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-success/30 bg-success/10">
                      <Gauge className="h-4 w-4 text-success" />
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-white">ACS712 · load current</h3>
                      <p className="font-mono text-[10.5px] text-white/35">GPIO35 · ADC1_CH7</p>
                    </div>
                  </div>
                  <Badge variant={Math.abs(currentAmps - expectedCurrent) < 0.02 ? "success" : "danger"}>
                    {Math.abs(currentAmps - expectedCurrent) < 0.02 ? "VERIFIED" : "MISMATCH"}
                  </Badge>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-4">
                  <Metric label="Measured" value={currentAmps.toFixed(3)} foot="A" />
                  <Metric label="Expected" value={expectedCurrent.toFixed(3)} foot="A" />
                </div>
                <p className="mt-4 text-xs leading-relaxed text-white/45">
                  Closed-loop check: a lamp commanded to 100 % but drawing almost nothing is
                  reported as a fault instead of being trusted.
                </p>
              </div>
            </Reveal>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <Reveal delay={0.08}>
            <div className="surface-card overflow-hidden">
              <div className="border-b border-line px-5 py-4 sm:px-6">
                <h3 className="text-sm font-semibold text-white">Decision table</h3>
                <p className="mt-1 text-xs text-white/40">
                  Evaluated in order; the highlighted row produced the current output.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[460px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-line text-[10px] uppercase tracking-[0.14em] text-white/30">
                      <th className="px-5 py-2.5 font-medium sm:px-6">Rule</th>
                      <th className="px-3 py-2.5 font-medium">Condition</th>
                      <th className="px-3 py-2.5 font-medium">Duty</th>
                      <th className="px-5 py-2.5 text-right font-medium sm:px-6">Mode</th>
                    </tr>
                  </thead>
                  <tbody>
                    {RULES.map((rule) => {
                      const active = decision?.code === rule.code;
                      return (
                        <tr
                          key={rule.code}
                          className={
                            active
                              ? "border-b border-line bg-primary/[0.07] text-white"
                              : "border-b border-line text-white/55"
                          }
                        >
                          <td className="px-5 py-3 font-mono text-[11px] sm:px-6">
                            <span className={active ? "text-primary" : "text-white/45"}>
                              {rule.code}
                            </span>
                          </td>
                          <td className="px-3 py-3">{rule.condition}</td>
                          <td className="tabular px-3 py-3">{rule.duty}</td>
                          <td className="px-5 py-3 text-right sm:px-6">
                            <span className={active ? "text-primary" : "text-white/40"}>
                              {rule.mode}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {decision ? (
                <div className="bg-white/[0.02] px-5 py-3.5 sm:px-6">
                  <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-white/30">
                    Active reason
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-white/60">{decision.reason}</p>
                </div>
              ) : null}
            </div>
          </Reveal>

          <Reveal delay={0.12}>
            <div className="surface-card overflow-hidden">
              <div className="flex items-center gap-2 border-b border-line px-5 py-3.5 sm:px-6">
                <Braces className="h-3.5 w-3.5 text-primary" />
                <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-white/40">
                  Arduino sketch · controlStreetLight()
                </span>
              </div>
              <pre className="overflow-x-auto px-5 py-4 font-mono text-[11px] leading-relaxed text-white/60 sm:px-6">
                <code>{FIRMWARE}</code>
              </pre>
            </div>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}

function Metric({ label, value, foot }: { label: string; value: string; foot: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.14em] text-white/35">{label}</p>
      <p className="tabular mt-1 flex items-baseline gap-1 text-lg font-semibold text-white">
        {value}
        <span className="text-[11px] font-normal text-white/35">{foot}</span>
      </p>
    </div>
  );
}
