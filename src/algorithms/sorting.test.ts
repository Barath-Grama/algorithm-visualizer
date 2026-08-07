import { describe, expect, it } from "vitest";
import type { AlgorithmStep, StepGenerator } from "@/types";
import { generateArray, makeRng } from "./helpers";
import {
  bubbleSortSteps,
  heapSortSteps,
  insertionSortSteps,
  mergeSortSteps,
  quickSortSteps,
} from "./sorting";

type Distribution = Parameters<typeof generateArray>[1];

const SORTERS: [string, (input: number[]) => StepGenerator][] = [
  ["bubble", bubbleSortSteps],
  ["insertion", insertionSortSteps],
  ["quick", quickSortSteps],
  ["merge", mergeSortSteps],
  ["heap", heapSortSteps],
];

const DISTRIBUTIONS: Distribution[] = ["random", "sorted", "reversed", "nearly-sorted"];

function drain(gen: StepGenerator): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  for (const step of gen) {
    steps.push(step);
    // A sorter that fails to terminate would otherwise hang the whole suite.
    if (steps.length > 50_000) throw new Error("generator did not terminate");
  }
  return steps;
}

const ascending = (a: number[]) => a.every((v, i) => i === 0 || a[i - 1] <= v);
const multiset = (a: number[]) => [...a].sort((x, y) => x - y).join(",");

describe.each(SORTERS)("%s sort", (_name, sortSteps) => {
  it.each(DISTRIBUTIONS)("sorts %s input across several seeds", (distribution) => {
    for (const seed of [1, 2, 3]) {
      const input = generateArray(14, distribution, makeRng(seed));
      const steps = drain(sortSteps(input));
      const final = steps.at(-1)!.array!;

      expect(ascending(final.values), `${distribution}/seed ${seed}`).toBe(true);
      // Sorting must not invent, drop, or duplicate elements.
      expect(multiset(final.values)).toBe(multiset(input));
      expect(final.states.every((s) => s === "sorted")).toBe(true);
    }
  });

  it("never mutates the caller's array", () => {
    const input = generateArray(12, "reversed");
    const before = [...input];
    drain(sortSteps(input));
    expect(input).toEqual(before);
  });

  it.each([0, 1, 2])("handles a length-%i array", (size) => {
    const input = generateArray(size, "random", makeRng(7));
    const steps = drain(sortSteps(input));
    expect(steps.length).toBeGreaterThan(0);
    expect(steps.at(-1)!.array!.values).toHaveLength(size);
  });

  it("reports metrics that only ever increase", () => {
    const steps = drain(sortSteps(generateArray(10, "random", makeRng(4))));
    for (let i = 1; i < steps.length; i++) {
      const prev = steps[i - 1].metrics;
      const curr = steps[i].metrics;
      expect(curr.comparisons).toBeGreaterThanOrEqual(prev.comparisons);
      expect(curr.swaps).toBeGreaterThanOrEqual(prev.swaps);
      expect(curr.arrayAccesses).toBeGreaterThanOrEqual(prev.arrayAccesses);
    }
  });

});

// Only the swap-based sorters hold this invariant frame by frame. Insertion
// sort parks `key` in a local while it shifts elements right, and merge sort
// writes back from scratch buffers, so both legitimately show a duplicated
// value mid-operation — that hole is the algorithm, not a rendering bug.
describe.each([
  ["bubble", bubbleSortSteps],
  ["quick", quickSortSteps],
  ["heap", heapSortSteps],
] as [string, (input: number[]) => StepGenerator][])(
  "%s sort frame-by-frame integrity",
  (_name, sortSteps) => {
    it("keeps every intermediate frame a permutation of the input", () => {
      const input = generateArray(11, "random", makeRng(9));
      const expected = multiset(input);
      for (const step of drain(sortSteps(input))) {
        expect(multiset(step.array!.values)).toBe(expected);
      }
    });
  }
);

describe("bubble sort early exit", () => {
  it("stops after a single clean pass on already-sorted input", () => {
    const sorted = generateArray(20, "sorted");
    const shuffled = generateArray(20, "reversed");
    expect(drain(bubbleSortSteps(sorted)).length).toBeLessThan(
      drain(bubbleSortSteps(shuffled)).length
    );
  });
});
