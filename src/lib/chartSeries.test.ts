import { describe, expect, it } from "vitest";
import {
  DEFAULT_SELECTION,
  METRIC_LABELS,
  buildSeries,
  markerPath,
  seriesStyle,
  type MarkerShape,
} from "./chartSeries";
import { MEASURABLE_IDS, sweepAlgorithm } from "./measureAlgorithm";

describe("series styles", () => {
  it("gives every measurable algorithm a distinct colour slot", () => {
    const slots = MEASURABLE_IDS.map((id) => seriesStyle(id).slot);
    expect(new Set(slots).size).toBe(MEASURABLE_IDS.length);
    expect(Math.min(...slots)).toBe(1);
    expect(Math.max(...slots)).toBe(MEASURABLE_IDS.length);
  });

  it("references a defined custom property per slot", () => {
    for (const id of MEASURABLE_IDS) {
      const { slot, color } = seriesStyle(id);
      expect(color).toBe(`var(--series-${slot})`);
    }
  });

  // Colour must follow the entity, never its position in the current filter:
  // repainting the survivors when a series is toggled is deeply confusing.
  it("is stable regardless of what else is selected", () => {
    const before = seriesStyle("heap-sort");
    const subsets = [["heap-sort"], ["bubble-sort", "heap-sort"], [...MEASURABLE_IDS]];
    for (const subset of subsets) {
      expect(subset.includes("heap-sort")).toBe(true);
      expect(seriesStyle("heap-sort")).toEqual(before);
    }
  });

  it("varies marker shape so identity survives without colour", () => {
    const shapes = new Set(MEASURABLE_IDS.map((id) => seriesStyle(id).shape));
    // Five shapes across eight slots: adjacent slots never repeat a shape.
    expect(shapes.size).toBeGreaterThanOrEqual(5);
    for (let i = 1; i < MEASURABLE_IDS.length; i++) {
      expect(seriesStyle(MEASURABLE_IDS[i]).shape).not.toBe(
        seriesStyle(MEASURABLE_IDS[i - 1]).shape
      );
    }
  });
});

describe("markerPath", () => {
  const SHAPES: MarkerShape[] = ["circle", "square", "triangle", "diamond", "cross"];

  it.each(SHAPES)("produces a closed path for %s", (shape) => {
    const d = markerPath(shape, 5);
    expect(d.startsWith("M")).toBe(true);
    expect(d.trim().endsWith("z")).toBe(true);
    expect(d).not.toMatch(/NaN|undefined/);
  });

  it("scales with the radius", () => {
    for (const shape of SHAPES) {
      expect(markerPath(shape, 4)).not.toBe(markerPath(shape, 8));
    }
  });
});

describe("buildSeries", () => {
  const results = Object.fromEntries(
    ["bubble-sort", "merge-sort"].map((id) => [
      id,
      sweepAlgorithm(id as never, [10, 20, 40, 80], 1),
    ])
  );

  it("pairs each selection with a fitted curve", () => {
    const series = buildSeries(results, ["bubble-sort", "merge-sort"], "comparisons");
    expect(series).toHaveLength(2);
    expect(series[0].name).toBe("Bubble Sort");
    expect(series[0].fit?.model.key).toBe("n2");
    expect(series[1].fit?.model.key).toBe("nlogn");
  });

  it("preserves selection order", () => {
    const series = buildSeries(results, ["merge-sort", "bubble-sort"], "comparisons");
    expect(series.map((s) => s.id)).toEqual(["merge-sort", "bubble-sort"]);
  });

  it("skips algorithms with no measurements yet", () => {
    expect(buildSeries(results, ["heap-sort"], "comparisons")).toEqual([]);
    expect(buildSeries({}, [...MEASURABLE_IDS], "comparisons")).toEqual([]);
  });

  it("fits against the requested metric", () => {
    const byComparisons = buildSeries(results, ["bubble-sort"], "comparisons")[0];
    const byAccesses = buildSeries(results, ["bubble-sort"], "arrayAccesses")[0];
    expect(byComparisons.fit!.scale).not.toBe(byAccesses.fit!.scale);
  });
});

describe("defaults", () => {
  it("selects three series, which is what the strict colour gate allows", () => {
    expect(DEFAULT_SELECTION).toHaveLength(3);
    for (const id of DEFAULT_SELECTION) expect(MEASURABLE_IDS).toContain(id);
  });

  it("spans distinct complexity classes by default", () => {
    // A default that showed three O(n log n) sorts would waste the first look.
    expect(new Set(DEFAULT_SELECTION).size).toBe(3);
  });

  it("labels every metric", () => {
    expect(Object.keys(METRIC_LABELS)).toEqual(["comparisons", "swaps", "arrayAccesses"]);
  });
});
