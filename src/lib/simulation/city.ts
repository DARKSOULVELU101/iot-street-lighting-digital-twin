import {
  BLOCK_INSET,
  GRID,
  LANE_OFFSET,
  SIDEWALK_OFFSET,
} from "./constants";
import type { Axis, CityEdge, CityNode, Direction, Pole } from "./types";

export const DIR_VECTORS: Record<Direction, { dx: number; dz: number }> = {
  E: { dx: 1, dz: 0 },
  W: { dx: -1, dz: 0 },
  S: { dx: 0, dz: 1 },
  N: { dx: 0, dz: -1 },
};

/** Clockwise turn when looking down at the XZ plane. */
export const RIGHT_TURN: Record<Direction, Direction> = {
  E: "S",
  S: "W",
  W: "N",
  N: "E",
};

/** Counter-clockwise turn when looking down at the XZ plane. */
export const LEFT_TURN: Record<Direction, Direction> = {
  E: "N",
  N: "W",
  W: "S",
  S: "E",
};

export const REVERSE: Record<Direction, Direction> = {
  E: "W",
  W: "E",
  S: "N",
  N: "S",
};

export const OPPOSITE_AXIS: Record<Axis, Axis> = { EW: "NS", NS: "EW" };

export interface CityBlock {
  id: number;
  i: number;
  j: number;
  /** Buildable rectangle. */
  x0: number;
  z0: number;
  x1: number;
  z1: number;
  cx: number;
  cz: number;
  /** Inner sidewalk circuit used by the pedestrian agents. */
  walk: { x0: number; z0: number; x1: number; z1: number };
  perimeter: number;
}

export interface CityPlan {
  nodes: CityNode[];
  edges: CityEdge[];
  poles: Pole[];
  blocks: CityBlock[];
  /** Index of the monitored unit (ESP32 node A). */
  primaryPoleId: number;
  /** Node ids that carry a traffic signal. */
  signalNodeIds: number[];
}

function nodeId(i: number, j: number): number {
  return i * GRID.length + j;
}

function buildNodes(): CityNode[] {
  const nodes: CityNode[] = [];
  for (let i = 0; i < GRID.length; i += 1) {
    for (let j = 0; j < GRID.length; j += 1) {
      const isCorner = (i === 0 || i === GRID.length - 1) && (j === 0 || j === GRID.length - 1);
      nodes.push({
        id: nodeId(i, j),
        i,
        j,
        x: GRID[i] ?? 0,
        z: GRID[j] ?? 0,
        signalized: !isCorner,
        out: { E: -1, W: -1, S: -1, N: -1 },
      });
    }
  }
  return nodes;
}

function buildEdges(nodes: CityNode[]): CityEdge[] {
  const edges: CityEdge[] = [];
  const directions: Direction[] = ["E", "W", "S", "N"];

  for (const node of nodes) {
    for (const dir of directions) {
      const vector = DIR_VECTORS[dir];
      const ni = node.i + vector.dx;
      const nj = node.j + vector.dz;
      if (ni < 0 || ni >= GRID.length || nj < 0 || nj >= GRID.length) continue;

      const target = nodes[nodeId(ni, nj)];
      if (!target) continue;

      // Right-hand traffic: the lane sits on the right of the travel vector.
      const ox = -vector.dz * LANE_OFFSET;
      const oz = vector.dx * LANE_OFFSET;
      const length = Math.hypot(target.x - node.x, target.z - node.z);

      const edge: CityEdge = {
        id: edges.length,
        from: node.id,
        to: target.id,
        dir,
        axis: dir === "E" || dir === "W" ? "EW" : "NS",
        length,
        dx: vector.dx,
        dz: vector.dz,
        ox,
        oz,
      };
      edges.push(edge);
      node.out[dir] = edge.id;
    }
  }

  return edges;
}

function buildBlocks(): CityBlock[] {
  const blocks: CityBlock[] = [];
  for (let i = 0; i < GRID.length - 1; i += 1) {
    for (let j = 0; j < GRID.length - 1; j += 1) {
      const gx0 = GRID[i] ?? 0;
      const gx1 = GRID[i + 1] ?? 0;
      const gz0 = GRID[j] ?? 0;
      const gz1 = GRID[j + 1] ?? 0;
      const walk = {
        x0: gx0 + SIDEWALK_OFFSET,
        z0: gz0 + SIDEWALK_OFFSET,
        x1: gx1 - SIDEWALK_OFFSET,
        z1: gz1 - SIDEWALK_OFFSET,
      };
      blocks.push({
        id: blocks.length,
        i,
        j,
        x0: gx0 + BLOCK_INSET,
        z0: gz0 + BLOCK_INSET,
        x1: gx1 - BLOCK_INSET,
        z1: gz1 - BLOCK_INSET,
        cx: (gx0 + gx1) / 2,
        cz: (gz0 + gz1) / 2,
        walk,
        perimeter: 2 * (walk.x1 - walk.x0 + walk.z1 - walk.z0),
      });
    }
  }
  return blocks;
}

function buildPoles(nodes: CityNode[], edges: CityEdge[]): Pole[] {
  const poles: Pole[] = [];
  const processed = new Set<string>();
  const fractions = [0.3, 0.7] as const;
  let side = 1;

  for (const edge of edges) {
    // Each physical street segment is processed exactly once.
    const key = edge.from < edge.to ? `${edge.from}-${edge.to}` : `${edge.to}-${edge.from}`;
    if (processed.has(key)) continue;
    processed.add(key);

    const from = nodes[edge.from];
    const to = nodes[edge.to];
    if (!from || !to) continue;

    for (const fraction of fractions) {
      const mx = from.x + (to.x - from.x) * fraction;
      const mz = from.z + (to.z - from.z) * fraction;
      // Street normal, perpendicular to the segment.
      const nx = -(to.z - from.z);
      const nz = to.x - from.x;
      const norm = Math.hypot(nx, nz) || 1;
      const ux = nx / norm;
      const uz = nz / norm;
      const offset = SIDEWALK_OFFSET * side;
      side *= -1;
      poles.push({
        id: poles.length,
        x: mx + ux * offset,
        z: mz + uz * offset,
        // The lamp arm always points back towards the carriageway.
        yaw: Math.atan2(-ux, -uz),
        nodeId: from.id,
        primary: false,
      });
    }
  }

  // The monitored pole is the one closest to the city centre.
  let primaryPoleId = 0;
  let best = Number.POSITIVE_INFINITY;
  for (const pole of poles) {
    const distance = pole.x * pole.x + pole.z * pole.z;
    if (distance < best) {
      best = distance;
      primaryPoleId = pole.id;
    }
  }
  const primary = poles[primaryPoleId];
  if (primary) primary.primary = true;

  return poles;
}

function buildCity(): CityPlan {
  const nodes = buildNodes();
  const edges = buildEdges(nodes);
  const blocks = buildBlocks();
  const poles = buildPoles(nodes, edges);
  const primaryPole = poles.find((pole) => pole.primary);
  const signalNodeIds = nodes.filter((node) => node.signalized).map((node) => node.id);

  return {
    nodes,
    edges,
    blocks,
    poles,
    primaryPoleId: primaryPole ? primaryPole.id : 0,
    signalNodeIds,
  };
}

export const CITY: CityPlan = buildCity();

export function nodeAt(i: number, j: number): CityNode | undefined {
  return CITY.nodes[nodeId(i, j)];
}

export function edgeById(id: number): CityEdge | undefined {
  return CITY.edges[id];
}

/** World position of a point on a directed lane. */
export function lanePoint(
  edge: CityEdge,
  distance: number,
  out: { x: number; z: number },
): void {
  const from = CITY.nodes[edge.from];
  if (!from) {
    out.x = 0;
    out.z = 0;
    return;
  }
  out.x = from.x + edge.dx * distance + edge.ox;
  out.z = from.z + edge.dz * distance + edge.oz;
}

export function directionOf(dx: number, dz: number): Direction {
  if (dx > 0) return "E";
  if (dx < 0) return "W";
  if (dz > 0) return "S";
  return "N";
}

export function headingOf(direction: Direction): number {
  const vector = DIR_VECTORS[direction];
  return Math.atan2(vector.dx, vector.dz);
}
