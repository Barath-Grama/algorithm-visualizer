import { describe, expect, it } from "vitest";
import { getAlgorithm } from "./algorithmRegistry";
import { bestFit, parseComplexity, rankModels, type Observation } from "./curveFit";
import {
  MEASURABLE_IDS,
  defaultSizes,
  isMeasurable,
  measureAlgorithm,
  sweepAlgorithm,
  type MeasurableId,
} from "./measureAlgorithm";

describe("measureAlgorithm", () => {
  it("is deterministic for a given seed", () => {
    for (const id of MEASURABLE_IDS) {
      const a = measureAlgorithm(id, 40, 1);
      const b = measureAlgorithm(id, 40, 1);
      expect(a, id).toEqual(b);
    }
  });

  it("reports non-zero work for every measurable algorithm", () => {
    for (const id of MEASURABLE_IDS) {
      expect(measureAlgorithm(id, 40, 0).comparisons, id).toBeGreaterThan(0);
    }
  });

  it("runs well past the step cap that constrains the visualiser", () => {
    // runAlgorithm would stop at MAX_STEPS (6000); this path retains nothing,
    // so a quadratic sort at n=600 (~180k comparisons) is still cheap.
    const m = measureAlgorithm("bubble-sort", 600, 0);
    expect(m.comparisons).toBeGreaterThan(100_000);
  });

  it("grows monotonically with n for the quadratic sorts", () => {
    for (const id of ["bubble-sort", "insertion-sort"] as MeasurableId[]) {
      let previous = 0;
      for (const n of [20, 40, 80, 160]) {
        const c = measureAlgorithm(id, n, 0).comparisons;
        expect(c, `${id} at n=${n}`).toBeGreaterThan(previous);
        previous = c;
      }
    }
  });

  it("shows insertion sort beating bubble sort on nearly-sorted data", () => {
    const opts = { distribution: "nearly-sorted" as const };
    expect(measureAlgorithm("insertion-sort", 120, 0, opts).comparisons).toBeLessThan(
      measureAlgorithm("bubble-sort", 120, 0, opts).comparisons
    );
  });

  it("distinguishes present from absent search targets", () => {
    const present = measureAlgorithm("linear-search", 200, 0, { searchTargetMode: "present" });
    const absent = measureAlgorithm("linear-search", 200, 0, { searchTargetMode: "absent" });
    // A miss must scan the whole array; a hit stops early on average.
    expect(absent.comparisons).toBeGreaterThanOrEqual(present.comparisons);
    expect(absent.comparisons).toBe(200);
  });

  it("identifies which algorithms are measurable", () => {
    expect(isMeasurable("bubble-sort")).toBe(true);
    expect(isMeasurable("dijkstra")).toBe(false);
    expect(isMeasurable("knapsack")).toBe(false);
  });
});

describe("sweepAlgorithm", () => {
  it("averages across trials and returns one point per size", () => {
    const sizes = [10, 20, 30];
    const points = sweepAlgorithm("quick-sort", sizes, 3);
    expect(points.map((p) => p.n)).toEqual(sizes);
    for (const p of points) expect(p.comparisons).toBeGreaterThan(0);
  });

  it("produces an increasing, well-spread set of default sizes", () => {
    const sizes = defaultSizes(400);
    expect(sizes.length).toBeGreaterThan(8);
    expect(sizes.at(-1)).toBe(400);
    for (let i = 1; i < sizes.length; i++) expect(sizes[i]).toBeGreaterThan(sizes[i - 1]);
  });
});

/**
 * The payoff test: the app displays a Big-O for every algorithm, and this
 * checks those claims against what the implementations actually do. A wrong
 * label in the registry, or an implementation that silently regressed to a
 * worse complexity class, both surface here.
 */
describe("declared complexity matches measured behaviour", () => {
  const SIZES = defaultSizes(500, 12);
  const TRIALS = 3;

  it.each(MEASURABLE_IDS)("%s", (id) => {
    const declared = parseComplexity(getAlgorithm(id)!.complexity.average);
    expect(declared, `no parseable average-case complexity for ${id}`).not.toBeNull();

    // Searches are measured on their miss path: a successful search terminates
    // at a data-dependent point, which muddies the shape.
    const isSearch = id.endsWith("-search");
    const points: Observation[] = sweepAlgorithm(
      id,
      SIZES,
      TRIALS,
      isSearch ? { searchTargetMode: "absent" } : {}
    ).map((p) => ({ n: p.n, y: p.comparisons }));

    const ranked = rankModels(points);
    const top = ranked.slice(0, 2).map((f) => f.model.key);

    // Top-2 rather than top-1: adjacent classes (n vs n log n) are genuinely
    // close over a bounded range of n, and demanding an exact win would make
    // this flaky without saying anything more.
    expect(top, `${id}: declared ${declared!.label}, ranked ${ranked
      .slice(0, 3)
      .map((f) => `${f.model.label} r2=${f.r2.toFixed(3)}`)
      .join(", ")}`).toContain(declared!.key);

    // Whatever wins must actually explain the data.
    expect(bestFit(points)!.r2).toBeGreaterThan(0.9);
  });
});
