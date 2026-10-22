"use client";

import * as React from "react";
import { animate, useInView, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface CounterProps {
  value: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
}

/**
 * Counts up to the target value the first time it scrolls into view.
 * Under reduced motion the final value is rendered immediately.
 */
export function Counter({
  value,
  decimals = 0,
  suffix = "",
  prefix = "",
  duration = 1.4,
  className,
}: CounterProps) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const reduce = useReducedMotion();
  const [display, setDisplay] = React.useState(0);

  React.useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setDisplay(value);
      return;
    }
    const controls = animate(0, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => setDisplay(latest),
    });
    return () => controls.stop();
  }, [inView, value, duration, reduce]);

  return (
    <span ref={ref} className={cn("tabular", className)}>
      {prefix}
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
}
