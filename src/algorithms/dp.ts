import type { AlgorithmStep, RecursionTreeNode, StepGenerator, StepMetrics } from "@/types";
import { freshMetrics } from "./helpers";

export interface KnapsackItem {
  name: string;
  weight: number;
  value: number;
}

// ---------------------------------------------------------------------------
// 0/1 Knapsack — O(n * W) time and space
// ---------------------------------------------------------------------------
export function* knapsackSteps(items: KnapsackItem[], capacity: number): StepGenerator {
  const n = items.length;
  const metrics = freshMetrics();
  const table: (number | null)[][] = Array.from({ length: n + 1 }, () =>
    new Array(capacity + 1).fill(null)
  );
  for (let w = 0; w <= capacity; w++) table[0][w] = 0;

  const rowLabels = ["∅", ...items.map((it) => it.name)];
  const colLabels = Array.from({ length: capacity + 1 }, (_, w) => `w:${w}`);

  function snapshot(
    description: string,
    codeLine: number[],
    activeCell?: [number, number],
    sourceCells?: [number, number][]
  ): AlgorithmStep {
    return {
      description,
      metrics: { ...metrics },
      dp: {
        rowLabels,
        colLabels,
        table: table.map((row) => [...row]),
        activeCell,
        sourceCells,
      },
      codeLine,
    };
  }

  yield snapshot("Base row: zero items → zero value for any capacity.", [2]);

  for (let i = 1; i <= n; i++) {
    const item = items[i - 1];
    for (let w = 0; w <= capacity; w++) {
      metrics.arrayAccesses++;
      if (item.weight > w) {
        table[i][w] = table[i - 1][w];
        metrics.comparisons++;
        yield snapshot(
          `${item.name} (wt ${item.weight}) doesn't fit in capacity ${w} — carry forward.`,
          [7, 8],
          [i, w],
          [[i - 1, w]]
        );
      } else {
        const include = item.value + (table[i - 1][w - item.weight] as number);
        const exclude = table[i - 1][w] as number;
        metrics.comparisons++;
        table[i][w] = Math.max(include, exclude);
        yield snapshot(
          `dp[${i}][${w}] = max(include=${include}, exclude=${exclude}) = ${table[i][w]}.`,
          [5, 6],
          [i, w],
          [
            [i - 1, w],
            [i - 1, w - item.weight],
          ]
        );
      }
    }
  }

  // Backtrack to find selected items
  const selected: [number, number][] = [];
  let w = capacity;
  for (let i = n; i > 0; i--) {
    if (table[i][w] !== table[i - 1][w]) {
      selected.push([i, w]);
      w -= items[i - 1].weight;
    }
  }
  yield {
    description: `Optimal value: ${table[n][capacity]}. Backtracking to reconstruct chosen items.`,
    metrics: { ...metrics },
    dp: {
      rowLabels,
      colLabels,
      table: table.map((row) => [...row]),
      selectedCells: selected,
    },
    codeLine: [9],
  };
}

// ---------------------------------------------------------------------------
// Fibonacci — naive recursion O(2^n) vs. memoized O(n)
// ---------------------------------------------------------------------------
export function* fibonacciSteps(n: number, memoized: boolean): StepGenerator {
  const metrics: StepMetrics = freshMetrics();
  const nodes: RecursionTreeNode[] = [];
  const computed = new Map<number, number>();
  let idCounter = 0;

  function snapshot(description: string, codeLine: number[], activeId?: string): AlgorithmStep {
    return {
      description,
      metrics: { ...metrics },
      // Only the naive tree needs reserved slots: memoization prunes it small
      // enough that the compact layout barely shifts.
      tree: { nodes: nodes.map((n) => ({ ...n })), activeId, reserveNaiveWidth: !memoized },
      codeLine,
    };
  }

  function* fib(k: number, parentId: string | null, depth: number): Generator<AlgorithmStep, number, unknown> {
    const id = `n${idCounter++}`;
    const isDuplicate = !memoized && nodes.some((existing) => existing.label === `fib(${k})`);
    nodes.push({
      id,
      label: `fib(${k})`,
      parentId,
      depth,
      duplicate: isDuplicate,
      status: "active",
    });
    metrics.arrayAccesses++;
    yield snapshot(`Calling fib(${k}).`, [1], id);

    if (memoized && computed.has(k)) {
      const cached = computed.get(k)!;
      const node = nodes[nodes.length - 1];
      node.status = "cached";
      node.value = cached;
      metrics.comparisons++;
      yield snapshot(`fib(${k}) already cached → return ${cached} instantly.`, [2], id);
      return cached;
    }

    if (k <= 1) {
      const node = nodes[nodes.length - 1];
      node.status = "resolved";
      node.value = k;
      yield snapshot(`Base case: fib(${k}) = ${k}.`, [3], id);
      if (memoized) computed.set(k, k);
      return k;
    }

    const left = yield* fib(k - 1, id, depth + 1);
    const right = yield* fib(k - 2, id, depth + 1);
    const result = left + right;
    const node = nodes.find((n) => n.id === id)!;
    node.status = "resolved";
    node.value = result;
    metrics.swaps++;
    if (memoized) computed.set(k, result);
    yield snapshot(`fib(${k}) = fib(${k - 1}) + fib(${k - 2}) = ${left} + ${right} = ${result}.`, [4, 5], id);
    return result;
  }

  yield snapshot(
    memoized
      ? `Computing fib(${n}) with memoization — cached results are reused.`
      : `Computing fib(${n}) with naive recursion — watch for repeated subtrees.`,
    [1]
  );
  yield* fib(n, null, 0);
  yield snapshot(`Done. Total recursive calls: ${nodes.length}.`, [1]);
}
