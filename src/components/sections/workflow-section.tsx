"use client";

import { ArrowRight } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/shared/reveal";
import { Section } from "@/components/shared/section";
import { WORKFLOW_STEPS } from "@/lib/data/project";

export function WorkflowSection() {
  return (
    <Section
      id="workflow"
      eyebrow="Control loop"
      title="Seven steps, every half second"
      description="The firmware loop that ties the sensors, the switch, the display and both cloud integrations together. Each step is mirrored by the simulation that drives this page."
    >
      <Stagger className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {WORKFLOW_STEPS.map((step, index) => (
          <StaggerItem key={step.id}>
            <article className="surface-card relative h-full p-5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-2xl font-semibold text-white/12">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="rounded-md border border-primary/25 bg-primary/8 px-2 py-1 font-mono text-[10px] text-primary/80">
                  {step.signal}
                </span>
              </div>
              <h3 className="mt-4 text-sm font-semibold text-white">{step.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-white/50">{step.detail}</p>
              {index < WORKFLOW_STEPS.length - 1 ? (
                <ArrowRight
                  className="absolute -right-3.5 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-white/15 lg:block"
                  aria-hidden="true"
                />
              ) : null}
            </article>
          </StaggerItem>
        ))}
      </Stagger>

      <Reveal delay={0.12}>
        <p className="mt-6 text-center text-sm text-white/40">
          Steps 1–4 run inside the ESP32. Steps 5–7 are what this website reproduces: the lamp
          state, the current check and the cloud publish.
        </p>
      </Reveal>
    </Section>
  );
}
