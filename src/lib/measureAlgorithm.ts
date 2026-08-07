import type { StepMetrics } from "@/types";
import {
  bubbleSortSteps,
  heapSortSteps,
  insertionSortSteps,
  mergeSortSteps,
  quickSortSteps,
} from "@/algorithms/sorting";
import {
  binarySearchSteps,
  jumpSearchSteps,
  linearSearchSteps,
} from "@/algorithms/searching";
import { generateArray, makeRng, withMetricsOnly } from "@/algorithms/helpers";
import type { Distribution } from "./runAlgorithm";

/**
 * Algorithms whose cost is a function of a single input size `n`, and which are
 * therefore meaningful to sweep. Graph, DP and backtracking algorithms run on
 * fixed sample inputs, so there is no independent variable to plot against.
 */
export const MEASURABLE_IDS = [
  "bubble-sort",
  "insertion-sort",
  "quick-sort",
  "merge-sort",
  "heap-sort",
  "linear-search",
  "binary-search",
  "jump-search",
] as const;

export type MeasurableId = (typeof MEASURABLE_IDS)[number];

export function isMeasurable(id: string): id is MeasurableId {
  return (MEASURABLE_IDS as readonly string[]).includes(id);
}

const SORTERS = {
  "bubble-sort": bubbleSortSteps,
  "insertion-sort": insertionSortSteps,
  "quick-sort": quickSortSteps,
  "merge-sort": mergeSortSteps,
  "heap-sort": heapSortSteps,
} as const;

const SEARCHES = {
  "linear-search": linearSearchSteps,
  "binary-search": binarySearchSteps,
  "jump-search": jumpSearchSteps,
} as const;

export interface MeasureOptions {
  /** Sorting only; searches always measure against random data. */
  distribution?: Distribution;
  /**
   * Searching only. "present" picks a value from the array (average successful
   * search); "absent" forces the full miss path (worst case).
   */
  searchTargetMode?: "present" | "absent";
}

/**
 * Runs an algorithm to completion and returns only its final metrics.
 *
 * This deliberately does NOT reuse `runAlgorithm`, which materialises every
 * step so the player can scrub. Retaining steps costs O(steps x n) memory and
 * forces the MAX_STEPS cap, both of which are pointless when the caller only
 * wants the operation counts. Draining the same generator keeps the algorithms
 * as the single source of truth while making n = 2000 cheap.
 */
export function measureAlgorithm(
  id: MeasurableId,
  n: number,
  seed: number,
  options: MeasureOptions = {}
): StepMetrics {
  return withMetricsOnly(() => {
    const rng = makeRng(seed * 0x9e3779b9 + 1);
    let gen;

    if (id in SORTERS) {
      const arr = generateArray(n, options.distribution ?? "random", rng);
      gen = SORTERS[id as keyof typeof SORTERS](arr);
    } else {
      const arr = generateArray(n, "random", rng);
      // Searches sort their own input; the target is drawn from the same values.
      const target =
        options.searchTargetMode === "absent"
          ? Number.MAX_SAFE_INTEGER
          : arr[Math.floor(rng() * arr.length)];
      gen = SEARCHES[id as keyof typeof SEARCHES](arr, target);
    }

    let last: StepMetrics = { comparisons: 0, swaps: 0, arrayAccesses: 0 };
    for (const step of gen) last = step.metrics;
    return last;
  });
}

export interface SamplePoint {
  n: number;
  comparisons: number;
  swaps: number;
  arrayAccesses: number;
}

/**
 * Measures one algorithm across a range of sizes, averaging `trials` seeds per
 * size so a single unlucky input does not distort the curve.
 */
export function sweepAlgorithm(
  id: MeasurableId,
  sizes: number[],
  trials: number,
  options: MeasureOptions = {}
): SamplePoint[] {
  return sizes.map((n) => {
    const totals = { comparisons: 0, swaps: 0, arrayAccesses: 0 };
    for (let t = 0; t < trials; t++) {
      const m = measureAlgorithm(id, n, t, options);
      totals.comparisons += m.comparisons;
      totals.swaps += m.swaps;
      totals.arrayAccesses += m.arrayAccesses;
    }
    return {
      n,
      comparisons: totals.comparisons / trials,
      swaps: totals.swaps / trials,
      arrayAccesses: totals.arrayAccesses / trials,
    };
  });
}

/** Geometric-ish spread so small n are not crowded out on a linear axis. */
export function defaultSizes(max: number, count = 14): number[] {
  const sizes: number[] = [];
  for (let i = 1; i <= count; i++) {
    sizes.push(Math.max(2, Math.round((max * i) / count)));
  }
  return [...new Set(sizes)];
}
