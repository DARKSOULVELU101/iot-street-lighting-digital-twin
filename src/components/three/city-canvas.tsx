"use client";

import * as React from "react";
import dynamic from "next/dynamic";

/**
 * The 3D scene is loaded client side only. WebGL has no server renderer, and
 * the simulation itself is driven by a requestAnimationFrame loop that only
 * exists in the browser.
 */
const CityScene = dynamic(
  () => import("./scene/city-scene").then((module) => module.CityScene),
  {
    ssr: false,
    loading: () => <ScenePlaceholder />,
  },
);

function ScenePlaceholder() {
  return (
    <div className="absolute inset-0 grid place-items-center bg-[#050816]">
      <div className="flex flex-col items-center gap-3">
        <span className="relative flex h-12 w-12 items-center justify-center">
          <span className="absolute inset-0 rounded-full border border-primary/40" />
          <span className="absolute inset-2 animate-ping rounded-full border border-primary/60" />
          <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_18px_#00E5FF]" />
        </span>
        <p className="text-xs font-medium tracking-[0.22em] text-white/45 uppercase">
          Initialising digital twin
        </p>
      </div>
    </div>
  );
}

export function CityCanvas() {
  return (
    <div className="absolute inset-0">
      <CityScene />
    </div>
  );
}
