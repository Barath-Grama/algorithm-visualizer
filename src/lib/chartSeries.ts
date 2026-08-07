import { getAlgorithm } from "./algorithmRegistry";
import { bestFit, type Fit, type Observation } from "./curveFit";
import { MEASURABLE_IDS, type MeasurableId, type SamplePoint } from "./measureAlgorithm";

export type Metric = "comparisons" | "swaps" | "arrayAccesses";

export const METRIC_LABELS: Record<Metric, string> = {
  comparisons: "Comparisons",
  swaps: "Swaps / writes",
  arrayAccesses: "Array accesses",
};

export interface ChartSeries {
  id: MeasurableId;
  name: string;
  points: SamplePoint[];
  fit: Fit | null;
}

/** Pairs each selected algorithm's samples with its best-fitting growth curve. */
export function buildSeries(
  results: Record<string, SamplePoint[]>,
  selected: MeasurableId[],
  metric: Metric
): ChartSeries[] {
  return selected
    .filter((id) => results[id]?.length)
    .map((id) => {
      const points = results[id];
      const observations: Observation[] = points.map((p) => ({ n: p.n, y: p[metric] }));
      return {
        id,
        name: getAlgorithm(id)?.name ?? id,
        points,
        fit: bestFit(observations),
      };
    });
}

/**
 * Marker shapes, paired 1:1 with the colour slots.
 *
 * Colour alone cannot separate eight concurrent series — the palette clears the
 * adjacent-pair gate but not the all-pairs gate, and scatter markers overlap
 * freely near the origin. Shape is the secondary channel that keeps identity
 * readable under colour-vision deficiency, in greyscale print, and where two
 * markers land on the same pixel.
 */
export type MarkerShape = "circle" | "square" | "triangle" | "diamond" | "cross";

export interface SeriesStyle {
  /** 1-based categorical slot; drives the --series-N custom property. */
  slot: number;
  color: string;
  shape: MarkerShape;
}

/**
 * Fixed assignment: an algorithm keeps its colour and shape no matter which
 * others are on screen. Repainting survivors when a filter changes is the
 * single most confusing thing a multi-series chart can do.
 */
const STYLES: Record<MeasurableId, SeriesStyle> = Object.fromEntries(
  MEASURABLE_IDS.map((id, i) => [
    id,
    {
      slot: i + 1,
      color: `var(--series-${i + 1})`,
      shape: (["circle", "square", "triangle", "diamond", "cross"] as const)[i % 5],
    },
  ])
) as Record<MeasurableId, SeriesStyle>;

export function seriesStyle(id: MeasurableId): SeriesStyle {
  return STYLES[id];
}

/**
 * Default selection: three series clear the strict all-pairs colour gate on
 * their own, and these three span three different complexity classes.
 */
export const DEFAULT_SELECTION: MeasurableId[] = [
  "bubble-sort",
  "merge-sort",
  "binary-search",
];

/** SVG path for a marker of the given shape, centred on the origin. */
export function markerPath(shape: MarkerShape, r: number): string {
  switch (shape) {
    case "square":
      return `M${-r},${-r}h${r * 2}v${r * 2}h${-r * 2}z`;
    case "triangle":
      return `M0,${-r * 1.15}L${r},${r * 0.85}L${-r},${r * 0.85}z`;
    case "diamond":
      return `M0,${-r * 1.25}L${r * 1.25},0L0,${r * 1.25}L${-r * 1.25},0z`;
    case "cross":
      return `M${-r},${-r / 2.6}h${r - r / 2.6}v${-(r - r / 2.6)}h${r / 1.3}v${r - r / 2.6}h${r - r / 2.6}v${r / 1.3}h${-(r - r / 2.6)}v${r - r / 2.6}h${-r / 1.3}v${-(r - r / 2.6)}h${-(r - r / 2.6)}z`;
    case "circle":
    default:
      return `M0,${-r}A${r},${r} 0 1,0 0,${r}A${r},${r} 0 1,0 0,${-r}z`;
  }
}
