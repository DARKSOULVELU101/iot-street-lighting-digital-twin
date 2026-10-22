export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex items-center gap-3">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/70" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
        </span>
        <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-white/40">
          Initialising digital twin
        </p>
      </div>
    </div>
  );
}
