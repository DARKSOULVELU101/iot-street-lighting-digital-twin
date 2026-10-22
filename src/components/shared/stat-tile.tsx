import * as React from "react";
import { cn } from "@/lib/utils";

export interface StatTileProps {
  label: string;
  value: React.ReactNode;
  unit?: string;
  hint?: React.ReactNode;
  tone?: "default" | "primary" | "success" | "warning" | "danger";
  className?: string;
}

const toneRing: Record<NonNullable<StatTileProps["tone"]>, string> = {
  default: "before:bg-white/30",
  primary: "before:bg-primary",
  success: "before:bg-success",
  warning: "before:bg-warning",
  danger: "before:bg-danger",
};

export function StatTile({
  label,
  value,
  unit,
  hint,
  tone = "default",
  className,
}: StatTileProps) {
  return (
    <div
      className={cn(
        "surface-card relative overflow-hidden px-4 py-3.5 before:absolute before:left-0 before:top-0 before:h-full before:w-[2px]",
        toneRing[tone],
        className,
      )}
    >
      <div className="text-[11px] uppercase tracking-[0.14em] text-white/40">{label}</div>
      <div className="mt-1.5 flex items-baseline gap-1.5">
        <span className="tabular text-2xl font-semibold text-white sm:text-[1.7rem]">{value}</span>
        {unit ? <span className="text-xs text-white/40">{unit}</span> : null}
      </div>
      {hint ? <div className="mt-1 text-xs leading-relaxed text-white/40">{hint}</div> : null}
    </div>
  );
}
