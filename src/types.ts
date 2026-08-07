// ---------------------------------------------------------------------------
// Core domain types for the Algorithm Visualization Tool
// ---------------------------------------------------------------------------

export type AlgorithmCategory =
  | "sorting"
  | "searching"
  | "graph"
  | "dp"
  | "backtracking";

export type VisualizationKind = "array" | "graph" | "dp-table" | "tree" | "board";

export interface ComplexityInfo {
  best: string;
  average: string;
  worst: string;
  space: string;
}

export interface AlgorithmMeta {
  id: string;
  name: string;
  category: AlgorithmCategory;
  visualization: VisualizationKind;
  complexity: ComplexityInfo;
  description: string;
  pseudocode: string;
  code: string;
  /**
   * Maps a 1-indexed `pseudocode` line to the 1-indexed `code` line(s) that
   * implement it. Steps report pseudocode lines (see `AlgorithmStep.codeLine`);
   * the Code tab translates them through this map. Without it a single set of
   * indices would be applied to two texts of different lengths.
   */
  codeLineMap: Record<number, number[]>;
}

// --- Metrics tracked across every algorithm run -----------------------------

export interface StepMetrics {
  comparisons: number;
  swaps: number;
  arrayAccesses: number;
}

// --- Array-based visualization state (sorting & searching) ------------------

export type ArrayElementState =
  | "default"
  | "comparing"
  | "swapping"
  | "sorted"
  | "pivot"
  | "found"
  | "eliminated"
  | "range";

export interface ArrayVizState {
  values: number[];
  states: ArrayElementState[];
  /** For block/range based algorithms like binary/jump search */
  rangeLabel?: string;
}

// --- Graph visualization state ----------------------------------------------

export interface GraphNode {
  id: string;
  x: number;
  y: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  weight?: number;
}

export type NodeState = "unvisited" | "queued" | "current" | "visited";
export type EdgeState = "default" | "relaxing" | "selected" | "rejected";

export interface GraphVizState {
  nodes: GraphNode[];
  edges: GraphEdge[];
  nodeStates: Record<string, NodeState>;
  edgeStates: Record<string, EdgeState>;
  distances?: Record<string, number | null>;
  frontier?: string[]; // queue / stack / priority queue contents, in order
  frontierLabel?: string;
}

// --- DP table visualization state -------------------------------------------

export interface DPTableVizState {
  rowLabels: string[];
  colLabels: string[];
  table: (number | null)[][];
  activeCell?: [number, number];
  sourceCells?: [number, number][];
  selectedCells?: [number, number][];
}

// --- Recursion tree visualization state (Fibonacci) -------------------------

export interface RecursionTreeNode {
  id: string;
  label: string;
  parentId: string | null;
  depth: number;
  duplicate: boolean;
  status: "active" | "resolved" | "cached";
  value?: number;
}

export interface TreeVizState {
  nodes: RecursionTreeNode[];
  activeId?: string;
  /**
   * Reserve horizontal space for the full naive call tree, derived from each
   * node's label. Costs width but keeps positions fixed as the tree grows —
   * without it, every newly discovered call re-centres its ancestors and the
   * whole drawing jitters sideways on each step.
   */
  reserveNaiveWidth?: boolean;
}

// --- Chessboard visualization state (N-Queens) -------------------------------

export interface BoardVizState {
  size: number;
  /** queens[row] = column, or -1 if unplaced */
  queens: number[];
  activeRow?: number;
  activeCol?: number;
  conflict?: boolean;
}

// --- Unified step -------------------------------------------------------------

export interface AlgorithmStep {
  description: string;
  metrics: StepMetrics;
  array?: ArrayVizState;
  graph?: GraphVizState;
  dp?: DPTableVizState;
  tree?: TreeVizState;
  board?: BoardVizState;
  /**
   * Line number(s) in the algorithm's `pseudocode` to highlight for this step,
   * 1-indexed. The Code tab maps these through `AlgorithmMeta.codeLineMap`.
   */
  codeLine?: number[];
}

export type StepGenerator = Generator<AlgorithmStep, void, unknown>;
