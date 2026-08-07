/**
 * Fits measured operation counts against candidate growth curves.
 *
 * The question this answers is "which complexity class does the measured data
 * actually look like?", not "what is the exact cost function". So each model is
 * fitted with a single scale factor through the origin — the shape is what
 * distinguishes O(n log n) from O(n^2), not the constant in front of it.
 */

export interface GrowthModel {
  key: string;
  /** Rendered label, e.g. "O(n log n)". */
  label: string;
  /** Shape function, evaluated at n. */
  f: (n: number) => number;
}

export const GROWTH_MODELS: GrowthModel[] = [
  { key: "1", label: "O(1)", f: () => 1 },
  { key: "logn", label: "O(log n)", f: (n) => Math.log2(Math.max(n, 2)) },
  { key: "sqrtn", label: "O(√n)", f: (n) => Math.sqrt(n) },
  { key: "n", label: "O(n)", f: (n) => n },
  { key: "nlogn", label: "O(n log n)", f: (n) => n * Math.log2(Math.max(n, 2)) },
  { key: "n2", label: "O(n²)", f: (n) => n * n },
  { key: "n3", label: "O(n³)", f: (n) => n * n * n },
  { key: "2n", label: "O(2ⁿ)", f: (n) => Math.pow(2, Math.min(n, 40)) },
];

export interface Fit {
  model: GrowthModel;
  /** Scale factor `a` in y ≈ a·f(n). */
  scale: number;
  /** Coefficient of determination; 1.0 is a perfect fit. */
  r2: number;
}

export interface Observation {
  n: number;
  y: number;
}

/**
 * Least-squares fit of `y ≈ a·f(n)` through the origin.
 * Minimising Σ(y - a·f)² gives a = Σ(y·f) / Σ(f²).
 */
export function fitModel(points: Observation[], model: GrowthModel): Fit {
  let numerator = 0;
  let denominator = 0;
  for (const { n, y } of points) {
    const f = model.f(n);
    numerator += y * f;
    denominator += f * f;
  }
  const scale = denominator === 0 ? 0 : numerator / denominator;

  const meanY = points.reduce((sum, p) => sum + p.y, 0) / points.length;
  let ssRes = 0;
  let ssTot = 0;
  for (const { n, y } of points) {
    const predicted = scale * model.f(n);
    ssRes += (y - predicted) ** 2;
    ssTot += (y - meanY) ** 2;
  }

  // ssTot === 0 means every observation is identical: a constant series. That
  // is a perfect O(1) fit and a meaningless fit for anything else.
  const r2 = ssTot === 0 ? (model.key === "1" ? 1 : 0) : 1 - ssRes / ssTot;
  return { model, scale, r2 };
}

/** Fits every candidate model, best R² first. */
export function rankModels(points: Observation[]): Fit[] {
  if (points.length < 2) return [];
  return GROWTH_MODELS.map((m) => fitModel(points, m)).sort((a, b) => b.r2 - a.r2);
}

export function bestFit(points: Observation[]): Fit | null {
  return rankModels(points)[0] ?? null;
}

/**
 * Maps a registry complexity string like "O(n log n)" onto a growth model, so a
 * measured fit can be compared against the complexity the app claims.
 * Returns null for classes with no single-variable shape here (e.g. "O(V+E)").
 */
export function parseComplexity(complexity: string): GrowthModel | null {
  const normalised = complexity
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[²₂]/g, "^2")
    .replace(/[³₃]/g, "^3")
    .replace(/[√]/g, "sqrt");

  const table: Record<string, string> = {
    "o(1)": "1",
    "o(logn)": "logn",
    "o(sqrtn)": "sqrtn",
    "o(sqrt(n))": "sqrtn",
    "o(n)": "n",
    "o(nlogn)": "nlogn",
    "o(n^2)": "n2",
    "o(n*n)": "n2",
    "o(n^3)": "n3",
    "o(2^n)": "2n",
  };

  const key = table[normalised];
  return GROWTH_MODELS.find((m) => m.key === key) ?? null;
}

/** Formats an R² for display without implying more precision than exists. */
export function formatR2(r2: number): string {
  if (!Number.isFinite(r2)) return "—";
  if (r2 < 0) return "0.000";
  return r2.toFixed(3);
}
