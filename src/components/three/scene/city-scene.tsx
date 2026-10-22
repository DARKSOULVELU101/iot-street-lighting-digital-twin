"use client";

import * as React from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { World, daylightFactor } from "./world";
import { StreetLights } from "./street-lights";
import { TrafficLayer } from "./traffic";
import { DustField } from "./particles";
import { Effects } from "./effects";
import { CameraRig } from "./camera-rig";

interface BoundaryProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
}

interface BoundaryState {
  failed: boolean;
}

/**
 * Keeps a WebGL failure inside one component of the page. If post-processing
 * or a GPU driver rejects the scene, the rest of the document keeps working.
 */
class SceneBoundary extends React.Component<BoundaryProps, BoundaryState> {
  override state: BoundaryState = { failed: false };

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true };
  }

  override componentDidCatch(error: unknown): void {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Digital twin scene failed to render:", error);
    }
  }

  override render(): React.ReactNode {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function SceneFog() {
  const scene = useThree((state) => state.scene);

  useFrame(() => {
    const day = daylightFactor();
    const fog = scene.fog as THREE.FogExp2 | null;
    if (!fog) return;
    fog.color.setRGB(
      0.02 + day * 0.16,
      0.03 + day * 0.21,
      0.09 + day * 0.29,
    );
    fog.density = 0.0038 - day * 0.0013;
  });

  return null;
}

function SceneContents({ effects }: { effects: boolean }) {
  return (
    <>
      <SceneFog />
      <World />
      <StreetLights />
      <TrafficLayer />
      <DustField />
      <CameraRig />
      {effects ? <Effects /> : null}
    </>
  );
}

export function CityScene() {
  return (
    <Canvas
      dpr={[1, 1.75]}
      frameloop="always"
      gl={{ antialias: true, powerPreference: "high-performance", alpha: false }}
      camera={{ position: [92, 62, 96], fov: 42, near: 0.5, far: 900 }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.08;
      }}
    >
      <fogExp2 attach="fog" args={["#050816", 0.0038]} />
      <SceneBoundary fallback={<SceneContents effects={false} />}>
        <SceneContents effects />
      </SceneBoundary>
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.06}
        minDistance={18}
        maxDistance={240}
        maxPolarAngle={1.45}
        target={[0, 0, 0]}
      />
    </Canvas>
  );
}
