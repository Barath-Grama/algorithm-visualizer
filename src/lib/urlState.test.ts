import { describe, expect, it } from "vitest";
import { ALGORITHMS } from "./algorithmRegistry";
import { DEFAULT_RUN_OPTIONS, type RunOptions } from "./runAlgorithm";
import { readUrlState, writeUrlState, type UrlState } from "./urlState";

const roundTrip = (state: UrlState): UrlState => readUrlState(writeUrlState(state));
const base: UrlState = {
  algorithmId: ALGORITHMS[0].id,
  options: DEFAULT_RUN_OPTIONS,
  seed: 0,
};

describe("readUrlState", () => {
  it("returns defaults for an empty query string", () => {
    expect(readUrlState(new URLSearchParams())).toEqual(base);
  });

  it("falls back to the default algorithm for an unknown id", () => {
    expect(readUrlState(new URLSearchParams("algo=not-real")).algorithmId).toBe(
      ALGORITHMS[0].id
    );
  });

  it("clamps out-of-range numbers rather than trusting them", () => {
    const { options } = readUrlState(
      new URLSearchParams("size=99999&fibN=-4&queensN=40&cap=1")
    );
    expect(options.arraySize).toBe(60);
    expect(options.fibN).toBe(2);
    expect(options.queensN).toBe(8);
    expect(options.knapsackCapacity).toBe(5);
  });

  it("ignores junk values", () => {
    const { options, seed } = readUrlState(
      new URLSearchParams("size=abc&dist=sideways&start=Z&seed=nope")
    );
    expect(options.arraySize).toBe(DEFAULT_RUN_OPTIONS.arraySize);
    expect(options.distribution).toBe(DEFAULT_RUN_OPTIONS.distribution);
    expect(options.graphStart).toBe(DEFAULT_RUN_OPTIONS.graphStart);
    expect(seed).toBe(0);
  });

  it("treats an absent target as auto-pick", () => {
    expect(readUrlState(new URLSearchParams()).options.searchTarget).toBeUndefined();
    expect(readUrlState(new URLSearchParams("target=42")).options.searchTarget).toBe(42);
  });
});

describe("writeUrlState", () => {
  it("emits nothing when everything is default", () => {
    expect(writeUrlState(base).toString()).toBe("");
  });

  it("emits only what differs", () => {
    const params = writeUrlState({
      ...base,
      algorithmId: "quick-sort",
      options: { ...DEFAULT_RUN_OPTIONS, arraySize: 42 },
    });
    expect(params.get("algo")).toBe("quick-sort");
    expect(params.get("size")).toBe("42");
    expect(params.get("fibN")).toBeNull();
    expect(params.get("cap")).toBeNull();
  });
});

describe("round trip", () => {
  const cases: [string, Partial<UrlState>][] = [
    ["defaults", {}],
    ["algorithm", { algorithmId: "heap-sort" }],
    ["seed", { seed: 7 }],
    ["array size", { options: { ...DEFAULT_RUN_OPTIONS, arraySize: 33 } }],
    [
      "distribution",
      { options: { ...DEFAULT_RUN_OPTIONS, distribution: "reversed" as const } },
    ],
    ["search target", { options: { ...DEFAULT_RUN_OPTIONS, searchTarget: 77 } }],
    ["graph start", { options: { ...DEFAULT_RUN_OPTIONS, graphStart: "E" } }],
    ["knapsack capacity", { options: { ...DEFAULT_RUN_OPTIONS, knapsackCapacity: 22 } }],
    ["fibonacci memoized", { options: { ...DEFAULT_RUN_OPTIONS, fibN: 9, fibMemoized: true } }],
    ["queens", { options: { ...DEFAULT_RUN_OPTIONS, queensN: 7 } }],
  ];

  it.each(cases)("preserves %s", (_label, patch) => {
    const state = { ...base, ...patch };
    expect(roundTrip(state)).toEqual(state);
  });

  it("preserves every algorithm id", () => {
    for (const a of ALGORITHMS) {
      expect(roundTrip({ ...base, algorithmId: a.id }).algorithmId).toBe(a.id);
    }
  });

  it("preserves a fully non-default configuration", () => {
    const options: RunOptions = {
      arraySize: 51,
      distribution: "nearly-sorted",
      searchTarget: 13,
      graphStart: "F",
      knapsackCapacity: 19,
      fibN: 8,
      fibMemoized: true,
      queensN: 5,
    };
    const state: UrlState = { algorithmId: "jump-search", options, seed: 12 };
    expect(roundTrip(state)).toEqual(state);
  });
});
