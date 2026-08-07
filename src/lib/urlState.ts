import { getAlgorithm, ALGORITHMS } from "./algorithmRegistry";
import { DEFAULT_RUN_OPTIONS, type Distribution, type RunOptions } from "./runAlgorithm";

/**
 * Serialises the visualiser's configuration to the query string so a run can be
 * linked, bookmarked and reopened exactly as it was.
 *
 * Only values that differ from the defaults are written, which keeps a plain
 * visit to `/` clean and makes a shared link show what was deliberately chosen.
 */

export interface UrlState {
  algorithmId: string;
  options: RunOptions;
  seed: number;
}

const DISTRIBUTIONS: Distribution[] = ["random", "sorted", "reversed", "nearly-sorted"];

function clampInt(raw: string | null, min: number, max: number, fallback: number): number {
  const value = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(value)) return fallback;
  return Math.min(Math.max(value, min), max);
}

/** Reads state from search params, falling back to defaults for anything absent or invalid. */
export function readUrlState(params: URLSearchParams): UrlState {
  const requested = params.get("algo");
  const algorithmId = requested && getAlgorithm(requested) ? requested : ALGORITHMS[0].id;

  const distribution = params.get("dist");
  const target = params.get("target");

  return {
    algorithmId,
    seed: clampInt(params.get("seed"), 0, Number.MAX_SAFE_INTEGER, 0),
    options: {
      ...DEFAULT_RUN_OPTIONS,
      arraySize: clampInt(params.get("size"), 5, 60, DEFAULT_RUN_OPTIONS.arraySize),
      distribution: DISTRIBUTIONS.includes(distribution as Distribution)
        ? (distribution as Distribution)
        : DEFAULT_RUN_OPTIONS.distribution,
      // An absent target means "auto-pick"; only a valid number overrides it.
      searchTarget:
        target === null || !Number.isFinite(Number(target)) ? undefined : Number(target),
      graphStart: /^[A-G]$/.test(params.get("start") ?? "")
        ? params.get("start")!
        : DEFAULT_RUN_OPTIONS.graphStart,
      knapsackCapacity: clampInt(
        params.get("cap"),
        5,
        25,
        DEFAULT_RUN_OPTIONS.knapsackCapacity
      ),
      fibN: clampInt(params.get("fibN"), 2, 10, DEFAULT_RUN_OPTIONS.fibN),
      fibMemoized: params.get("memo") === "1",
      queensN: clampInt(params.get("queensN"), 4, 8, DEFAULT_RUN_OPTIONS.queensN),
    },
  };
}

/** Writes only what differs from the defaults. */
export function writeUrlState({ algorithmId, options, seed }: UrlState): URLSearchParams {
  const params = new URLSearchParams();
  const d = DEFAULT_RUN_OPTIONS;

  if (algorithmId !== ALGORITHMS[0].id) params.set("algo", algorithmId);
  if (seed !== 0) params.set("seed", String(seed));
  if (options.arraySize !== d.arraySize) params.set("size", String(options.arraySize));
  if (options.distribution !== d.distribution) params.set("dist", options.distribution);
  if (options.searchTarget !== undefined) params.set("target", String(options.searchTarget));
  if (options.graphStart !== d.graphStart) params.set("start", options.graphStart);
  if (options.knapsackCapacity !== d.knapsackCapacity)
    params.set("cap", String(options.knapsackCapacity));
  if (options.fibN !== d.fibN) params.set("fibN", String(options.fibN));
  if (options.fibMemoized) params.set("memo", "1");
  if (options.queensN !== d.queensN) params.set("queensN", String(options.queensN));

  return params;
}
