import * as React from "react";
import { cn } from "@/lib/utils";

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  id: string;
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  children: React.ReactNode;
  containerClassName?: string;
}

/**
 * Shared section shell. The heading block is stacked vertically so the
 * headline and the supporting paragraph always read as one message.
 */
export function Section({
  id,
  eyebrow,
  title,
  description,
  align = "left",
  children,
  className,
  containerClassName,
  ...props
}: SectionProps) {
  return (
    <section id={id} className={cn("relative py-20 sm:py-24 lg:py-28", className)} {...props}>
      <div className={cn("mx-auto w-full max-w-[1400px] px-5 sm:px-8", containerClassName)}>
        <header
          className={cn(
            "mb-10 flex max-w-3xl flex-col gap-3",
            align === "center" && "mx-auto items-center text-center",
          )}
        >
          {eyebrow ? (
            <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-primary/70">
              {eyebrow}
            </span>
          ) : null}
          <h2 className="text-3xl font-semibold tracking-tight text-gradient-title sm:text-4xl">
            {title}
          </h2>
          {description ? (
            <p className="text-base leading-relaxed text-white/55 sm:text-[1.05rem]">{description}</p>
          ) : null}
        </header>
        {children}
      </div>
    </section>
  );
}
