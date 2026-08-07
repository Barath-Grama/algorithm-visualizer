import { describe, expect, it } from "vitest";
import type { AlgorithmStep, StepGenerator } from "@/types";
import { fibonacciSteps, knapsackSteps, type KnapsackItem } from "./dp";
import { nQueensSteps } from "./backtracking";

function collect(gen: StepGenerator): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  let guard = 0;
  for (const step of gen) {
    if (++guard > 50_000) throw new Error("generator did not terminate");
    steps.push(step);
  }
  return steps;
}

const ITEMS: KnapsackItem[] = [
  { name: "Camera", weight: 4, value: 40 },
  { name: "Laptop", weight: 5, value: 55 },
  { name: "Watch", weight: 2, value: 20 },
  { name: "Book", weight: 3, value: 18 },
  { name: "Jacket", weight: 6, value: 32 },
];

/** Independent brute-force optimum to check the DP table against. */
function bruteForceKnapsack(items: KnapsackItem[], capacity: number): number {
  let best = 0;
  for (let mask = 0; mask < 1 << items.length; mask++) {
    let w = 0;
    let v = 0;
    for (let i = 0; i < items.length; i++) {
      if (mask & (1 << i)) {
        w += items[i].weight;
        v += items[i].value;
      }
    }
    if (w <= capacity && v > best) best = v;
  }
  return best;
}

describe("0/1 knapsack", () => {
  it.each([0, 1, 5, 10, 15, 20, 25])("matches brute force at capacity %i", (capacity) => {
    const steps = collect(knapsackSteps(ITEMS, capacity));
    const table = steps.at(-1)!.dp!.table;
    expect(table[ITEMS.length][capacity]).toBe(bruteForceKnapsack(ITEMS, capacity));
  });

  it("fills the base row with zeroes and never exceeds capacity", () => {
    const steps = collect(knapsackSteps(ITEMS, 15));
    const dp = steps.at(-1)!.dp!;
    expect(dp.table[0].every((v) => v === 0)).toBe(true);
    expect(dp.rowLabels).toHaveLength(ITEMS.length + 1);
    expect(dp.colLabels).toHaveLength(16);
  });

  it("backtracks to a selection whose value equals the optimum", () => {
    const capacity = 15;
    const dp = collect(knapsackSteps(ITEMS, capacity)).at(-1)!.dp!;
    const chosen = dp.selectedCells ?? [];
    const totalValue = chosen.reduce((sum, [row]) => sum + ITEMS[row - 1].value, 0);
    const totalWeight = chosen.reduce((sum, [row]) => sum + ITEMS[row - 1].weight, 0);

    expect(totalValue).toBe(bruteForceKnapsack(ITEMS, capacity));
    expect(totalWeight).toBeLessThanOrEqual(capacity);
  });
});

describe("fibonacci", () => {
  const FIB = [0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55];

  it.each([2, 4, 6, 8, 10])("computes fib(%i) correctly in both modes", (n) => {
    for (const memoized of [false, true]) {
      const root = collect(fibonacciSteps(n, memoized))
        .flatMap((s) => s.tree?.nodes ?? [])
        .find((node) => node.parentId === null && node.value !== undefined);
      expect(root?.value, `fib(${n}) memoized=${memoized}`).toBe(FIB[n]);
    }
  });

  it("memoization strictly reduces the number of calls", () => {
    for (const n of [5, 8, 10]) {
      const calls = (memoized: boolean) =>
        collect(fibonacciSteps(n, memoized)).at(-1)!.tree!.nodes.length;
      expect(calls(true), `n=${n}`).toBeLessThan(calls(false));
    }
  });

  it("produces cache hits only when memoized", () => {
    const statuses = (memoized: boolean) =>
      new Set(collect(fibonacciSteps(8, memoized)).at(-1)!.tree!.nodes.map((n) => n.status));
    expect(statuses(true)).toContain("cached");
    expect(statuses(false)).not.toContain("cached");
  });

  it("marks duplicate subtrees only in naive mode", () => {
    const dupes = (memoized: boolean) =>
      collect(fibonacciSteps(8, memoized)).at(-1)!.tree!.nodes.filter((n) => n.duplicate).length;
    expect(dupes(false)).toBeGreaterThan(0);
    expect(dupes(true)).toBe(0);
  });

  it("reserves layout width only for the naive tree", () => {
    expect(collect(fibonacciSteps(6, false)).at(-1)!.tree!.reserveNaiveWidth).toBe(true);
    expect(collect(fibonacciSteps(6, true)).at(-1)!.tree!.reserveNaiveWidth).toBe(false);
  });
});

describe("n-queens", () => {
  it.each([4, 5, 6, 7, 8])("places %i non-attacking queens", (n) => {
    const board = collect(nQueensSteps(n)).at(-1)!.board!;
    // The final frame is the summary; find the solved arrangement.
    const solved = collect(nQueensSteps(n))
      .map((s) => s.board!)
      .findLast((b) => b.queens.every((c) => c >= 0))!;

    expect(solved.queens).toHaveLength(n);
    for (let r1 = 0; r1 < n; r1++) {
      for (let r2 = r1 + 1; r2 < n; r2++) {
        const [c1, c2] = [solved.queens[r1], solved.queens[r2]];
        expect(c1, `row ${r1} vs ${r2}: same column`).not.toBe(c2);
        expect(Math.abs(c1 - c2), `row ${r1} vs ${r2}: same diagonal`).not.toBe(r2 - r1);
      }
    }
    expect(board.size).toBe(n);
  });

  it.each([2, 3])("reports no solution for N=%i", (n) => {
    expect(collect(nQueensSteps(n)).at(-1)!.description).toMatch(/no solution/i);
  });
});
