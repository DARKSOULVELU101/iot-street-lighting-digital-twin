import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-primary/70">404</p>
      <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
        Page not found
      </h1>
      <p className="max-w-md text-sm text-white/50">
        That route does not exist. Return to the overview to explore the IoT street lighting
        digital twin.
      </p>
      <Link
        href="/"
        className="rounded-[var(--radius-control)] border border-primary/40 bg-primary/10 px-4 py-2 text-sm text-primary transition-colors hover:bg-primary/15"
      >
        Back to home
      </Link>
    </main>
  );
}
