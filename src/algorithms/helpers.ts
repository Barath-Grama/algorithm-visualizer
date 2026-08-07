import type { ArrayElementState, AlgorithmStep, StepMetrics } from "@/types";

export function freshMetrics(): StepMetrics {
  return { comparisons: 0, swaps: 0, arrayAccesses: 0 };
}

/**
 * When set, snapshotters skip building the visualization payload and emit only
 * metrics.
 *
 * The complexity sweep drains the same generators the player uses, but wants
 * nothing except the final counts. Copying the array and its state buffer on
 * every step costs O(steps x n) — for a quadratic sort at n=400 that is roughly
 * 64 million element copies per run, which dominates the measurement entirely.
 *
 * A module-scoped flag rather than a parameter because it would otherwise have
 * to be threaded through every generator signature and every internal recursive
 * helper. It is only ever set by `withMetricsOnly`, which restores it in a
 * `finally`, and generators are synchronous, so no interleaving is possible.
 */
let metricsOnly = false;

export function isMetricsOnly(): boolean {
  return metricsOnly;
}

/** Runs `fn` with visualization payloads disabled. Not reentrant-safe by design. */
export function withMetricsOnly<T>(fn: () => T): T {
  const previous = metricsOnly;
  metricsOnly = true;
  try {
    return fn();
  } finally {
    metricsOnly = previous;
  }
}

/**
 * Builds a reusable "snapshot" function closed over a mutable array + state
 * buffer + metrics object, so each algorithm generator can cheaply emit a
 * step without re-deriving the visualization payload every time.
 */
export function makeArraySnapshotter(arr: number[], metrics: StepMetrics) {
  const states: ArrayElementState[] = new Array(arr.length).fill("default");

  function snapshot(
    description: string,
    codeLine: number[] = [],
    rangeLabel?: string
  ): AlgorithmStep {
    // The two spreads below are the expensive part of a step; skip them when
    // nothing will ever render this frame.
    if (metricsOnly) return { description: "", metrics: { ...metrics }, codeLine: [] };
    return {
      description,
      metrics: { ...metrics },
      array: { values: [...arr], states: [...states], rangeLabel },
      codeLine,
    };
  }

  function setState(index: number, state: ArrayElementState) {
    if (index >= 0 && index < states.length) states[index] = state;
  }

  function setRange(from: number, to: number, state: ArrayElementState) {
    for (let i = from; i <= to; i++) setState(i, state);
  }

  function resetNonSorted() {
    for (let i = 0; i < states.length; i++) {
      if (states[i] !== "sorted") states[i] = "default";
    }
  }

  return { states, snapshot, setState, setRange, resetNonSorted };
}

/**
 * Small deterministic PRNG (mulberry32). Generating input from an explicit seed
 * rather than Math.random keeps a run reproducible: re-running the same
 * algorithm because an unrelated control moved must not silently reshuffle the
 * data the user is looking at. Only "New Random Input" advances the seed.
 */
export function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return function rng() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateArray(
  size: number,
  distribution: "random" | "sorted" | "reversed" | "nearly-sorted" = "random",
  rng: () => number = Math.random
): number[] {
  const base = Array.from({ length: size }, (_, i) =>
    Math.round(((i + 1) / size) * 95) + 5
  );
  switch (distribution) {
    case "sorted":
      return base;
    case "reversed":
      return [...base].reverse();
    case "nearly-sorted": {
      const arr = [...base];
      const swaps = Math.max(1, Math.floor(size * 0.08));
      for (let i = 0; i < swaps; i++) {
        const a = Math.floor(rng() * arr.length);
        const b = Math.floor(rng() * arr.length);
        [arr[a], arr[b]] = [arr[b], arr[a]];
      }
      return arr;
    }
    case "random":
    default: {
      const arr = Array.from({ length: size }, () => Math.floor(rng() * 96) + 5);
      return arr;
    }
  }
}
