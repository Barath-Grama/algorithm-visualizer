import { describe, expect, it } from "vitest";
import { ALGORITHMS } from "./algorithmRegistry";
import {
  DEFAULT_RUN_OPTIONS,
  MAX_STEPS,
  relevantOptions,
  runAlgorithm,
  usesRandomInput,
} from "./runAlgorithm";

const opts = (overrides = {}) => ({ ...DEFAULT_RUN_OPTIONS, ...overrides });
const inputOf = (id: string, o = DEFAULT_RUN_OPTIONS, seed = 0) =>
  runAlgorithm(id, o, seed).steps[0].array!.values.join(",");

describe("every registered algorithm runs", () => {
  it.each(ALGORITHMS.map((a) => a.id))("%s produces steps with metrics", (id) => {
    const { steps, truncated } = runAlgorithm(id, DEFAULT_RUN_OPTIONS, 0);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps.length).toBeLessThanOrEqual(MAX_STEPS);
    expect(truncated).toBe(false);
    for (const step of steps) {
      expect(step.description).toBeTruthy();
      expect(step.metrics).toBeDefined();
    }
  });

  it("returns an empty result for an unknown id", () => {
    expect(runAlgorithm("does-not-exist", DEFAULT_RUN_OPTIONS, 0).steps).toEqual([]);
  });
});

// Input is generated from an explicit seed rather than Math.random so that a
// re-run triggered by an unrelated control does not silently reshuffle the
// data the user is looking at.
describe("seeded input", () => {
  it("is identical for the same seed", () => {
    expect(inputOf("bubble-sort")).toBe(inputOf("bubble-sort"));
  });

  it("differs across seeds", () => {
    expect(inputOf("bubble-sort", DEFAULT_RUN_OPTIONS, 0)).not.toBe(
      inputOf("bubble-sort", DEFAULT_RUN_OPTIONS, 1)
    );
  });

  it("is unaffected by options the algorithm never reads", () => {
    expect(inputOf("bubble-sort", opts({ fibN: 9, queensN: 8, knapsackCapacity: 25 }))).toBe(
      inputOf("bubble-sort")
    );
  });
});

describe("relevantOptions", () => {
  const key = (id: string, o = DEFAULT_RUN_OPTIONS) => JSON.stringify(relevantOptions(id, o));

  it("ignores unrelated fields", () => {
    expect(key("bubble-sort", opts({ fibN: 9 }))).toBe(key("bubble-sort"));
    expect(key("fibonacci", opts({ arraySize: 55 }))).toBe(key("fibonacci"));
  });

  it.each([
    ["bubble-sort", { arraySize: 30 }],
    ["bubble-sort", { distribution: "reversed" as const }],
    ["binary-search", { searchTarget: 42 }],
    ["bfs", { graphStart: "D" }],
    ["knapsack", { knapsackCapacity: 21 }],
    ["fibonacci", { fibMemoized: true }],
    ["n-queens", { queensN: 7 }],
  ])("catches %s changing %o", (id, change) => {
    expect(key(id, opts(change))).not.toBe(key(id));
  });
});

describe("usesRandomInput", () => {
  it("is true only where re-seeding changes anything", () => {
    for (const id of ["bubble-sort", "heap-sort", "linear-search", "jump-search"]) {
      expect(usesRandomInput(id), id).toBe(true);
    }
    for (const id of ["bfs", "dijkstra", "kruskal", "knapsack", "fibonacci", "n-queens"]) {
      expect(usesRandomInput(id), id).toBe(false);
    }
  });

  it("agrees with actual behaviour", () => {
    // Deterministic algorithms must produce identical steps across seeds.
    for (const id of ["dijkstra", "knapsack", "n-queens"]) {
      const a = runAlgorithm(id, DEFAULT_RUN_OPTIONS, 0);
      const b = runAlgorithm(id, DEFAULT_RUN_OPTIONS, 99);
      expect(a.steps.map((s) => s.description), id).toEqual(b.steps.map((s) => s.description));
    }
  });
});

describe("step-cap reporting", () => {
  it("flags a run that could not finish", () => {
    // Well past what the UI allows, but RunOptions is a public surface.
    const { steps, truncated } = runAlgorithm("bubble-sort", opts({ arraySize: 200 }), 0);
    expect(steps).toHaveLength(MAX_STEPS);
    expect(truncated).toBe(true);
  });

  it("does not flag a run that finished", () => {
    expect(runAlgorithm("bubble-sort", DEFAULT_RUN_OPTIONS, 0).truncated).toBe(false);
  });
});

describe("search targets", () => {
  it("auto-picks a target that is present in the array", () => {
    for (const id of ["linear-search", "binary-search", "jump-search"]) {
      for (let seed = 0; seed < 5; seed++) {
        const r = runAlgorithm(id, DEFAULT_RUN_OPTIONS, seed);
        expect(r.steps[0].array!.values, `${id}/${seed}`).toContain(r.resolvedTarget);
      }
    }
  });

  it("honours an explicit target even when absent", () => {
    const r = runAlgorithm("binary-search", opts({ searchTarget: 999 }), 0);
    expect(r.resolvedTarget).toBe(999);
    expect(r.steps.at(-1)!.description).toMatch(/not found|larger than/i);
  });

  it("shows sorted data for binary and jump, raw data for linear", () => {
    const sorted = (id: string) => {
      const v = runAlgorithm(id, DEFAULT_RUN_OPTIONS, 0).steps[0].array!.values;
      return v.every((x, i) => i === 0 || v[i - 1] <= x);
    };
    expect(sorted("binary-search")).toBe(true);
    expect(sorted("jump-search")).toBe(true);
    expect(sorted("linear-search")).toBe(false);
  });
});
