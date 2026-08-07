import { describe, expect, it } from "vitest";
import { ALGORITHMS, CATEGORY_LABELS, CATEGORY_ORDER, getAlgorithm } from "./algorithmRegistry";
import { DEFAULT_RUN_OPTIONS, runAlgorithm } from "./runAlgorithm";

describe("registry integrity", () => {
  it("has unique ids", () => {
    const ids = ALGORITHMS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("labels every category it uses", () => {
    for (const a of ALGORITHMS) {
      expect(CATEGORY_ORDER).toContain(a.category);
      expect(CATEGORY_LABELS[a.category]).toBeTruthy();
    }
  });

  it("resolves every id through getAlgorithm", () => {
    for (const a of ALGORITHMS) expect(getAlgorithm(a.id)).toBe(a);
    expect(getAlgorithm("nope")).toBeUndefined();
  });

  it("fills in every metadata field", () => {
    for (const a of ALGORITHMS) {
      expect(a.name, a.id).toBeTruthy();
      expect(a.description.length, a.id).toBeGreaterThan(40);
      expect(a.pseudocode, a.id).toBeTruthy();
      expect(a.code, a.id).toBeTruthy();
      for (const key of ["best", "average", "worst", "space"] as const) {
        expect(a.complexity[key], `${a.id}.${key}`).toMatch(/^O\(/);
      }
    }
  });
});

// Steps report pseudocode line numbers, which the Code tab translates through
// codeLineMap. Without these checks a reworded pseudocode block would silently
// start highlighting the wrong line — the exact bug this map was added to fix.
describe("codeLineMap", () => {
  it.each(ALGORITHMS.map((a) => [a.id, a] as const))(
    "%s maps only real lines in both directions",
    (_id, a) => {
      const pseudoLines = a.pseudocode.split("\n").length;
      const codeLines = a.code.split("\n").length;

      for (const [key, targets] of Object.entries(a.codeLineMap)) {
        const line = Number(key);
        expect(line, "pseudocode line in range").toBeGreaterThanOrEqual(1);
        expect(line).toBeLessThanOrEqual(pseudoLines);
        expect(targets.length, `line ${line} maps somewhere`).toBeGreaterThan(0);
        for (const target of targets) {
          expect(target, `maps ${line} -> ${target}`).toBeGreaterThanOrEqual(1);
          expect(target).toBeLessThanOrEqual(codeLines);
        }
      }
    }
  );

  it("covers every line the algorithms actually emit", () => {
    const problems: string[] = [];

    // Sweeping option variants matters: under default options a search always
    // finds its target, so the "not found" branches — and the pseudocode lines
    // only they emit — would never be exercised. Mutation testing caught this.
    const VARIANTS = [
      {},
      { fibMemoized: true },
      { searchTarget: 999 }, // above every element: failure path
      { searchTarget: -1 }, // below every element: failure path
      { distribution: "sorted" as const },
      { distribution: "reversed" as const },
      { distribution: "nearly-sorted" as const },
      { arraySize: 5 },
      { arraySize: 45 },
      { knapsackCapacity: 5 },
      { knapsackCapacity: 25 },
      { fibN: 2 },
      { fibN: 9 },
      { queensN: 4 },
      { queensN: 8 },
      { graphStart: "D" },
      { graphStart: "G" },
    ];

    for (const a of ALGORITHMS) {
      const pseudoLines = a.pseudocode.split("\n").length;

      for (const variant of VARIANTS) {
        for (const seed of [0, 1]) {
          const { steps } = runAlgorithm(a.id, { ...DEFAULT_RUN_OPTIONS, ...variant }, seed);
          for (const step of steps) {
            for (const line of step.codeLine ?? []) {
              if (line < 1 || line > pseudoLines) {
                problems.push(`${a.id}: emits line ${line}, pseudocode has ${pseudoLines}`);
              } else if (!a.codeLineMap[line]) {
                problems.push(`${a.id}: emits line ${line} with no codeLineMap entry`);
              }
            }
          }
        }
      }
    }

    expect([...new Set(problems)]).toEqual([]);
  });

  it("maps every line the algorithms can emit, with none left unreachable", () => {
    // The inverse check: a map entry that nothing ever emits is dead weight and
    // usually means the pseudocode was renumbered without updating the map.
    const emitted = new Map<string, Set<number>>();

    for (const a of ALGORITHMS) {
      const seen = new Set<number>();
      for (const variant of [{}, { fibMemoized: true }, { searchTarget: 999 }]) {
        const { steps } = runAlgorithm(a.id, { ...DEFAULT_RUN_OPTIONS, ...variant }, 0);
        for (const step of steps) for (const line of step.codeLine ?? []) seen.add(line);
      }
      emitted.set(a.id, seen);
    }

    for (const a of ALGORITHMS) {
      const seen = emitted.get(a.id)!;
      expect(seen.size, `${a.id} emits no lines at all`).toBeGreaterThan(0);
      for (const line of seen) {
        expect(a.codeLineMap[line], `${a.id} emits unmapped line ${line}`).toBeDefined();
      }
    }
  });
});
