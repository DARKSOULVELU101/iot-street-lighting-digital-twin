import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  tone?: "primary" | "success" | "warning" | "danger";
}

const toneClass: Record<NonNullable<ProgressProps["tone"]>, string> = {
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
};

export function Progress({
  value,
  max = 100,
  tone = "primary",
  className,
  ...props
}: ProgressProps) {
  const pct = Math.max(0, Math.min(100, (value / (max || 1)) * 100));
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-white/10", className)}
      {...props}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-500 ease-[var(--ease-out-expo)]", toneClass[tone])}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
