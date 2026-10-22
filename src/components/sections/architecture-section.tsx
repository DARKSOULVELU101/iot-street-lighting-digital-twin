"use client";

import { Layers, Network, Server, Settings } from "lucide-react";
import { Reveal } from "@/components/shared/reveal";
import { Section } from "@/components/shared/section";
import { ARCHITECTURE_LAYERS, WORKFLOW_STEPS } from "@/lib/data/project";

const ICONS = [Settings, Network, Server, Layers];

export function ArchitectureSection() {
  return (
    <Section
      id="architecture"
      title="Hardware, firmware logic, cloud and UI"
      description="Four layers stitched together so that a button press in Telegram propagates through the same policy that the ESP32 uses on the bench."
    >
      <Reveal>
        <div className="grid gap-4 lg:grid-cols-4">
          {ARCHITECTURE_LAYERS.map((layer, index) => {
            const Icon = ICONS[index] ?? Layers;
            return (
              <article key={layer.id} className="surface-card p-5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/25 bg-primary/10">
                  <Icon className="h-4 w-4 text-primary" />
                </span>
                <h3 className="mt-4 text-sm font-semibold text-white">{layer.label}</h3>
                <p className="mt-1 text-xs text-white/40">{layer.caption}</p>
                <ul className="mt-3 flex flex-col gap-1.5">
                  {layer.items.map((item) => (
                    <li key={item} className="text-sm text-white/50">
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </Reveal>

      <Reveal delay={0.08}>
        <div className="mt-6 surface-card overflow-hidden">
          <div className="border-b border-line px-5 py-4 sm:px-6">
            <h3 className="text-sm font-semibold text-white">End-to-end data flow</h3>
            <p className="mt-1 text-xs text-white/40">
              From a physical sensor reading to a rendered glow in the 3D scene
            </p>
          </div>
          <div className="grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-7">
            {WORKFLOW_STEPS.map((step, index) => (
              <div key={step.id} className="bg-ink-950/80 px-4 py-4">
                <span className="font-mono text-[10.5px] text-primary/70">0{index + 1}</span>
                <p className="mt-1.5 text-sm font-medium text-white">{step.title}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-white/45">{step.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
