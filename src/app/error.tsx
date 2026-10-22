"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-danger/70">Runtime error</p>
      <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
        Something went wrong
      </h1>
      <p className="max-w-md text-sm text-white/50">
        The digital twin failed to render. The page can be retried without losing the simulation
        state in memory.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="rounded-[var(--radius-control)] border border-line-strong bg-white/[0.03] px-4 py-2 text-sm text-white/80 transition-colors hover:text-white"
      >
        Try again
      </button>
    </main>
  );
}
