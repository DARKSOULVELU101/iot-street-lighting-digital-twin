import { CircleCheck, CircleX, Sparkles } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/shared/reveal";
import { Section } from "@/components/shared/section";
import { PROBLEM_STATEMENT, SOLUTION_OVERVIEW } from "@/lib/data/project";

export function OverviewSection() {
  return (
    <Section
      id="overview"
      title="From a fixed timer to a closed control loop"
      description="Municipal lighting has not changed much in fifty years. The ESP32 based controller in this project replaces the timer with a measurement-driven policy that reacts in half a second."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <Reveal>
          <article className="surface-card h-full p-6 sm:p-8">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-danger/30 bg-danger/10">
                <CircleX className="h-4.5 w-4.5 text-danger" />
              </span>
              <h3 className="text-lg font-semibold tracking-tight text-white">
                {PROBLEM_STATEMENT.title}
              </h3>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-white/55">{PROBLEM_STATEMENT.body}</p>
            <Stagger className="mt-6 flex flex-col gap-3">
              {PROBLEM_STATEMENT.points.map((point) => (
                <StaggerItem key={point} className="flex items-start gap-2.5">
                  <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-danger/70" />
                  <span className="text-sm text-white/50">{point}</span>
                </StaggerItem>
              ))}
            </Stagger>
          </article>
        </Reveal>

        <Reveal delay={0.08}>
          <article className="surface-card relative h-full overflow-hidden p-6 sm:p-8">
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent"
              aria-hidden="true"
            />
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/30 bg-primary/10">
                <Sparkles className="h-4.5 w-4.5 text-primary" />
              </span>
              <h3 className="text-lg font-semibold tracking-tight text-white">
                {SOLUTION_OVERVIEW.title}
              </h3>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-white/55">{SOLUTION_OVERVIEW.body}</p>
            <Stagger className="mt-6 flex flex-col gap-3" delay={0.05}>
              {SOLUTION_OVERVIEW.points.map((point) => (
                <StaggerItem key={point} className="flex items-start gap-2.5">
                  <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  <span className="text-sm text-white/60">{point}</span>
                </StaggerItem>
              ))}
            </Stagger>
          </article>
        </Reveal>
      </div>

      <Reveal delay={0.12}>
        <div className="mt-6 grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line sm:grid-cols-3">
          {[
            {
              title: "Sense",
              body: "LDR, PIR and ACS712 are sampled every 500 ms on ADC1 and a dedicated GPIO.",
            },
            {
              title: "Decide",
              body: "A five row decision table maps the readings to a PWM duty of 0 %, 30 % or 100 %.",
            },
            {
              title: "Verify & report",
              body: "The measured current is compared with the commanded duty, then published to the cloud.",
            },
          ].map((step) => (
            <div key={step.title} className="bg-ink-950/80 px-6 py-7">
              <p className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-primary/70">
                {step.title}
              </p>
              <p className="mt-2.5 text-sm leading-relaxed text-white/55">{step.body}</p>
            </div>
          ))}
        </div>
      </Reveal>
    </Section>
  );
}
