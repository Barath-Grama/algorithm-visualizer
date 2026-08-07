import type { AlgorithmStep } from "@/types";
import {
  bubbleSortSteps,
  insertionSortSteps,
  quickSortSteps,
  mergeSortSteps,
  heapSortSteps,
} from "@/algorithms/sorting";
import {
  linearSearchSteps,
  binarySearchSteps,
  jumpSearchSteps,
} from "@/algorithms/searching";
import {
  bfsSteps,
  dfsSteps,
  dijkstraSteps,
  bellmanFordSteps,
  primSteps,
  kruskalSteps,
} from "@/algorithms/graph";
import { knapsackSteps, fibonacciSteps, type KnapsackItem } from "@/algorithms/dp";
import { nQueensSteps } from "@/algorithms/backtracking";
import { generateArray, makeRng } from "@/algorithms/helpers";
import { buildSampleGraph } from "@/algorithms/graphData";

export type Distribution = "random" | "sorted" | "reversed" | "nearly-sorted";

export interface RunOptions {
  arraySize: number;
  distribution: Distribution;
  searchTarget?: number;
  graphStart: string;
  knapsackCapacity: number;
  fibN: number;
  /** Top-down memoization vs. naive recursion for the Fibonacci call tree. */
  fibMemoized: boolean;
  queensN: number;
}

export const DEFAULT_RUN_OPTIONS: RunOptions = {
  arraySize: 20,
  distribution: "random",
  graphStart: "A",
  knapsackCapacity: 15,
  fibN: 6,
  fibMemoized: false,
  queensN: 6,
};

export const SAMPLE_KNAPSACK_ITEMS: KnapsackItem[] = [
  { name: "Camera", weight: 4, value: 40 },
  { name: "Laptop", weight: 5, value: 55 },
  { name: "Watch", weight: 2, value: 20 },
  { name: "Book", weight: 3, value: 18 },
  { name: "Jacket", weight: 6, value: 32 },
];

export const MAX_STEPS = 6000;

interface Materialized {
  steps: AlgorithmStep[];
  /** True when the generator was cut off at MAX_STEPS rather than finishing. */
  truncated: boolean;
}

function materialize(gen: Generator<AlgorithmStep, void, unknown>): Materialized {
  const steps: AlgorithmStep[] = [];
  for (const step of gen) {
    steps.push(step);
    if (steps.length >= MAX_STEPS) {
      // The generator still had more to yield, so this run is incomplete.
      return { steps, truncated: !gen.next().done };
    }
  }
  return { steps, truncated: false };
}

export interface RunResult {
  steps: AlgorithmStep[];
  inputSummary: string;
  /** Set when the run hit MAX_STEPS; the last step is not the real end. */
  truncated: boolean;
  /** The value a search algorithm actually looked for (explicit or auto-picked). */
  resolvedTarget?: number;
}

/**
 * The option fields that actually change a given algorithm's run. Callers key
 * their memoization on this so that, say, nudging the Fibonacci slider does not
 * re-roll the array a sorting visualization is currently paused on.
 */
export function relevantOptions(algorithmId: string, options: RunOptions): unknown[] {
  switch (algorithmId) {
    case "bubble-sort":
    case "insertion-sort":
    case "quick-sort":
    case "merge-sort":
    case "heap-sort":
      return [options.arraySize, options.distribution];
    case "linear-search":
    case "binary-search":
    case "jump-search":
      return [options.arraySize, options.searchTarget ?? null];
    case "bfs":
    case "dfs":
    case "dijkstra":
    case "bellman-ford":
    case "prim":
      return [options.graphStart];
    case "kruskal":
      return [];
    case "knapsack":
      return [options.knapsackCapacity];
    case "fibonacci":
      return [options.fibN, options.fibMemoized];
    case "n-queens":
      return [options.queensN];
    default:
      return [];
  }
}

/** True when re-seeding ("New Random Input") changes anything for this algorithm. */
export function usesRandomInput(algorithmId: string): boolean {
  switch (algorithmId) {
    case "bubble-sort":
    case "insertion-sort":
    case "quick-sort":
    case "merge-sort":
    case "heap-sort":
    case "linear-search":
    case "binary-search":
    case "jump-search":
      return true;
    default:
      return false;
  }
}

export function runAlgorithm(algorithmId: string, options: RunOptions, seed = 0): RunResult {
  const rng = makeRng(seed * 0x9e3779b9 + 1);
  switch (algorithmId) {
    // --- Sorting ---
    case "bubble-sort":
    case "insertion-sort":
    case "quick-sort":
    case "merge-sort":
    case "heap-sort": {
      const arr = generateArray(options.arraySize, options.distribution, rng);
      const genFn = {
        "bubble-sort": bubbleSortSteps,
        "insertion-sort": insertionSortSteps,
        "quick-sort": quickSortSteps,
        "merge-sort": mergeSortSteps,
        "heap-sort": heapSortSteps,
      }[algorithmId]!;
      return {
        ...materialize(genFn(arr)),
        inputSummary: `${arr.length} elements, ${options.distribution} order`,
      };
    }

    // --- Searching ---
    case "linear-search":
    case "binary-search":
    case "jump-search": {
      // Binary and jump search sort their own input (it is their precondition),
      // so this only builds the raw array. The target is drawn from it either
      // way, since sorting does not change which values are present.
      const arr = generateArray(options.arraySize, "random", rng);
      const target = options.searchTarget ?? arr[Math.floor(rng() * arr.length)];
      const genFn = {
        "linear-search": linearSearchSteps,
        "binary-search": binarySearchSteps,
        "jump-search": jumpSearchSteps,
      }[algorithmId]!;
      return {
        ...materialize(genFn(arr, target)),
        inputSummary: `${arr.length} elements, target = ${target}`,
        resolvedTarget: target,
      };
    }

    // --- Graph ---
    case "bfs":
    case "dfs":
    case "dijkstra":
    case "bellman-ford":
    case "prim":
    case "kruskal": {
      const { nodes, edges } = buildSampleGraph();
      const start = options.graphStart || nodes[0].id;
      let gen: Generator<AlgorithmStep, void, unknown>;
      switch (algorithmId) {
        case "bfs":
          gen = bfsSteps(nodes, edges, start);
          break;
        case "dfs":
          gen = dfsSteps(nodes, edges, start);
          break;
        case "dijkstra":
          gen = dijkstraSteps(nodes, edges, start);
          break;
        case "bellman-ford":
          gen = bellmanFordSteps(nodes, edges, start);
          break;
        case "prim":
          gen = primSteps(nodes, edges, start);
          break;
        case "kruskal":
        default:
          gen = kruskalSteps(nodes, edges);
          break;
      }
      return {
        ...materialize(gen),
        inputSummary: `${nodes.length} nodes, ${edges.length} edges, source = ${start}`,
      };
    }

    // --- Dynamic Programming ---
    case "knapsack": {
      const capacity = options.knapsackCapacity;
      return {
        ...materialize(knapsackSteps(SAMPLE_KNAPSACK_ITEMS, capacity)),
        inputSummary: `${SAMPLE_KNAPSACK_ITEMS.length} items, capacity = ${capacity}`,
      };
    }
    case "fibonacci": {
      const n = Math.min(options.fibN, 10);
      return {
        ...materialize(fibonacciSteps(n, options.fibMemoized)),
        inputSummary: `fib(${n}), ${options.fibMemoized ? "memoized" : "naive recursion"}`,
      };
    }

    // --- Backtracking ---
    case "n-queens": {
      const n = Math.min(Math.max(options.queensN, 4), 8);
      return {
        ...materialize(nQueensSteps(n)),
        inputSummary: `${n}×${n} board`,
      };
    }

    default:
      return { steps: [], inputSummary: "Unknown algorithm", truncated: false };
  }
}
