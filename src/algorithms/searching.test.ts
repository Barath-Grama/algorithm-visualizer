import { describe, expect, it } from "vitest";
import type { StepGenerator } from "@/types";
import { binarySearchSteps, jumpSearchSteps, linearSearchSteps } from "./searching";

/**
 * Runs a search to completion and reports the index it claimed to find, or null.
 * The step cap doubles as a termination guard: jump search previously spun
 * forever whenever the target exceeded every element.
 */
function findIndex(gen: StepGenerator): number | null {
  let found: number | null = null;
  let guard = 0;
  for (const step of gen) {
    if (++guard > 20_000) throw new Error("search did not terminate");
    const hit = /Found .* at index (\d+)!/.exec(step.description);
    if (hit) found = Number(hit[1]);
  }
  return found;
}

const SORTED_INPUT_SEARCHES: [string, (a: number[], t: number) => StepGenerator][] = [
  ["binary", binarySearchSteps],
  ["jump", jumpSearchSteps],
];

describe("searches on sorted input", () => {
  describe.each(SORTED_INPUT_SEARCHES)("%s search", (_name, search) => {
    it("agrees with indexOf for every target across many array sizes", () => {
      for (let n = 1; n <= 30; n++) {
        // Distinct, non-contiguous values so absent targets fall between them.
        const arr = Array.from({ length: n }, (_, i) => i * 3 + 2);
        for (let target = 0; target <= n * 3 + 6; target++) {
          const expected = arr.indexOf(target);
          const actual = findIndex(search(arr, target));
          expect(actual, `n=${n} target=${target}`).toBe(expected === -1 ? null : expected);
        }
      }
    });

    it("sorts its own input rather than trusting the caller", () => {
      const unsorted = [9, 1, 7, 3, 5];
      // Sorted order is [1,3,5,7,9], so 7 sits at index 3.
      expect(findIndex(search(unsorted, 7))).toBe(3);
    });

    it("terminates when the target exceeds every element", () => {
      expect(findIndex(search([5, 10, 15, 20], 999))).toBeNull();
    });

    it("terminates when the target is below every element", () => {
      expect(findIndex(search([5, 10, 15, 20], -1))).toBeNull();
    });

    it("finds duplicated values", () => {
      expect(findIndex(search([4, 4, 4, 4], 4))).not.toBeNull();
    });
  });
});

describe("linear search", () => {
  it("finds targets in unsorted input without reordering it", () => {
    const arr = [9, 1, 7, 3, 5];
    expect(findIndex(linearSearchSteps(arr, 9))).toBe(0);
    expect(findIndex(linearSearchSteps(arr, 5))).toBe(4);
    expect(findIndex(linearSearchSteps(arr, 42))).toBeNull();
  });

  it("returns the first match when values repeat", () => {
    expect(findIndex(linearSearchSteps([8, 3, 8, 8], 8))).toBe(0);
  });

  it("handles an empty array", () => {
    expect(findIndex(linearSearchSteps([], 1))).toBeNull();
  });
});

describe("jump search termination (regression)", () => {
  // The original loop bounded on `curr < n` while `curr` pinned to `n-1`, so a
  // too-large target spun forever and only the 6000-step cap hid it.
  it("finishes in a handful of steps rather than spinning to the step cap", () => {
    const arr = Array.from({ length: 400 }, (_, i) => i);
    let steps = 0;
    for (const _ of jumpSearchSteps(arr, 10_000)) {
      if (++steps > 500) throw new Error("jump search is looping");
    }
    expect(steps).toBeLessThan(100);
  });
});
