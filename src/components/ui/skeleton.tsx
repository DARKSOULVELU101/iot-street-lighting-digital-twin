import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-lg bg-white/[0.06]", className)}
      aria-hidden="true"
      {...props}
    />
  );
}
