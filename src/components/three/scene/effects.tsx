"use client";

import * as React from "react";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";

/**
 * Post-processing stack.
 *
 * Bloom is what makes the lamp lenses, signal lamps and vehicle lights read as
 * emitters rather than flat coloured boxes. It is intentionally cheap: a
 * mip-map based bloom plus a single vignette pass.
 */
export function Effects() {
  return (
    <EffectComposer multisampling={4} enableNormalPass={false}>
      <Bloom
        mipmapBlur
        intensity={1.15}
        luminanceThreshold={0.22}
        luminanceSmoothing={0.32}
        radius={0.72}
      />
      <Vignette offset={0.24} darkness={0.82} />
    </EffectComposer>
  );
}
