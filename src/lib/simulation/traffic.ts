import { CITY, LEFT_TURN, REVERSE, RIGHT_TURN } from "./city";
import { SIGNAL_ALL_RED, SIGNAL_AMBER, SIGNAL_CYCLE, SIGNAL_GREEN } from "./constants";
import type { Axis, Direction, SignalPhase, SignalState } from "./types";

export interface SignalSegment {
  phase: SignalPhase;
  duration: number;
}

export const SIGNAL_SEGMENTS: readonly SignalSegment[] = [
  { phase: "NS_GREEN", duration: SIGNAL_GREEN },
  { phase: "NS_AMBER", duration: SIGNAL_AMBER },
  { phase: "ALL_RED", duration: SIGNAL_ALL_RED },
  { phase: "EW_GREEN", duration: SIGNAL_GREEN },
  { phase: "EW_AMBER", duration: SIGNAL_AMBER },
  { phase: "ALL_RED", duration: SIGNAL_ALL_RED },
];

/** Each signal runs on its own offset so the grid does not blink in unison. */
export function signalOffset(nodeId: number): number {
  return (nodeId % 7) * 3.1;
}

export function signalPhaseAt(nodeId: number, time: number): SignalState {
  const local = (time + signalOffset(nodeId)) % SIGNAL_CYCLE;
  let cursor = 0;
  for (const segment of SIGNAL_SEGMENTS) {
    const end = cursor + segment.duration;
    if (local < end) {
      return {
        nodeId,
        phase: segment.phase,
        remaining: end - local,
        progress: (local - cursor) / segment.duration,
      };
    }
    cursor = end;
  }
  const last = SIGNAL_SEGMENTS[SIGNAL_SEGMENTS.length - 1];
  return {
    nodeId,
    phase: last ? last.phase : "ALL_RED",
    remaining: SIGNAL_ALL_RED,
    progress: 1,
  };
}

/** Does the given phase allow traffic travelling along `axis` to move? */
export function phaseAllows(phase: SignalPhase, axis: Axis): boolean {
  if (phase === "ALL_RED") return false;
  if (axis === "NS") return phase === "NS_GREEN" || phase === "NS_AMBER";
  return phase === "EW_GREEN" || phase === "EW_AMBER";
}

/** Amber means "stop if you still can", so it is treated as green for movement. */
export function phaseIsGreen(phase: SignalPhase, axis: Axis): boolean {
  if (phase === "NS_GREEN") return axis === "NS";
  if (phase === "EW_GREEN") return axis === "EW";
  return false;
}

export function axisOf(direction: Direction): Axis {
  return direction === "E" || direction === "W" ? "EW" : "NS";
}

export type TurnChoice = "straight" | "right" | "left";

export interface TurnOptions {
  straight: number;
  right: number;
  left: number;
}

/**
 * Pick the next edge at an intersection.
 * U-turns are never selected, which guarantees a vehicle can always continue
 * and removes the possibility of a two-node traffic deadlock.
 */
export function chooseNextEdge(
  nodeId: number,
  incomingDirection: Direction,
  random: () => number,
): number {
  const node = CITY.nodes[nodeId];
  if (!node) return -1;

  const straight = node.out[incomingDirection];
  const right = node.out[RIGHT_TURN[incomingDirection]];
  const left = node.out[LEFT_TURN[incomingDirection]];
  const reverse = node.out[REVERSE[incomingDirection]];

  const candidates: number[] = [];
  const weights: number[] = [];

  if (straight >= 0) {
    candidates.push(straight);
    weights.push(0.62);
  }
  if (right >= 0) {
    candidates.push(right);
    weights.push(0.21);
  }
  if (left >= 0) {
    candidates.push(left);
    weights.push(0.17);
  }

  if (candidates.length === 0) {
    return reverse >= 0 ? reverse : straight >= 0 ? straight : -1;
  }

  let total = 0;
  for (const weight of weights) total += weight;
  let roll = random() * total;
  for (let i = 0; i < candidates.length; i += 1) {
    roll -= weights[i] ?? 0;
    if (roll <= 0) return candidates[i] as number;
  }
  return candidates[candidates.length - 1] as number;
}

/** Total length of the three possible turns, used to sanity check the graph. */
export function graphIsConnected(): boolean {
  for (const node of CITY.nodes) {
    const degree = Object.values(node.out).filter((edge) => edge >= 0).length;
    if (degree < 2) return false;
  }
  return true;
}
