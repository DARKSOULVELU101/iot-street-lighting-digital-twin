import { GitFork } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TECH_STACK } from "@/lib/data/project";

const GITHUB_URL = "https://github.com/";

const CREDITS = [
  { role: "Firmware", name: "ESP32 · Arduino" },
  { role: "Cloud", name: "ThingSpeak · Telegram" },
  { role: "Frontend", name: "Next.js · React 19" },
  { role: "3D", name: "Three.js · React Three Fiber" },
];

export function SiteFooter() {
  return (
    <footer className="relative border-t border-line bg-ink-950">
      <div className="mx-auto w-full max-w-[1400px] px-5 py-14 sm:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-semibold tracking-tight text-white">
              IoT Enabled Street Lighting Management System
            </h3>
            <p className="max-w-md text-sm leading-relaxed text-white/50">
              A digital twin of an ESP32 based adaptive street light: 3D city, traffic
              simulation, live sensor telemetry, ThingSpeak style analytics, Telegram control
              and automatic fault recovery.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button asChild size="sm">
                <a href="#digital-twin">Live demo</a>
              </Button>
              <Button asChild variant="outline" size="sm">
                <a href="#report">Documentation</a>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <a href={GITHUB_URL} target="_blank" rel="noreferrer noopener">
                  <GitFork className="h-3.5 w-3.5" />
                  GitHub
                </a>
              </Button>
            </div>
          </div>

          <div>
            <h4 className="text-[11px] uppercase tracking-[0.18em] text-white/35">Technology credits</h4>
            <ul className="mt-4 flex flex-col gap-2.5">
              {CREDITS.map((credit) => (
                <li key={credit.role} className="flex items-baseline justify-between gap-4 text-sm">
                  <span className="text-white/40">{credit.role}</span>
                  <span className="text-right text-white/70">{credit.name}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[11px] uppercase tracking-[0.18em] text-white/35">Built with</h4>
            <ul className="mt-4 flex flex-wrap gap-2">
              {TECH_STACK.slice(0, 12).map((tech) => (
                <li
                  key={tech.name}
                  className="rounded-full border border-line bg-white/[0.03] px-2.5 py-1 text-[11px] text-white/55"
                >
                  {tech.name}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-line pt-6 text-xs text-white/35 sm:flex-row sm:items-center sm:justify-between">
          <p>Final-year engineering project · Smart City IoT · Digital twin demonstration</p>
          <p>Simulation only — no live device is connected to this page.</p>
        </div>
      </div>
    </footer>
  );
}
