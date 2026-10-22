"use client";

import * as React from "react";
import { motion, useReducedMotion, type HTMLMotionProps, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";

type RevealDirection = "up" | "down" | "left" | "right" | "none";

const offsetFor = (direction: RevealDirection): { x: number; y: number } => {
  switch (direction) {
    case "up":
      return { x: 0, y: 26 };
    case "down":
      return { x: 0, y: -26 };
    case "left":
      return { x: 32, y: 0 };
    case "right":
      return { x: -32, y: 0 };
    default:
      return { x: 0, y: 0 };
  }
};

export type RevealProps = HTMLMotionProps<"div"> & {
  direction?: RevealDirection;
  delay?: number;
  duration?: number;
  once?: boolean;
};

/** Scroll triggered reveal that collapses to a plain fade when motion is reduced. */
export function Reveal({
  children,
  className,
  direction = "up",
  delay = 0,
  duration = 0.7,
  once = true,
  ...props
}: RevealProps) {
  const reduce = useReducedMotion();
  const offset = offsetFor(direction);

  const variants: Variants = {
    hidden: reduce
      ? { opacity: 0 }
      : { opacity: 0, x: offset.x, y: offset.y },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration: reduce ? 0.25 : duration,
        delay: reduce ? 0 : delay,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  return (
    <motion.div
      className={cn(className)}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount: 0.25 }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export type StaggerProps = HTMLMotionProps<"div"> & {
  children: React.ReactNode;
  stagger?: number;
  delay?: number;
};

export function Stagger({ children, className, stagger = 0.07, delay = 0, ...props }: StaggerProps) {
  const reduce = useReducedMotion();
  const variants: Variants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: reduce ? 0 : stagger, delayChildren: reduce ? 0 : delay },
    },
  };

  return (
    <motion.div
      className={cn(className)}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export type StaggerItemProps = HTMLMotionProps<"div"> & {
  children?: React.ReactNode;
};

export function StaggerItem({ children, className, ...props }: StaggerItemProps) {
  const reduce = useReducedMotion();
  const variants: Variants = {
    hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 18 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: reduce ? 0.25 : 0.55, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <motion.div className={cn(className)} variants={variants} {...props}>
      {children}
    </motion.div>
  );
}
