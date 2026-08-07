import { describe, expect, it } from "vitest";
import {
  GROWTH_MODELS,
  bestFit,
  fitModel,
  formatR2,
  parseComplexity,
  rankModels,
  type Observation,
} from "./curveFit";

const sizes = [10, 20, 40, 80, 160, 320];
const synthetic = (f: (n: number) => number, scale = 3): Observation[] =>
  sizes.map((n) => ({ n, y: scale * f(n) }));

describe("fitModel", () => {
  it("recovers the scale factor exactly for noiseless data", () => {
    const model = GROWTH_MODELS.find((m) => m.key === "n2")!;
    const fit = fitModel(synthetic(model.f, 7), model);
    expect(fit.scale).toBeCloseTo(7, 6);
    expect(fit.r2).toBeCloseTo(1, 6);
  });

  it("reports a poor fit for the wrong shape", () => {
    const quadratic = GROWTH_MODELS.find((m) => m.key === "n2")!;
    const linear = GROWTH_MODELS.find((m) => m.key === "n")!;
    expect(fitModel(synthetic(quadratic.f), linear).r2).toBeLessThan(0.95);
  });

  it("treats a constant series as a perfect O(1) fit and nothing else", () => {
    const flat: Observation[] = sizes.map((n) => ({ n, y: 42 }));
    expect(fitModel(flat, GROWTH_MODELS.find((m) => m.key === "1")!).r2).toBe(1);
    expect(fitModel(flat, GROWTH_MODELS.find((m) => m.key === "n2")!).r2).toBe(0);
  });
});

describe("bestFit", () => {
  it.each(GROWTH_MODELS.filter((m) => m.key !== "2n").map((m) => [m.key, m] as const))(
    "identifies %s from clean data",
    (_key, model) => {
      expect(bestFit(synthetic(model.f))!.model.key).toBe(model.key);
    }
  );

  it("still identifies the right shape with 5% noise", () => {
    const quadratic = GROWTH_MODELS.find((m) => m.key === "n2")!;
    // Deterministic pseudo-noise so the test cannot flake.
    const noisy = sizes.map((n, i) => ({
      n,
      y: 3 * quadratic.f(n) * (1 + ((i % 3) - 1) * 0.05),
    }));
    expect(bestFit(noisy)!.model.key).toBe("n2");
  });

  it("returns null for insufficient data", () => {
    expect(bestFit([])).toBeNull();
    expect(bestFit([{ n: 10, y: 100 }])).toBeNull();
  });

  it("ranks models best-first", () => {
    const ranked = rankModels(synthetic(GROWTH_MODELS.find((m) => m.key === "nlogn")!.f));
    for (let i = 1; i < ranked.length; i++) {
      expect(ranked[i - 1].r2).toBeGreaterThanOrEqual(ranked[i].r2);
    }
  });
});

describe("parseComplexity", () => {
  it.each([
    ["O(1)", "1"],
    ["O(log n)", "logn"],
    ["O(√n)", "sqrtn"],
    ["O(n)", "n"],
    ["O(n log n)", "nlogn"],
    ["O(n²)", "n2"],
  ])("maps %s to the %s model", (input, expected) => {
    expect(parseComplexity(input)?.key).toBe(expected);
  });

  it("returns null for classes with no single-variable shape", () => {
    for (const c of ["O(V+E)", "O(nW)", "O(N!)", "O((V+E) log V)"]) {
      expect(parseComplexity(c), c).toBeNull();
    }
  });
});

describe("formatR2", () => {
  it("clamps negatives and handles non-finite values", () => {
    expect(formatR2(0.98765)).toBe("0.988");
    expect(formatR2(-3)).toBe("0.000");
    expect(formatR2(Number.NaN)).toBe("—");
  });
});
