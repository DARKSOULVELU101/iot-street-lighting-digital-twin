"use client";

import * as React from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { CITY } from "@/lib/simulation/city";
import { MAX_PEDESTRIANS, MAX_VEHICLES } from "@/lib/simulation/constants";
import { getEngine } from "@/lib/simulation/engine";
import { lerp } from "@/lib/utils";
import type { Axis, SignalPhase } from "@/lib/simulation/types";

/* ------------------------------------------------------------- signals */

interface SignalHead {
  nodeId: number;
  axis: Axis;
  x: number;
  z: number;
  yaw: number;
  lamps: { red: THREE.Vector3; amber: THREE.Vector3; green: THREE.Vector3 };
}

const SIGNAL_HEADS: SignalHead[] = (() => {
  const heads: SignalHead[] = [];
  const local = new THREE.Vector3();

  for (const node of CITY.nodes) {
    if (!node.signalized) continue;

    const configs: { axis: Axis; x: number; z: number; yaw: number }[] = [
      // Controls the southbound lane: placed on the near right-hand kerb.
      { axis: "NS", x: node.x - 9.6, z: node.z - 11.5, yaw: 0 },
      // Controls the eastbound lane.
      { axis: "EW", x: node.x - 11.5, z: node.z + 9.6, yaw: Math.PI / 2 },
    ];

    for (const config of configs) {
      const lamps = { red: new THREE.Vector3(), amber: new THREE.Vector3(), green: new THREE.Vector3() };
      const offsets: [keyof typeof lamps, number][] = [
        ["red", 0.44],
        ["amber", 0],
        ["green", -0.44],
      ];
      for (const [key, height] of offsets) {
        local.set(0, height, -0.2).applyAxisAngle(new THREE.Vector3(0, 1, 0), config.yaw);
        lamps[key] = new THREE.Vector3(config.x + local.x, 4.35 + height, config.z + local.z);
      }
      heads.push({ nodeId: node.id, axis: config.axis, x: config.x, z: config.z, yaw: config.yaw, lamps });
    }
  }
  return heads;
})();

const SIGNAL_COLOURS = {
  RED: new THREE.Color("#ff3b30"),
  AMBER: new THREE.Color("#ffb020"),
  GREEN: new THREE.Color("#2ee07a"),
};
const DIM_LAMP = new THREE.Color(0.03, 0.03, 0.04);

function lampStateFor(phase: SignalPhase, axis: Axis): "RED" | "AMBER" | "GREEN" {
  if (phase === "ALL_RED") return "RED";
  if (phase === `${axis}_GREEN`) return "GREEN";
  if (phase === `${axis}_AMBER`) return "AMBER";
  return "RED";
}

function TrafficSignals() {
  const poles = React.useRef<THREE.InstancedMesh>(null);
  const housings = React.useRef<THREE.InstancedMesh>(null);
  const red = React.useRef<THREE.InstancedMesh>(null);
  const amber = React.useRef<THREE.InstancedMesh>(null);
  const green = React.useRef<THREE.InstancedMesh>(null);

  const poleGeometry = React.useMemo(() => new THREE.CylinderGeometry(0.1, 0.14, 4.6, 6), []);
  const housingGeometry = React.useMemo(() => new THREE.BoxGeometry(0.46, 1.36, 0.34), []);
  const lampGeometry = React.useMemo(() => new THREE.SphereGeometry(0.14, 10, 8), []);
  const poleMaterial = React.useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#232a3d", roughness: 0.7, metalness: 0.4 }),
    [],
  );
  const housingMaterial = React.useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#15192a", roughness: 0.65, metalness: 0.35 }),
    [],
  );
  const lampMaterial = React.useMemo(
    () => new THREE.MeshBasicMaterial({ color: "#ffffff", toneMapped: false }),
    [],
  );

  const scratch = React.useMemo(
    () => ({
      matrix: new THREE.Matrix4(),
      quaternion: new THREE.Quaternion(),
      position: new THREE.Vector3(),
      scale: new THREE.Vector3(1, 1, 1),
      euler: new THREE.Euler(),
      colour: new THREE.Color(),
    }),
    [],
  );

  React.useEffect(() => {
    const { matrix, quaternion, position, scale, euler } = scratch;
    SIGNAL_HEADS.forEach((head, index) => {
      euler.set(0, head.yaw, 0);
      quaternion.setFromEuler(euler);
      position.set(head.x, 2.3, head.z);
      matrix.compose(position, quaternion, scale);
      poles.current?.setMatrixAt(index, matrix);
      position.set(head.x, 4.35, head.z);
      matrix.compose(position, quaternion, scale);
      housings.current?.setMatrixAt(index, matrix);

      red.current?.setColorAt(index, new THREE.Color(0, 0, 0));
      amber.current?.setColorAt(index, new THREE.Color(0, 0, 0));
      green.current?.setColorAt(index, new THREE.Color(0, 0, 0));
    });
    if (poles.current) poles.current.instanceMatrix.needsUpdate = true;
    if (housings.current) housings.current.instanceMatrix.needsUpdate = true;
    if (red.current?.instanceColor) red.current.instanceColor.needsUpdate = true;
    if (amber.current?.instanceColor) amber.current.instanceColor.needsUpdate = true;
    if (green.current?.instanceColor) green.current.instanceColor.needsUpdate = true;
  }, [scratch]);

  useFrame(() => {
    const engine = getEngine();
    const { matrix, quaternion, position, scale, euler, colour } = scratch;
    const signalIndex = new Map<number, number>();
    engine.signals.forEach((signal, index) => signalIndex.set(signal.nodeId, index));

    const write = (
      mesh: typeof red,
      point: THREE.Vector3,
      active: boolean,
      tint: THREE.Color,
      index: number,
    ) => {
      position.copy(point);
      matrix.compose(position, quaternion, scale);
      mesh.current?.setMatrixAt(index, matrix);
      colour.copy(active ? tint : DIM_LAMP);
      mesh.current?.setColorAt(index, colour);
    };

    SIGNAL_HEADS.forEach((head, index) => {
      const signal = engine.signals[signalIndex.get(head.nodeId) ?? -1];
      const state = signal ? lampStateFor(signal.phase, head.axis) : "RED";

      euler.set(0, head.yaw, 0);
      quaternion.setFromEuler(euler);

      write(red, head.lamps.red, state === "RED", SIGNAL_COLOURS.RED, index);
      write(amber, head.lamps.amber, state === "AMBER", SIGNAL_COLOURS.AMBER, index);
      write(green, head.lamps.green, state === "GREEN", SIGNAL_COLOURS.GREEN, index);
    });

    for (const mesh of [red, amber, green]) {
      if (mesh.current?.instanceColor) mesh.current.instanceColor.needsUpdate = true;
      if (mesh.current) mesh.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      <instancedMesh ref={poles} args={[poleGeometry, poleMaterial, SIGNAL_HEADS.length]} />
      <instancedMesh ref={housings} args={[housingGeometry, housingMaterial, SIGNAL_HEADS.length]} />
      <instancedMesh ref={red} args={[lampGeometry, lampMaterial, SIGNAL_HEADS.length]} />
      <instancedMesh ref={amber} args={[lampGeometry, lampMaterial, SIGNAL_HEADS.length]} />
      <instancedMesh ref={green} args={[lampGeometry, lampMaterial, SIGNAL_HEADS.length]} />
    </group>
  );
}

/* ------------------------------------------------------------- vehicles */

const CAR_COLOURS = [
  "#d9564f",
  "#3f7bd9",
  "#dfe5f2",
  "#2fbf9b",
  "#f0a63c",
  "#8a63d2",
  "#39415c",
  "#c9d1e0",
  "#79d7f2",
];
const EMERGENCY_COLOUR = "#ff2f45";

function Vehicles() {
  const carBody = React.useRef<THREE.InstancedMesh>(null);
  const carCabin = React.useRef<THREE.InstancedMesh>(null);
  const carWheels = React.useRef<THREE.InstancedMesh>(null);
  const bikeBody = React.useRef<THREE.InstancedMesh>(null);
  const bikeRider = React.useRef<THREE.InstancedMesh>(null);
  const bikeWheels = React.useRef<THREE.InstancedMesh>(null);
  const lightBar = React.useRef<THREE.InstancedMesh>(null);

  const carBodyGeometry = React.useMemo(() => new THREE.BoxGeometry(1.9, 0.7, 4.2), []);
  const carCabinGeometry = React.useMemo(() => new THREE.BoxGeometry(1.66, 0.6, 2.1), []);
  const carWheelGeometry = React.useMemo(() => {
    const geometry = new THREE.CylinderGeometry(0.37, 0.37, 0.26, 10);
    geometry.rotateZ(Math.PI / 2);
    return geometry;
  }, []);
  const bikeBodyGeometry = React.useMemo(() => new THREE.BoxGeometry(0.52, 0.4, 1.7), []);
  const bikeRiderGeometry = React.useMemo(() => new THREE.BoxGeometry(0.46, 0.74, 0.46), []);
  const bikeWheelGeometry = React.useMemo(() => {
    const geometry = new THREE.CylinderGeometry(0.33, 0.33, 0.1, 8);
    geometry.rotateZ(Math.PI / 2);
    return geometry;
  }, []);
  const lightBarGeometry = React.useMemo(() => new THREE.BoxGeometry(1, 0.14, 0.34), []);

  const carMaterial = React.useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.42, metalness: 0.55 }),
    [],
  );
  const bikeMaterial = React.useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.5, metalness: 0.4 }),
    [],
  );
  const wheelMaterial = React.useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#0d1018", roughness: 0.95, metalness: 0.05 }),
    [],
  );
  const barMaterial = React.useMemo(
    () => new THREE.MeshBasicMaterial({ color: "#ffffff", toneMapped: false }),
    [],
  );

  const scratch = React.useMemo(
    () => ({
      matrix: new THREE.Matrix4(),
      quaternion: new THREE.Quaternion(),
      position: new THREE.Vector3(),
      scale: new THREE.Vector3(1, 1, 1),
      euler: new THREE.Euler(),
      colour: new THREE.Color(),
      base: new THREE.Color(),
    }),
    [],
  );

  React.useEffect(() => {
    const { colour } = scratch;
    for (let i = 0; i < MAX_VEHICLES; i += 1) {
      colour.setRGB(0, 0, 0);
      carBody.current?.setColorAt(i, colour);
      carCabin.current?.setColorAt(i, colour);
      bikeBody.current?.setColorAt(i, colour);
      bikeRider.current?.setColorAt(i, colour);
    }
    for (const mesh of [carBody, carCabin, bikeBody, bikeRider]) {
      if (mesh.current?.instanceColor) mesh.current.instanceColor.needsUpdate = true;
    }
  }, [scratch]);

  useFrame((state) => {
    const engine = getEngine();
    const { matrix, quaternion, position, scale, euler, colour, base } = scratch;
    const alpha = engine.alpha;

    let carIndex = 0;
    let wheelIndex = 0;
    let bikeIndex = 0;
    let bikeWheelIndex = 0;
    let emergencyIndex = 0;

    for (const vehicle of engine.vehicles) {
      const x = lerp(vehicle.px, vehicle.x, alpha);
      const z = lerp(vehicle.pz, vehicle.z, alpha);
      const heading = vehicle.pHeading + shortestAngle(vehicle.pHeading, vehicle.heading) * alpha;

      euler.set(0, heading, 0);
      quaternion.setFromEuler(euler);

      const isBike = vehicle.kind === "BIKE";
      const isEmergency = vehicle.kind === "EMERGENCY";

      if (isBike) {
        if (bikeIndex >= MAX_VEHICLES) continue;
        position.set(x, 0.62, z);
        matrix.compose(position, quaternion, scale);
        bikeBody.current?.setMatrixAt(bikeIndex, matrix);
        position.set(x, 1.18, z - 0.05);
        matrix.compose(position, quaternion, scale);
        bikeRider.current?.setMatrixAt(bikeIndex, matrix);

        base.set(CAR_COLOURS[vehicle.colour % CAR_COLOURS.length] ?? "#ffffff");
        bikeBody.current?.setColorAt(bikeIndex, base);
        base.multiplyScalar(0.7);
        bikeRider.current?.setColorAt(bikeIndex, base);
        bikeIndex += 1;

        for (const offset of [-0.55, 0.55]) {
          if (bikeWheelIndex >= MAX_VEHICLES * 2) break;
          position.set(x, 0.33, z);
          euler.set(0, heading, 0);
          quaternion.setFromEuler(euler);
          const wheelOffset = new THREE.Vector3(0, 0, offset).applyQuaternion(quaternion);
          position.add(wheelOffset);
          matrix.compose(position, quaternion, scale);
          bikeWheels.current?.setMatrixAt(bikeWheelIndex, matrix);
          bikeWheelIndex += 1;
        }
        continue;
      }

      if (carIndex >= MAX_VEHICLES) continue;
      position.set(x, 0.66, z);
      matrix.compose(position, quaternion, scale);
      carBody.current?.setMatrixAt(carIndex, matrix);
      position.set(x, 1.28, z - 0.15);
      matrix.compose(position, quaternion, scale);
      carCabin.current?.setMatrixAt(carIndex, matrix);

      if (isEmergency) {
        base.set(EMERGENCY_COLOUR);
        if (emergencyIndex < 6) {
          const flash = Math.sin(state.clock.elapsedTime * 12) > 0;
          position.set(x, 1.66, z - 0.15);
          matrix.compose(position, quaternion, scale);
          lightBar.current?.setMatrixAt(emergencyIndex, matrix);
          colour.setRGB(flash ? 1 : 0.15, flash ? 0.85 : 0.02, flash ? 0.85 : 0.06);
          lightBar.current?.setColorAt(emergencyIndex, colour);
          emergencyIndex += 1;
        }
      } else {
        base.set(CAR_COLOURS[vehicle.colour % CAR_COLOURS.length] ?? "#ffffff");
      }
      carBody.current?.setColorAt(carIndex, base);
      base.multiplyScalar(0.62);
      carCabin.current?.setColorAt(carIndex, base);
      carIndex += 1;

      for (const [ox, oz] of [
        [-0.86, 1.42],
        [0.86, 1.42],
        [-0.86, -1.42],
        [0.86, -1.42],
      ] as const) {
        if (wheelIndex >= MAX_VEHICLES * 4) break;
        euler.set(0, heading, 0);
        quaternion.setFromEuler(euler);
        const wheelOffset = new THREE.Vector3(ox, -0.31, oz).applyQuaternion(quaternion);
        position.set(x, 0.37, z).add(wheelOffset);
        matrix.compose(position, quaternion, scale);
        carWheels.current?.setMatrixAt(wheelIndex, matrix);
        wheelIndex += 1;
      }
    }

    if (carBody.current) {
      carBody.current.count = carIndex;
      carBody.current.instanceMatrix.needsUpdate = true;
      if (carBody.current.instanceColor) carBody.current.instanceColor.needsUpdate = true;
    }
    if (carCabin.current) {
      carCabin.current.count = carIndex;
      carCabin.current.instanceMatrix.needsUpdate = true;
      if (carCabin.current.instanceColor) carCabin.current.instanceColor.needsUpdate = true;
    }
    if (carWheels.current) {
      carWheels.current.count = wheelIndex;
      carWheels.current.instanceMatrix.needsUpdate = true;
    }
    if (bikeBody.current) {
      bikeBody.current.count = bikeIndex;
      bikeBody.current.instanceMatrix.needsUpdate = true;
      if (bikeBody.current.instanceColor) bikeBody.current.instanceColor.needsUpdate = true;
    }
    if (bikeRider.current) {
      bikeRider.current.count = bikeIndex;
      bikeRider.current.instanceMatrix.needsUpdate = true;
      if (bikeRider.current.instanceColor) bikeRider.current.instanceColor.needsUpdate = true;
    }
    if (bikeWheels.current) {
      bikeWheels.current.count = bikeWheelIndex;
      bikeWheels.current.instanceMatrix.needsUpdate = true;
    }
    if (lightBar.current) {
      lightBar.current.count = emergencyIndex;
      lightBar.current.instanceMatrix.needsUpdate = true;
      if (lightBar.current.instanceColor) lightBar.current.instanceColor.needsUpdate = true;
    }
  });

  return (
    <group>
      <instancedMesh ref={carBody} args={[carBodyGeometry, carMaterial, MAX_VEHICLES]} />
      <instancedMesh ref={carCabin} args={[carCabinGeometry, carMaterial, MAX_VEHICLES]} />
      <instancedMesh ref={carWheels} args={[carWheelGeometry, wheelMaterial, MAX_VEHICLES * 4]} />
      <instancedMesh ref={bikeBody} args={[bikeBodyGeometry, bikeMaterial, MAX_VEHICLES]} />
      <instancedMesh ref={bikeRider} args={[bikeRiderGeometry, bikeMaterial, MAX_VEHICLES]} />
      <instancedMesh ref={bikeWheels} args={[bikeWheelGeometry, wheelMaterial, MAX_VEHICLES * 2]} />
      <instancedMesh ref={lightBar} args={[lightBarGeometry, barMaterial, 6]} />
    </group>
  );
}

function shortestAngle(from: number, to: number): number {
  let delta = (to - from) % (Math.PI * 2);
  if (delta > Math.PI) delta -= Math.PI * 2;
  if (delta < -Math.PI) delta += Math.PI * 2;
  return delta;
}

/* ---------------------------------------------------------- pedestrians */

const WALKER_COLOURS = ["#8ec5ff", "#ffd08e", "#c6a5ff", "#9be8c4", "#ff9fb0", "#e4e8f2"];
const CROSSER_COLOURS = ["#00E5FF", "#8B5CF6"];

function Pedestrians() {
  const bodies = React.useRef<THREE.InstancedMesh>(null);
  const heads = React.useRef<THREE.InstancedMesh>(null);

  const capacity = MAX_PEDESTRIANS + 12;
  const bodyGeometry = React.useMemo(() => new THREE.CapsuleGeometry(0.26, 0.72, 4, 8), []);
  const headGeometry = React.useMemo(() => new THREE.SphereGeometry(0.17, 8, 6), []);
  const bodyMaterial = React.useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.85, metalness: 0 }),
    [],
  );
  const headMaterial = React.useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#d8b08c", roughness: 0.9, metalness: 0 }),
    [],
  );

  const scratch = React.useMemo(
    () => ({
      matrix: new THREE.Matrix4(),
      quaternion: new THREE.Quaternion(),
      position: new THREE.Vector3(),
      scale: new THREE.Vector3(1, 1, 1),
      euler: new THREE.Euler(),
      colour: new THREE.Color(),
    }),
    [],
  );

  useFrame(() => {
    const engine = getEngine();
    const { matrix, quaternion, position, scale, euler, colour } = scratch;
    const alpha = engine.alpha;
    let index = 0;

    const place = (x: number, z: number, heading: number, tint: string) => {
      if (index >= capacity) return;
      euler.set(0, heading, 0);
      quaternion.setFromEuler(euler);
      position.set(x, 0.78, z);
      matrix.compose(position, quaternion, scale);
      bodies.current?.setMatrixAt(index, matrix);
      position.set(x, 1.42, z);
      matrix.compose(position, quaternion, scale);
      heads.current?.setMatrixAt(index, matrix);
      colour.set(tint);
      bodies.current?.setColorAt(index, colour);
      index += 1;
    };

    for (const walker of engine.pedestrians) {
      const x = lerp(walker.px, walker.x, alpha);
      const z = lerp(walker.pz, walker.z, alpha);
      const heading = walker.heading;
      place(x, z, heading, WALKER_COLOURS[walker.id % WALKER_COLOURS.length] ?? "#ffffff");
    }

    for (const walker of engine.crosswalkers) {
      const x = lerp(walker.px, walker.x, alpha);
      const z = lerp(walker.pz, walker.z, alpha);
      const heading = walker.heading;
      const tint = walker.phase === "CROSSING" ? (CROSSER_COLOURS[0] ?? "#00E5FF") : (CROSSER_COLOURS[1] ?? "#8B5CF6");
      place(x, z, heading, tint);
    }

    if (bodies.current) {
      bodies.current.count = index;
      bodies.current.instanceMatrix.needsUpdate = true;
      if (bodies.current.instanceColor) bodies.current.instanceColor.needsUpdate = true;
    }
    if (heads.current) {
      heads.current.count = index;
      heads.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      <instancedMesh ref={bodies} args={[bodyGeometry, bodyMaterial, capacity]} />
      <instancedMesh ref={heads} args={[headGeometry, headMaterial, capacity]} />
    </group>
  );
}

export function TrafficLayer() {
  return (
    <group>
      <TrafficSignals />
      <Vehicles />
      <Pedestrians />
    </group>
  );
}
