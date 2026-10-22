"use client";

import { Code2, Cpu, LayoutGrid } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/shared/reveal";
import { Section } from "@/components/shared/section";
import { TECH_STACK } from "@/lib/data/project";

const ICONS: Record<string, React.ElementType> = {
  cpu: Cpu,
  terminal: Code2,
  cloud: LayoutGrid,
  send: Code2,
  atom: Code2,
  layers: LayoutGrid,
  braces: Code2,
  wind: LayoutGrid,
  box: LayoutGrid,
  orbit: LayoutGrid,
  zap: Code2,
  database: LayoutGrid,
  chart: LayoutGrid,
  waves: LayoutGrid,
  component: LayoutGrid,
  layout: LayoutGrid,
  triangle: LayoutGrid,
};

export function TechStackSection() {
  return (
    <Section
      id="stack"
      title="Technology stack"
      description="A deliberate mix: embedded-grade firmware concepts paired with a modern, type-safe web stack to render the simulation and the report site."
    >
      <Stagger className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        {TECH_STACK.map((item) => {
          const Icon = ICONS[item.icon] ?? Code2;
          return (
            <StaggerItem key={item.name}>
              <article className="surface-card flex items-center gap-3 p-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-white/[0.04]">
                  <Icon className="h-4 w-4 text-primary" />
                </span>
                <div>
                  <p className="text-sm font-medium text-white">{item.name}</p>
                  <p className="text-xs text-white/40">{item.role}</p>
                </div>
              </article>
            </StaggerItem>
          );
        })}
      </Stagger>

      <Reveal delay={0.12}>
        <div className="mt-6 surface-card p-5 text-center sm:p-6">
          <p className="text-sm text-white/60">
            All geometry in the 3D scene is procedural. No GLB/GLTF assets were loaded or bundled.
            Textures are generated at runtime from seeded canvases.
          </p>
        </div>
      </Reveal>
    </Section>
  );
}
