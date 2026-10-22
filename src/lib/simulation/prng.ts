/**
 * Deterministic pseudo random number generator.
 *
 * The whole simulation draws from seeded streams so that a given seed always
 * produces the same vehicle fleet, the same traffic splits and the same fault
 * sequence. That makes the demo reproducible for examiners and makes
 * regression tests meaningful.
 */
export class Rng {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  /** mulberry32 - small, fast, good enough distribution for a traffic model. */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  int(min: number, maxExclusive: number): number {
    const span = maxExclusive - min;
    if (span <= 0) return min;
    return min + Math.floor(this.next() * span);
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) {
      throw new Error("Rng.pick called with an empty list");
    }
    const index = Math.min(items.length - 1, Math.floor(this.next() * items.length));
    return items[index] as T;
  }

  /** Weighted pick. `weights` must be the same length as `items`. */
  weighted<T>(items: readonly T[], weights: readonly number[]): T {
    if (items.length === 0) {
      throw new Error("Rng.weighted called with an empty list");
    }
    let total = 0;
    for (const weight of weights) total += Math.max(0, weight);
    if (total <= 0) return this.pick(items);
    let roll = this.next() * total;
    for (let i = 0; i < items.length; i += 1) {
      roll -= Math.max(0, weights[i] ?? 0);
      if (roll <= 0) return items[i] as T;
    }
    return items[items.length - 1] as T;
  }

  bool(probability = 0.5): boolean {
    return this.next() < probability;
  }
}
