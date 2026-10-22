"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-control)] text-sm font-medium transition-[transform,background-color,border-color,color,box-shadow] duration-200 ease-[var(--ease-out-expo)] disabled:pointer-events-none disabled:opacity-45 active:translate-y-px",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-ink-950 hover:bg-[#54efff] shadow-[0_0_0_1px_rgba(0,229,255,0.35),0_14px_38px_-18px_rgba(0,229,255,0.85)]",
        outline:
          "border border-line-strong bg-white/[0.03] text-white/80 hover:border-primary/60 hover:text-white",
        ghost: "text-white/60 hover:bg-white/[0.06] hover:text-white",
        danger: "border border-danger/40 bg-danger/10 text-danger hover:bg-danger/20",
        success: "border border-success/40 bg-success/10 text-success hover:bg-success/20",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4",
        lg: "h-12 px-6 text-[0.95rem]",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
