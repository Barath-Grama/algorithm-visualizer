/// <reference lib="webworker" />
import {
  measureAlgorithm,
  type MeasurableId,
  type MeasureOptions,
  type SamplePoint,
} from "./measureAlgorithm";

/**
 * Runs complexity sweeps off the main thread.
 *
 * A full sweep is several hundred algorithm runs, some quadratic at n in the
 * hundreds. On the main thread that visibly locks the page for seconds; here
 * the UI stays interactive and can show real progress.
 */

export interface MeasureRequest {
  type: "run";
  algorithmIds: MeasurableId[];
  sizes: number[];
  trials: number;
  options?: MeasureOptions;
}

export type MeasureResponse =
  | { type: "progress"; completed: number; total: number; algorithmId: MeasurableId }
  | { type: "result"; results: Record<string, SamplePoint[]>; elapsedMs: number }
  | { type: "error"; message: string };

const ctx = self as unknown as DedicatedWorkerGlobalScope;

ctx.addEventListener("message", (event: MessageEvent<MeasureRequest>) => {
  const { type, algorithmIds, sizes, trials, options } = event.data;
  if (type !== "run") return;

  const startedAt = performance.now();
  const results: Record<string, SamplePoint[]> = {};
  const total = algorithmIds.length * sizes.length;
  let completed = 0;

  try {
    for (const id of algorithmIds) {
      const points: SamplePoint[] = [];

      for (const n of sizes) {
        const totals = { comparisons: 0, swaps: 0, arrayAccesses: 0 };
        for (let trial = 0; trial < trials; trial++) {
          const m = measureAlgorithm(id, n, trial, options);
          totals.comparisons += m.comparisons;
          totals.swaps += m.swaps;
          totals.arrayAccesses += m.arrayAccesses;
        }
        points.push({
          n,
          comparisons: totals.comparisons / trials,
          swaps: totals.swaps / trials,
          arrayAccesses: totals.arrayAccesses / trials,
        });

        // Report per size rather than per algorithm: a quadratic sort at large
        // n takes long enough that per-algorithm updates would look stalled.
        completed++;
        ctx.postMessage({
          type: "progress",
          completed,
          total,
          algorithmId: id,
        } satisfies MeasureResponse);
      }

      results[id] = points;
    }

    ctx.postMessage({
      type: "result",
      results,
      elapsedMs: Math.round(performance.now() - startedAt),
    } satisfies MeasureResponse);
  } catch (error) {
    ctx.postMessage({
      type: "error",
      message: error instanceof Error ? error.message : String(error),
    } satisfies MeasureResponse);
  }
});
