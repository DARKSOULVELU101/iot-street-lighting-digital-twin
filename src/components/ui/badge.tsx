import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wide",
  {
    variants: {
      variant: {
        neutral: "border-line-strong bg-white/[0.04] text-white/65",
        primary: "border-primary/35 bg-primary/10 text-primary",
        success: "border-success/35 bg-success/10 text-success",
        warning: "border-warning/35 bg-warning/10 text-warning",
        danger: "border-danger/35 bg-danger/10 text-danger",
        accent: "border-accent/35 bg-accent/10 text-accent",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
