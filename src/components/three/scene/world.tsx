"use client";

import * as React from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { CITY } from "@/lib/simulation/city";
import { GROUND_SIZE, ROAD_HALF_WIDTH, SIDEWALK_OFFSET } from "@/lib/simulation/constants";
import { getEngine } from "@/lib/simulation/engine";
import { Rng } from "@/lib/simulation/prng";
import { getGroundTexture, getRoadTexture, getWindowTexture } from "../assets/textures";

/** 0 = full night, 1 = full day, derived from the live LDR reading. */
export function daylightFactor(): number {
  const engine = getEngine();
  return THREE.MathUtils.clamp(engine.decision.ldrLux / 700, 0, 1);
}

/* ------------------------------------------------------------------ sky */

const SKY_VERTEX = /* glsl */ `
  varying vec3 vWorldPosition;
  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const SKY_FRAGMENT = /* glsl */ `
  varying vec3 vWorldPosition;
  uniform vec3 topColor;
  uniform vec3 horizonColor;
  uniform float dayFactor;
  void main() {
    float h = normalize(vWorldPosition).y;
    float base = pow(max(h, 0.0), 0.55);
    vec3 night = mix(horizonColor, topColor, base);
    vec3 dusk = mix(vec3(0.10, 0.12, 0.26), vec3(0.26, 0.40, 0.66), base);
    vec3 noon = mix(vec3(0.34, 0.50, 0.74), vec3(0.52, 0.72, 0.95), base);
    vec3 colour = mix(mix(night, dusk, smoothstep(0.0, 0.45, dayFactor)), noon, smoothstep(0.45, 1.0, dayFactor));
    gl_FragColor = vec4(colour, 1.0);
  }
`;

function Sky() {
  const material = React.useRef<THREE.ShaderMaterial>(null);

  const uniforms = React.useMemo(
    () => ({
      topColor: { value: new THREE.Color("#01030c") },
      horizonColor: { value: new THREE.Color("#101a38") },
      dayFactor: { value: 0 },
    }),
    [],
  );

  useFrame(() => {
    const factor = material.current?.uniforms.dayFactor;
    if (factor) factor.value = daylightFactor();
  });

  return (
    <mesh scale={[-1, 1, 1]} renderOrder={-1000} frustumCulled={false}>
      <sphereGeometry args={[420, 32, 20]} />
      <shaderMaterial
        ref={material}
        vertexShader={SKY_VERTEX}
        fragmentShader={SKY_FRAGMENT}
        uniforms={uniforms}
        depthWrite={false}
        side={THREE.FrontSide}
      />
    </mesh>
  );
}

function Stars() {
  const material = React.useRef<THREE.PointsMaterial>(null);

  const geometry = React.useMemo(() => {
    const rng = new Rng(0x57a25);
    const count = 700;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const theta = rng.range(0, Math.PI * 2);
      const phi = Math.acos(rng.range(0.02, 1));
      const radius = rng.range(240, 360);
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.cos(phi);
      positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  useFrame(() => {
    if (material.current) material.current.opacity = (1 - daylightFactor()) * 0.9;
  });

  return (
    <points geometry={geometry} frustumCulled={false}>
      <pointsMaterial
        ref={material}
        size={1.4}
        sizeAttenuation={false}
        color="#cfe4ff"
        transparent
        opacity={0}
        depthWrite={false}
      />
    </points>
  );
}

/* --------------------------------------------------------------- ground */

function Ground() {
  const texture = React.useMemo(() => {
    const map = getGroundTexture();
    map.repeat.set(14, 14);
    return map;
  }, []);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]}>
      <planeGeometry args={[GROUND_SIZE, GROUND_SIZE]} />
      <meshStandardMaterial map={texture} color="#0b1020" roughness={1} metalness={0} />
    </mesh>
  );
}

/* ---------------------------------------------------------------- roads */

interface Segment {
  ax: number;
  az: number;
  bx: number;
  bz: number;
  horizontal: boolean;
}

const SEGMENTS: Segment[] = (() => {
  const list: Segment[] = [];
  for (const node of CITY.nodes) {
    for (const dir of ["E", "S"] as const) {
      const edgeId = node.out[dir];
      if (edgeId < 0) continue;
      const edge = CITY.edges[edgeId];
      if (!edge) continue;
      const target = CITY.nodes[edge.to];
      if (!target) continue;
      list.push({
        ax: node.x,
        az: node.z,
        bx: target.x,
        bz: target.z,
        horizontal: dir === "E",
      });
    }
  }
  return list;
})();

function Roads() {
  const roadTexture = React.useMemo(() => {
    const cloned = getRoadTexture().clone();
    cloned.needsUpdate = true;
    cloned.wrapS = THREE.RepeatWrapping;
    cloned.wrapT = THREE.RepeatWrapping;
    cloned.repeat.set(3, 1);
    return cloned;
  }, []);

  const intersectionTexture = React.useMemo(() => {
    const cloned = getRoadTexture().clone();
    cloned.needsUpdate = true;
    cloned.wrapS = THREE.RepeatWrapping;
    cloned.wrapT = THREE.RepeatWrapping;
    cloned.repeat.set(1.4, 1.4);
    return cloned;
  }, []);

  const roadMaterial = React.useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: roadTexture,
        color: "#8f96ab",
        roughness: 0.92,
        metalness: 0.03,
      }),
    [roadTexture],
  );

  const intersectionMaterial = React.useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: intersectionTexture,
        color: "#8f96ab",
        roughness: 0.92,
        metalness: 0.03,
      }),
    [intersectionTexture],
  );

  const roadGeometry = React.useMemo(
    () => new THREE.PlaneGeometry(40, ROAD_HALF_WIDTH * 2),
    [],
  );
  const intersectionGeometry = React.useMemo(() => new THREE.PlaneGeometry(16, 16), []);

  const roads = React.useRef<THREE.InstancedMesh>(null);
  const intersections = React.useRef<THREE.InstancedMesh>(null);

  React.useEffect(() => {
    const matrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion();
    const position = new THREE.Vector3();
    const scale = new THREE.Vector3(1, 1, 1);
    const euler = new THREE.Euler();

    const roadMesh = roads.current;
    if (roadMesh) {
      SEGMENTS.forEach((segment, index) => {
        position.set((segment.ax + segment.bx) / 2, 0.02, (segment.az + segment.bz) / 2);
        euler.set(-Math.PI / 2, 0, segment.horizontal ? 0 : Math.PI / 2);
        quaternion.setFromEuler(euler);
        matrix.compose(position, quaternion, scale);
        roadMesh.setMatrixAt(index, matrix);
      });
      roadMesh.instanceMatrix.needsUpdate = true;
      roadMesh.computeBoundingSphere();
    }

    const intersectionMesh = intersections.current;
    if (intersectionMesh) {
      CITY.nodes.forEach((node, index) => {
        position.set(node.x, 0.035, node.z);
        euler.set(-Math.PI / 2, 0, 0);
        quaternion.setFromEuler(euler);
        matrix.compose(position, quaternion, scale);
        intersectionMesh.setMatrixAt(index, matrix);
      });
      intersectionMesh.instanceMatrix.needsUpdate = true;
      intersectionMesh.computeBoundingSphere();
    }
  }, []);

  return (
    <group>
      <instancedMesh
        ref={roads}
        args={[roadGeometry, roadMaterial, SEGMENTS.length]}
      />
      <instancedMesh
        ref={intersections}
        args={[intersectionGeometry, intersectionMaterial, CITY.nodes.length]}
      />
    </group>
  );
}

function Sidewalks() {
  const strips = React.useRef<THREE.InstancedMesh>(null);
  const corners = React.useRef<THREE.InstancedMesh>(null);

  const stripGeometry = React.useMemo(() => new THREE.BoxGeometry(40, 0.28, 5.2), []);
  const cornerGeometry = React.useMemo(() => new THREE.BoxGeometry(5.2, 0.28, 5.2), []);
  const material = React.useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#1c2239", roughness: 0.95, metalness: 0 }),
    [],
  );

  React.useEffect(() => {
    const matrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion();
    const position = new THREE.Vector3();
    const scale = new THREE.Vector3(1, 1, 1);
    const euler = new THREE.Euler();

    const stripMesh = strips.current;
    if (stripMesh) {
      let index = 0;
      for (const segment of SEGMENTS) {
        const mx = (segment.ax + segment.bx) / 2;
        const mz = (segment.az + segment.bz) / 2;
        const normalX = segment.horizontal ? 0 : 1;
        const normalZ = segment.horizontal ? 1 : 0;
        for (const side of [-1, 1]) {
          position.set(
            mx + normalX * side * (SIDEWALK_OFFSET + 0.4),
            0.14,
            mz + normalZ * side * (SIDEWALK_OFFSET + 0.4),
          );
          euler.set(0, segment.horizontal ? 0 : Math.PI / 2, 0);
          quaternion.setFromEuler(euler);
          matrix.compose(position, quaternion, scale);
          stripMesh.setMatrixAt(index, matrix);
          index += 1;
        }
      }
      stripMesh.count = index;
      stripMesh.instanceMatrix.needsUpdate = true;
      stripMesh.computeBoundingSphere();
    }

    const cornerMesh = corners.current;
    if (cornerMesh) {
      let index = 0;
      for (const node of CITY.nodes) {
        for (const sx of [-1, 1]) {
          for (const sz of [-1, 1]) {
            position.set(
              node.x + sx * (SIDEWALK_OFFSET + 0.4),
              0.14,
              node.z + sz * (SIDEWALK_OFFSET + 0.4),
            );
            euler.set(0, 0, 0);
            quaternion.setFromEuler(euler);
            matrix.compose(position, quaternion, scale);
            cornerMesh.setMatrixAt(index, matrix);
            index += 1;
          }
        }
      }
      cornerMesh.count = index;
      cornerMesh.instanceMatrix.needsUpdate = true;
      cornerMesh.computeBoundingSphere();
    }
  }, []);

  return (
    <group>
      <instancedMesh ref={strips} args={[stripGeometry, material, SEGMENTS.length * 2]} />
      <instancedMesh ref={corners} args={[cornerGeometry, material, CITY.nodes.length * 4]} />
    </group>
  );
}

function Markings() {
  const dashCount = SEGMENTS.length * 6;
  const stripeCount = CITY.signalNodeIds.length * 4 * 7;
  const dashes = React.useRef<THREE.InstancedMesh>(null);
  const stripes = React.useRef<THREE.InstancedMesh>(null);
  const edgeLines = React.useRef<THREE.InstancedMesh>(null);

  const dashGeometry = React.useMemo(() => new THREE.PlaneGeometry(2.6, 0.28), []);
  const stripeGeometry = React.useMemo(() => new THREE.PlaneGeometry(0.9, 5.6), []);
  const edgeGeometry = React.useMemo(() => new THREE.PlaneGeometry(40, 0.2), []);
  const dashMaterial = React.useMemo(
    () => new THREE.MeshBasicMaterial({ color: "#d9dde8", transparent: true, opacity: 0.42 }),
    [],
  );
  const stripeMaterial = React.useMemo(
    () => new THREE.MeshBasicMaterial({ color: "#eef1f7", transparent: true, opacity: 0.55 }),
    [],
  );
  const edgeMaterial = React.useMemo(
    () => new THREE.MeshBasicMaterial({ color: "#d9dde8", transparent: true, opacity: 0.22 }),
    [],
  );

  React.useEffect(() => {
    const matrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion();
    const position = new THREE.Vector3();
    const scale = new THREE.Vector3(1, 1, 1);
    const euler = new THREE.Euler();

    const dashMesh = dashes.current;
    if (dashMesh) {
      let index = 0;
      for (const segment of SEGMENTS) {
        const dx = (segment.bx - segment.ax) / 40;
        const dz = (segment.bz - segment.az) / 40;
        for (let i = 0; i < 6; i += 1) {
          const t = 3.6 + i * 6.4;
          position.set(segment.ax + dx * t, 0.06, segment.az + dz * t);
          euler.set(-Math.PI / 2, 0, segment.horizontal ? 0 : Math.PI / 2);
          quaternion.setFromEuler(euler);
          matrix.compose(position, quaternion, scale);
          dashMesh.setMatrixAt(index, matrix);
          index += 1;
        }
      }
      dashMesh.instanceMatrix.needsUpdate = true;
      dashMesh.computeBoundingSphere();
    }

    const stripeMesh = stripes.current;
    if (stripeMesh) {
      let index = 0;
      for (const node of CITY.nodes) {
        if (!node.signalized) continue;
        for (const approach of [0, 1, 2, 3]) {
          const alongRoad = approach % 2 === 0;
          const sign = approach < 2 ? -1 : 1;
          for (let i = 0; i < 7; i += 1) {
            const lateral = -5.4 + i * 1.8;
            const along = sign * 9.4;
            position.set(
              alongRoad ? node.x + lateral : node.x + along,
              0.065,
              alongRoad ? node.z + along : node.z + lateral,
            );
            euler.set(-Math.PI / 2, 0, alongRoad ? 0 : Math.PI / 2);
            quaternion.setFromEuler(euler);
            matrix.compose(position, quaternion, scale);
            stripeMesh.setMatrixAt(index, matrix);
            index += 1;
          }
        }
      }
      stripeMesh.count = index;
      stripeMesh.instanceMatrix.needsUpdate = true;
      stripeMesh.computeBoundingSphere();
    }

    const edgeMesh = edgeLines.current;
    if (edgeMesh) {
      let index = 0;
      for (const segment of SEGMENTS) {
        const mx = (segment.ax + segment.bx) / 2;
        const mz = (segment.az + segment.bz) / 2;
        const normalX = segment.horizontal ? 0 : 1;
        const normalZ = segment.horizontal ? 1 : 0;
        for (const side of [-1, 1]) {
          position.set(mx + normalX * side * 6.1, 0.055, mz + normalZ * side * 6.1);
          euler.set(-Math.PI / 2, 0, segment.horizontal ? 0 : Math.PI / 2);
          quaternion.setFromEuler(euler);
          matrix.compose(position, quaternion, scale);
          edgeMesh.setMatrixAt(index, matrix);
          index += 1;
        }
      }
      edgeMesh.count = index;
      edgeMesh.instanceMatrix.needsUpdate = true;
      edgeMesh.computeBoundingSphere();
    }
  }, []);

  return (
    <group>
      <instancedMesh ref={dashes} args={[dashGeometry, dashMaterial, dashCount]} />
      <instancedMesh ref={stripes} args={[stripeGeometry, stripeMaterial, stripeCount]} />
      <instancedMesh ref={edgeLines} args={[edgeGeometry, edgeMaterial, SEGMENTS.length * 2]} />
    </group>
  );
}

/* ------------------------------------------------------------ buildings */

interface BuildingVariant {
  w: number;
  h: number;
  d: number;
}

const BUILDING_VARIANTS: BuildingVariant[] = [
  { w: 12, h: 16, d: 12 },
  { w: 16, h: 24, d: 12 },
  { w: 12, h: 30, d: 16 },
  { w: 20, h: 38, d: 20 },
  { w: 16, h: 52, d: 16 },
];

interface PlacedBuilding {
  variant: number;
  x: number;
  z: number;
  rotation: number;
}

function buildPlacement(): PlacedBuilding[] {
  const rng = new Rng(0xb001d);
  const placed: PlacedBuilding[] = [];
  for (const block of CITY.blocks) {
    const usableW = block.x1 - block.x0;
    const usableD = block.z1 - block.z0;
    const columns = usableW > 24 ? 2 : 1;
    const rows = usableD > 24 ? 2 : 1;
    for (let c = 0; c < columns; c += 1) {
      for (let r = 0; r < rows; r += 1) {
        if (rng.bool(0.14)) continue;
        const cellW = usableW / columns;
        const cellD = usableD / rows;
        const variant = rng.int(0, BUILDING_VARIANTS.length);
        const spec = BUILDING_VARIANTS[variant];
        if (!spec) continue;
        placed.push({
          variant,
          x: block.x0 + cellW * (c + 0.5) + rng.range(-1.4, 1.4),
          z: block.z0 + cellD * (r + 0.5) + rng.range(-1.4, 1.4),
          rotation: Math.round(rng.range(-0.04, 0.04) * 100) / 100,
        });
      }
    }
  }
  return placed;
}

/** Rebuild the UVs of a box so a single texture tiles in world units. */
function applyWorldUv(geometry: THREE.BufferGeometry, w: number, h: number, d: number): void {
  const position = geometry.getAttribute("position");
  const normal = geometry.getAttribute("normal");
  const uv = geometry.getAttribute("uv");
  const cellW = 3.2;
  const cellH = 3.6;
  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);
    const nx = Math.abs(normal.getX(i));
    const ny = Math.abs(normal.getY(i));
    let u: number;
    let v: number;
    if (ny > 0.5) {
      u = (x + w / 2) / cellW;
      v = (z + d / 2) / cellW;
    } else if (nx > 0.5) {
      u = (z + d / 2) / cellW;
      v = (y + h / 2) / cellH;
    } else {
      u = (x + w / 2) / cellW;
      v = (y + h / 2) / cellH;
    }
    uv.setXY(i, u, v);
  }
  uv.needsUpdate = true;
}

function Buildings() {
  const placement = React.useMemo(() => buildPlacement(), []);

  const texture = React.useMemo(() => getWindowTexture(), []);
  const material = React.useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: texture,
        emissiveMap: texture,
        emissive: new THREE.Color("#ffd9a0"),
        emissiveIntensity: 0.4,
        color: new THREE.Color("#4a5068"),
        roughness: 0.82,
        metalness: 0.06,
      }),
    [texture],
  );

  const groups = React.useMemo(() => {
    const buckets: PlacedBuilding[][] = BUILDING_VARIANTS.map(() => []);
    for (const item of placement) buckets[item.variant]?.push(item);
    return buckets.map((bucket, index) => {
      const spec = BUILDING_VARIANTS[index] ?? BUILDING_VARIANTS[0];
      const fallback = { w: 12, h: 16, d: 12 };
      const dimensions = spec ?? fallback;
      const geometry = new THREE.BoxGeometry(dimensions.w, dimensions.h, dimensions.d);
      applyWorldUv(geometry, dimensions.w, dimensions.h, dimensions.d);
      return { bucket, geometry, dimensions };
    });
  }, [placement]);

  const meshRefs = React.useRef<Array<THREE.InstancedMesh | null>>([]);

  React.useEffect(() => {
    const matrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion();
    const position = new THREE.Vector3();
    const scale = new THREE.Vector3(1, 1, 1);
    const euler = new THREE.Euler();

    groups.forEach((group, variantIndex) => {
      const mesh = meshRefs.current[variantIndex];
      if (!mesh) return;
      group.bucket.forEach((item, index) => {
        position.set(item.x, group.dimensions.h / 2, item.z);
        euler.set(0, item.rotation, 0);
        quaternion.setFromEuler(euler);
        matrix.compose(position, quaternion, scale);
        mesh.setMatrixAt(index, matrix);
      });
      mesh.count = group.bucket.length;
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
    });
  }, [groups]);

  useFrame(() => {
    const day = daylightFactor();
    material.emissiveIntensity = 0.12 + (1 - day) * 1.55;
  });

  return (
    <group>
      {groups.map((group, index) => (
        <instancedMesh
          key={`${group.dimensions.w}-${group.dimensions.h}-${group.dimensions.d}`}
          ref={(node) => {
            meshRefs.current[index] = node;
          }}
          args={[group.geometry, material, Math.max(1, group.bucket.length)]}
        />
      ))}
    </group>
  );
}

/* ---------------------------------------------------------------- trees */

function Trees() {
  const placements = React.useMemo(() => {
    const rng = new Rng(0x7ee5);
    const list: { x: number; z: number; scale: number }[] = [];
    for (const node of CITY.nodes) {
      for (const sx of [-1, 1]) {
        for (const sz of [-1, 1]) {
          if (!rng.bool(0.5)) continue;
          list.push({
            x: node.x + sx * (SIDEWALK_OFFSET + 1.7),
            z: node.z + sz * (SIDEWALK_OFFSET + 1.7),
            scale: rng.range(0.75, 1.35),
          });
        }
      }
    }
    return list;
  }, []);

  const trunks = React.useRef<THREE.InstancedMesh>(null);
  const canopies = React.useRef<THREE.InstancedMesh>(null);

  const trunkGeometry = React.useMemo(() => new THREE.CylinderGeometry(0.16, 0.24, 3, 6), []);
  const canopyGeometry = React.useMemo(() => new THREE.IcosahedronGeometry(1.9, 0), []);
  const trunkMaterial = React.useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#2a2233", roughness: 1 }),
    [],
  );
  const canopyMaterial = React.useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#17361f",
        roughness: 0.95,
        flatShading: true,
      }),
    [],
  );

  React.useEffect(() => {
    const matrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion();
    const position = new THREE.Vector3();
    const scale = new THREE.Vector3();
    const euler = new THREE.Euler();

    placements.forEach((item, index) => {
      euler.set(0, 0, 0);
      quaternion.setFromEuler(euler);
      position.set(item.x, 1.5 * item.scale, item.z);
      scale.set(item.scale, item.scale, item.scale);
      matrix.compose(position, quaternion, scale);
      trunks.current?.setMatrixAt(index, matrix);

      position.set(item.x, 3.7 * item.scale, item.z);
      scale.set(item.scale * 1.25, item.scale * 1.35, item.scale * 1.25);
      matrix.compose(position, quaternion, scale);
      canopies.current?.setMatrixAt(index, matrix);
    });
    if (trunks.current) trunks.current.instanceMatrix.needsUpdate = true;
    if (canopies.current) canopies.current.instanceMatrix.needsUpdate = true;
  }, [placements]);

  return (
    <group>
      <instancedMesh ref={trunks} args={[trunkGeometry, trunkMaterial, placements.length]} />
      <instancedMesh ref={canopies} args={[canopyGeometry, canopyMaterial, placements.length]} />
    </group>
  );
}

/* --------------------------------------------------------- global lights */

function AmbientRig() {
  const ambient = React.useRef<THREE.AmbientLight>(null);
  const hemisphere = React.useRef<THREE.HemisphereLight>(null);
  const key = React.useRef<THREE.DirectionalLight>(null);

  useFrame(() => {
    const day = daylightFactor();
    if (ambient.current) ambient.current.intensity = 0.2 + day * 0.85;
    if (hemisphere.current) hemisphere.current.intensity = 0.3 + day * 1.1;
    if (key.current) {
      key.current.intensity = 0.22 + day * 1.45;
      const angle = day > 0.5 ? 0.9 : -0.6;
      key.current.position.set(Math.cos(angle) * 120, 60 + day * 70, Math.sin(angle) * 120);
    }
  });

  return (
    <>
      <ambientLight ref={ambient} intensity={0.35} color="#8fa6d8" />
      <hemisphereLight ref={hemisphere} args={["#5b74b5", "#0a0d1c", 0.6]} />
      <directionalLight ref={key} position={[90, 110, 60]} intensity={0.8} color="#cfe0ff" />
    </>
  );
}

export function World() {
  return (
    <group>
      <Sky />
      <Stars />
      <AmbientRig />
      <Ground />
      <Roads />
      <Sidewalks />
      <Markings />
      <Buildings />
      <Trees />
    </group>
  );
}
