"use client";

import * as React from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Rng } from "@/lib/simulation/prng";
import { getParticleTexture } from "../assets/textures";

const DUST_COUNT = 420;
const DUST_HEIGHT = 46;

/** Slow drifting dust motes that give the night air some depth. */
export function DustField() {
  const points = React.useRef<THREE.Points>(null);

  const geometry = React.useMemo(() => {
    const rng = new Rng(0xd0571);
    const positions = new Float32Array(DUST_COUNT * 3);
    const speeds = new Float32Array(DUST_COUNT);
    for (let i = 0; i < DUST_COUNT; i += 1) {
      positions[i * 3] = rng.range(-140, 140);
      positions[i * 3 + 1] = rng.range(1, DUST_HEIGHT);
      positions[i * 3 + 2] = rng.range(-140, 140);
      speeds[i] = rng.range(0.25, 1.1);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aSpeed", new THREE.BufferAttribute(speeds, 1));
    return geo;
  }, []);

  const material = React.useMemo(
    () =>
      new THREE.PointsMaterial({
        map: getParticleTexture(),
        color: "#8fd7ff",
        size: 0.5,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    [],
  );

  useFrame((_state, delta) => {
    const target = points.current;
    if (!target) return;
    const position = target.geometry.getAttribute("position") as THREE.BufferAttribute;
    const speeds = target.geometry.getAttribute("aSpeed") as THREE.BufferAttribute;
    const array = position.array as Float32Array;
    for (let i = 0; i < DUST_COUNT; i += 1) {
      const index = i * 3;
      array[index + 1] = (array[index + 1] ?? 0) + (speeds.getX(i) ?? 0.5) * delta * 1.4;
      array[index] = (array[index] ?? 0) + Math.sin(array[index + 1] ?? 0) * delta * 0.25;
      if ((array[index + 1] ?? 0) > DUST_HEIGHT) array[index + 1] = 0.5;
    }
    position.needsUpdate = true;
  });

  return <points ref={points} geometry={geometry} material={material} frustumCulled={false} />;
}
