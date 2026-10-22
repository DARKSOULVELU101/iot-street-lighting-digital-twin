"use client";

import * as React from "react";
import { CircuitBoard, Cpu, Gauge, Radio, Server, Zap } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/shared/reveal";
import { Section } from "@/components/shared/section";
import { Stagger, StaggerItem } from "@/components/shared/reveal";
import { HARDWARE_COMPONENTS, type HardwareComponent } from "@/lib/data/components";
import { WiringSchematic } from "./wiring-schematic";

const CATEGORY_ICON: Record<HardwareComponent["category"], React.ElementType> = {
  Controller: Cpu,
  Sensor: Gauge,
  Actuator: Zap,
  Output: Radio,
  Cloud: Server,
};

const CATEGORY_VARIANT: Record<HardwareComponent["category"], "primary" | "accent" | "warning" | "success" | "neutral"> = {
  Controller: "primary",
  Sensor: "accent",
  Actuator: "warning",
  Output: "success",
  Cloud: "neutral",
};

const CATEGORIES = ["All", "Controller", "Sensor", "Actuator", "Output", "Cloud"] as const;

type CategoryFilter = (typeof CATEGORIES)[number];

export function ComponentLibrary() {
  const [filter, setFilter] = React.useState<CategoryFilter>("All");
  const [active, setActive] = React.useState<string>("esp32");

  const visible = React.useMemo(
    () =>
      filter === "All"
        ? HARDWARE_COMPONENTS
        : HARDWARE_COMPONENTS.filter((component) => component.category === filter),
    [filter],
  );

  return (
    <Section
      id="components"
      title="Ten modules, one controller"
      description="Every part of the prototype, why it was chosen and how it is wired. The bill of materials was kept deliberately small so the whole system fits on a single breadboard."
    >
      <Reveal>
        <div className="surface-card overflow-hidden p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <CircuitBoard className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-medium text-white">Prototype wiring</h3>
            </div>
            <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-white/35">
              ESP32 · ADC1 · LEDC · I2C
            </p>
          </div>
          <div className="mt-6">
            <WiringSchematic />
          </div>
        </div>
      </Reveal>

      <div className="mt-8 flex flex-wrap items-center gap-2">
        {CATEGORIES.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setFilter(category)}
            className={
              filter === category
                ? "rounded-full border border-primary/40 bg-primary/12 px-3.5 py-1.5 text-xs font-medium text-primary transition-colors"
                : "rounded-full border border-line bg-white/[0.02] px-3.5 py-1.5 text-xs font-medium text-white/50 transition-colors hover:border-line-strong hover:text-white/80"
            }
          >
            {category}
          </button>
        ))}
        <span className="ml-auto font-mono text-[11px] text-white/35">
          {visible.length} / {HARDWARE_COMPONENTS.length} modules
        </span>
      </div>

      <Stagger className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3" key={filter}>
        {visible.map((component) => {
          const Icon = CATEGORY_ICON[component.category];
          return (
            <StaggerItem key={component.id}>
              <ComponentCard component={component} Icon={Icon} />
            </StaggerItem>
          );
        })}
      </Stagger>

      <Reveal delay={0.1}>
        <div className="mt-8">
          <Accordion type="single" collapsible value={active} onValueChange={setActive}>
            {visible.map((component) => (
              <AccordionItem key={component.id} value={component.id}>
                <AccordionTrigger>
                  <span className="flex items-center gap-3">
                    <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-white/30">
                      {component.category}
                    </span>
                    <span className="text-white/90">{component.name}</span>
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <p className="text-[10.5px] uppercase tracking-[0.16em] text-primary/70">
                        Role in the system
                      </p>
                      <p className="mt-2">{component.role}</p>
                      <p className="mt-5 text-[10.5px] uppercase tracking-[0.16em] text-primary/70">
                        Why it was chosen
                      </p>
                      <ul className="mt-2 flex flex-col gap-1.5">
                        {component.whyUsed.map((reason) => (
                          <li key={reason} className="flex gap-2">
                            <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-primary/60" />
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-[10.5px] uppercase tracking-[0.16em] text-primary/70">
                        Key specifications
                      </p>
                      <dl className="mt-2 flex flex-col gap-1.5">
                        {component.specs.map((spec) => (
                          <div key={spec.label} className="flex justify-between gap-4">
                            <dt className="shrink-0 text-white/40">{spec.label}</dt>
                            <dd className="text-right text-white/75">{spec.value}</dd>
                          </div>
                        ))}
                      </dl>
                      {component.pins.length > 0 ? (
                        <>
                          <p className="mt-5 text-[10.5px] uppercase tracking-[0.16em] text-primary/70">
                            Pin assignment
                          </p>
                          <ul className="mt-2 flex flex-col gap-1">
                            {component.pins.map((pin) => (
                              <li
                                key={pin.signal}
                                className="flex flex-wrap items-baseline gap-x-2 font-mono text-[11px]"
                              >
                                <span className="text-white/45">{pin.signal}</span>
                                <span className="text-primary/80">{pin.pin}</span>
                                <span className="text-white/25">{pin.note}</span>
                              </li>
                            ))}
                          </ul>
                        </>
                      ) : null}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </Reveal>
    </Section>
  );
}

function ComponentCard({
  component,
  Icon,
}: {
  component: HardwareComponent;
  Icon: React.ElementType;
}) {
  return (
    <article className="surface-card group flex h-full flex-col p-5 transition-colors hover:border-primary/25">
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-white/[0.04] text-primary transition-colors group-hover:border-primary/30">
          <Icon className="h-4.5 w-4.5" />
        </span>
        <Badge variant={CATEGORY_VARIANT[component.category]}>{component.category}</Badge>
      </div>
      <h3 className="mt-4 text-[0.95rem] font-semibold tracking-tight text-white">
        {component.name}
      </h3>
      <p className="mt-1 font-mono text-[10.5px] tracking-[0.08em] text-white/35">
        {component.version}
      </p>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-white/55">{component.tagline}</p>
      <ul className="mt-4 flex flex-wrap gap-1.5">
        {component.advantages.slice(0, 2).map((advantage) => (
          <li
            key={advantage}
            className="rounded-md border border-line bg-white/[0.03] px-2 py-1 text-[10.5px] leading-tight text-white/45"
          >
            {advantage}
          </li>
        ))}
      </ul>
    </article>
  );
}
