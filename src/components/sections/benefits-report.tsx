"use client";

import { Award, BarChart, CheckCircle2, FileText } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/shared/reveal";
import { Section } from "@/components/shared/section";
import { BENEFITS, REPORT_MAPPING } from "@/lib/data/project";
import { Counter } from "@/components/shared/counter";

export function BenefitsSection() {
  return (
    <Section
      id="benefits"
      eyebrow="Outcomes"
      title="Measured advantages of adaptive control"
      description="Modelled from the decision table and the simulated duty profile. These are the figures the project demonstrates, not aspirational targets."
    >
      <Stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {BENEFITS.map((benefit) => (
          <StaggerItem key={benefit.id}>
            <article className="surface-card h-full p-5">
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/25 bg-primary/10">
                  <BarChart className="h-4 w-4 text-primary" />
                </span>
                <p className="tabular text-2xl font-semibold text-white">
                  <Counter value={benefit.value} suffix={benefit.suffix} />
                </p>
              </div>
              <p className="mt-3 text-sm font-medium text-white">{benefit.label}</p>
              <p className="mt-2 text-xs leading-relaxed text-white/45">{benefit.detail}</p>
              <p className="mt-3 font-mono text-[10px] text-white/30">{benefit.basis}</p>
            </article>
          </StaggerItem>
        ))}
      </Stagger>
    </Section>
  );
}

export function ReportMappingSection() {
  return (
    <Section
      id="report"
      eyebrow="Academic mapping"
      title="How this site maps to the final report"
      description="Every section of a standard final-year report is covered: abstract, introduction, literature review, hardware, design, implementation, results, conclusion and references. Use this as a checklist while writing."
    >
      <Reveal>
        <div className="surface-card overflow-hidden">
          <div className="flex items-center gap-2 border-b border-line px-5 py-4 sm:px-6">
            <FileText className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-white">Report outline mapping</h3>
          </div>
          <div className="divide-y divide-line">
            {REPORT_MAPPING.map((section) => (
              <article key={section.id} className="px-5 py-6 sm:px-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-primary/70">
                      {section.id}
                    </p>
                    <h4 className="mt-1.5 text-lg font-semibold tracking-tight text-white">
                      {section.title}
                    </h4>
                    <p className="mt-2 text-sm text-white/55">{section.summary}</p>
                  </div>
                  <Award className="hidden h-5 w-5 text-white/15 sm:block" />
                </div>
                <ul className="mt-4 flex flex-col gap-2">
                  {section.body.map((line) => (
                    <li key={line} className="flex gap-2 text-sm text-white/50">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success/80" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
                {section.table ? (
                  <div className="mt-5 overflow-x-auto rounded-[var(--radius-control)] border border-line">
                    <table className="w-full min-w-[520px] text-left text-xs">
                      <thead>
                        <tr className="bg-white/[0.02] text-[10px] uppercase tracking-[0.14em] text-white/35">
                          {section.table.head.map((head) => (
                            <th key={head} className="px-4 py-2.5 font-medium">
                              {head}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {section.table.rows.map((row) => (
                          <tr key={row.join("-")} className="border-t border-line">
                            {row.map((cell, index) => (
                              <td
                                key={cell}
                                className={
                                  index === 0
                                    ? "px-4 py-2.5 text-white/80"
                                    : "px-4 py-2.5 text-white/50"
                                }
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
