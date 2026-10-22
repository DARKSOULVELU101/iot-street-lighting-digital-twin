"use client";

import * as React from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { CITY } from "@/lib/simulation/city";
import { getEngine } from "@/lib/simulation/engine";
import { getParticleTexture } from "../assets/textures";

const POLE_HEIGHT = 9;
const ARM_LENGTH = 2.9;
const LIGHT_POOL_SIZE = 8;

interface PolePlacement {
  id: number;
  x: number;
  z: number;
  yaw: number;
  dirX: number;
  dirZ: number;
  headX: number;
  headZ: number;
  primary: boolean;
}

const PLACEMENTS: PolePlacement[] = CITY.poles.map((pole) => {
  const dirX = Math.sin(pole.yaw);
  const dirZ = Math.cos(pole.yaw);
  return {
    id: pole.id,
    x: pole.x,
    z: pole.z,
    yaw: pole.yaw,
    dirX,
    dirZ,
    headX: pole.x + dirX * ARM_LENGTH,
    headZ: pole.z + dirZ * ARM_LENGTH,
    primary: pole.primary,
  };
});

const WARM = new THREE.Color("#ffca7a");
const WARM_CORE = new THREE.Color("#fff0d2");

export function StreetLights() {
  const poles = React.useRef<THREE.InstancedMesh>(null);
  const arms = React.useRef<THREE.InstancedMesh>(null);
  const housings = React.useRef<THREE.InstancedMesh>(null);
  const lenses = React.useRef<THREE.InstancedMesh>(null);
  const halos = React.useRef<THREE.InstancedMesh>(null);
  const pools = React.useRef<THREE.InstancedMesh>(null);
  const lights = React.useRef<Array<THREE.PointLight | null>>([]);

  const poleGeometry = React.useMemo(() => new THREE.CylinderGeometry(0.13, 0.2, POLE_HEIGHT, 8), []);
  const armGeometry = React.useMemo(() => new THREE.BoxGeometry(0.11, 0.11, ARM_LENGTH), []);
  const housingGeometry = React.useMemo(() => new THREE.BoxGeometry(0.52, 0.22, 0.92), []);
  const lensGeometry = React.useMemo(() => new THREE.BoxGeometry(0.42, 0.06, 0.78), []);
  const haloGeometry = React.useMemo(() => new THREE.SphereGeometry(1, 10, 7), []);
  const poolGeometry = React.useMemo(() => new THREE.PlaneGeometry(1, 1), []);

  const poleMaterial = React.useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#2b3247", roughness: 0.7, metalness: 0.45 }),
    [],
  );
  const housingMaterial = React.useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#1b2033", roughness: 0.6, metalness: 0.5 }),
    [],
  );
  const lensMaterial = React.useMemo(
    () => new THREE.MeshBasicMaterial({ color: "#ffffff", toneMapped: false }),
    [],
  );
  const haloMaterial = React.useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#ffffff",
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    [],
  );
  const poolTexture = React.useMemo(() => getParticleTexture(), []);
  const poolMaterial = React.useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: poolTexture,
        color: "#ffffff",
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    [poolTexture],
  );

  React.useEffect(() => {
    const matrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion();
    const position = new THREE.Vector3();
    const scale = new THREE.Vector3(1, 1, 1);
    const euler = new THREE.Euler();

    PLACEMENTS.forEach((pole, index) => {
      euler.set(0, pole.yaw, 0);
      quaternion.setFromEuler(euler);

      position.set(pole.x, POLE_HEIGHT / 2, pole.z);
      matrix.compose(position, quaternion, scale);
      poles.current?.setMatrixAt(index, matrix);

      position.set(pole.x + pole.dirX * (ARM_LENGTH / 2), POLE_HEIGHT - 0.18, pole.z + pole.dirZ * (ARM_LENGTH / 2));
      matrix.compose(position, quaternion, scale);
      arms.current?.setMatrixAt(index, matrix);

      position.set(pole.headX, POLE_HEIGHT - 0.32, pole.headZ);
      matrix.compose(position, quaternion, scale);
      housings.current?.setMatrixAt(index, matrix);

      // Seed the instance colour buffers so the shader compiles with
      // instancing colours enabled from the very first frame.
      lenses.current?.setColorAt(index, new THREE.Color(0, 0, 0));
      halos.current?.setColorAt(index, new THREE.Color(0, 0, 0));
      pools.current?.setColorAt(index, new THREE.Color(0, 0, 0));
    });

    if (poles.current) poles.current.instanceMatrix.needsUpdate = true;
    if (arms.current) arms.current.instanceMatrix.needsUpdate = true;
    if (housings.current) housings.current.instanceMatrix.needsUpdate = true;
    if (lenses.current?.instanceColor) lenses.current.instanceColor.needsUpdate = true;
    if (halos.current?.instanceColor) halos.current.instanceColor.needsUpdate = true;
    if (pools.current?.instanceColor) pools.current.instanceColor.needsUpdate = true;
  }, []);

  const scratch = React.useMemo(
    () => ({
      matrix: new THREE.Matrix4(),
      quaternion: new THREE.Quaternion(),
      position: new THREE.Vector3(),
      scale: new THREE.Vector3(),
      euler: new THREE.Euler(),
      colour: new THREE.Color(),
    }),
    [],
  );

  const ranking = React.useRef<number[]>([]);

  useFrame((_state, delta) => {
    const engine = getEngine();
    const { matrix, quaternion, position, scale, euler, colour } = scratch;

    PLACEMENTS.forEach((pole, index) => {
      const lamp = engine.lamps[pole.id];
      const glow = lamp ? lamp.glow : 0;

      // Lens emissive colour.
      colour.copy(WARM).lerp(WARM_CORE, Math.min(1, glow)).multiplyScalar(0.25 + glow * 2.4);
      lenses.current?.setColorAt(index, colour);

      // Halo around the lamp head.
      euler.set(0, pole.yaw, 0);
      quaternion.setFromEuler(euler);
      position.set(pole.headX, POLE_HEIGHT - 0.42, pole.headZ);
      const haloScale = 0.25 + glow * 0.85;
      scale.set(haloScale, haloScale * 0.6, haloScale);
      matrix.compose(position, quaternion, scale);
      halos.current?.setMatrixAt(index, matrix);

      colour.copy(WARM).multiplyScalar(glow * 0.75);
      halos.current?.setColorAt(index, colour);

      // Light pool cast on the ground.
      euler.set(-Math.PI / 2, 0, 0);
      quaternion.setFromEuler(euler);
      position.set(pole.headX, 0.12, pole.headZ);
      const poolScale = 4 + glow * 22;
      scale.set(poolScale, poolScale, 1);
      matrix.compose(position, quaternion, scale);
      pools.current?.setMatrixAt(index, matrix);

      colour.copy(WARM).multiplyScalar(glow * 0.42);
      pools.current?.setColorAt(index, colour);
    });

    if (lenses.current?.instanceColor) lenses.current.instanceColor.needsUpdate = true;
    if (halos.current?.instanceColor) halos.current.instanceColor.needsUpdate = true;
    if (pools.current?.instanceColor) pools.current.instanceColor.needsUpdate = true;
    if (halos.current) halos.current.instanceMatrix.needsUpdate = true;
    if (pools.current) pools.current.instanceMatrix.needsUpdate = true;

    // Assign the pooled point lights to the brightest poles.
    const order = ranking.current;
    order.length = 0;
    for (const pole of PLACEMENTS) {
      const lamp = engine.lamps[pole.id];
      if (lamp && lamp.glow > 0.04) order.push(pole.id);
    }
    order.sort((a, b) => {
      const left = engine.lamps[a]?.glow ?? 0;
      const right = engine.lamps[b]?.glow ?? 0;
      return right - left;
    });

    const smoothing = Math.min(1, delta * 4);
    for (let i = 0; i < LIGHT_POOL_SIZE; i += 1) {
      const light = lights.current[i];
      if (!light) continue;
      const poleId = order[i];
      if (poleId === undefined) {
        light.intensity += (0 - light.intensity) * smoothing;
        continue;
      }
      const pole = PLACEMENTS[poleId];
      if (!pole) continue;
      light.position.x += (pole.headX - light.position.x) * smoothing;
      light.position.y += (POLE_HEIGHT - 0.6 - light.position.y) * smoothing;
      light.position.z += (pole.headZ - light.position.z) * smoothing;
      const lamp = engine.lamps[poleId];
      const target = (lamp?.glow ?? 0) * 95;
      light.intensity += (target - light.intensity) * smoothing;
    }
  });

  return (
    <group>
      <instancedMesh ref={poles} args={[poleGeometry, poleMaterial, PLACEMENTS.length]} />
      <instancedMesh ref={arms} args={[armGeometry, poleMaterial, PLACEMENTS.length]} />
      <instancedMesh ref={housings} args={[housingGeometry, housingMaterial, PLACEMENTS.length]} />
      <instancedMesh ref={lenses} args={[lensGeometry, lensMaterial, PLACEMENTS.length]} />
      <instancedMesh ref={halos} args={[haloGeometry, haloMaterial, PLACEMENTS.length]} />
      <instancedMesh ref={pools} args={[poolGeometry, poolMaterial, PLACEMENTS.length]} />
      {Array.from({ length: LIGHT_POOL_SIZE }, (_, index) => (
        <pointLight
          key={index}
          ref={(node) => {
            lights.current[index] = node;
          }}
          color="#ffc98a"
          intensity={0}
          distance={46}
          decay={1.6}
          position={[0, POLE_HEIGHT - 0.6, 0]}
        />
      ))}
      <PrimaryBeacon />
    </group>
  );
}

/** Pulsing ring that marks the monitored unit (ESP32 node A). */
function PrimaryBeacon() {
  const ring = React.useRef<THREE.Mesh>(null);
  const beam = React.useRef<THREE.Mesh>(null);

  const placement = React.useMemo(
    () => PLACEMENTS.find((pole) => pole.primary) ?? PLACEMENTS[0],
    [],
  );

  useFrame((state) => {
    const pulse = 0.5 + 0.5 * Math.sin(state.clock.elapsedTime * 2.6);
    if (ring.current) {
      ring.current.scale.setScalar(1 + pulse * 0.35);
      const material = ring.current.material as THREE.MeshBasicMaterial;
      material.opacity = 0.35 + pulse * 0.45;
    }
    if (beam.current) {
      const material = beam.current.material as THREE.MeshBasicMaterial;
      material.opacity = 0.08 + pulse * 0.1;
    }
  });

  if (!placement) return null;

  return (
    <group position={[placement.x, 0, placement.z]}>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.16, 0]}>
        <ringGeometry args={[1.5, 1.9, 32]} />
        <meshBasicMaterial
          color="#00E5FF"
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
      <mesh ref={beam} position={[0, 5, 0]}>
        <cylinderGeometry args={[0.16, 0.9, 10, 12, 1, true]} />
        <meshBasicMaterial
          color="#00E5FF"
          transparent
          opacity={0.12}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
