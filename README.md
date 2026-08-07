# Algorithm Visualization Tool

An interactive, web-based platform for visualizing algorithm execution
step-by-step — built with the same stack described in the accompanying
project report: **React 19 + TypeScript, Vite, Tailwind CSS, React Router,
and React Query**, rendering via Canvas/SVG.

## Getting started

```bash
npm install
npm run dev       # start the dev server (http://localhost:5173)
npm run build     # type-check + production build → dist/
npm run preview   # preview the production build locally
```

Requires Node.js 18+.

## What's included

**17 algorithms across 5 categories**, matching the report's curriculum:

| Category | Algorithms |
|---|---|
| Sorting | Bubble, Quick (median-of-three pivot), Merge, Heap, Insertion |
| Searching | Linear, Binary, Jump |
| Graph | BFS, DFS, Dijkstra, Bellman-Ford, Prim's MST, Kruskal's MST |
| Dynamic Programming | 0/1 Knapsack, Fibonacci (naive **and** memoized recursion tree) |
| Backtracking | N-Queens |

Every algorithm is implemented as a **JS generator function** (`function*`)
that yields one `AlgorithmStep` per observable operation — a step buffer /
`StepIterator` pattern, mirroring the architecture described in the report
(§5.6, `generateSteps → StepIterator → VisualizationState → Canvas`). The
player materializes the generator once per run so the UI can scrub freely
forward and backward.

### UI

- **Sidebar** — category-grouped, searchable algorithm list
- **Visualization Canvas** — dispatches to one of 5 visualizers depending on
  the algorithm's data shape:
  - `ArrayVisualizer` — animated bars (sorting/searching)
  - `GraphVisualizer` — SVG node-link diagram with live distance labels and
    frontier (queue/stack) display
  - `DPTableVisualizer` — heatmap grid for the Knapsack DP table, with
    active/source-cell highlighting and backtracked-solution overlay
  - `RecursionTreeVisualizer` — Fibonacci call tree, marking duplicate
    subtrees (naive) vs. cache hits (memoized). The naive tree reserves each
    node's horizontal slot from its label, so positions stay fixed as the tree
    grows instead of re-centring on every step
  - `ChessboardVisualizer` — N-Queens board with conflict highlighting
- **Control Panel** — play / pause / step / scrub / restart, speed control,
  and per-algorithm parameters (input size, data distribution, search
  target, graph source node, knapsack capacity, `n` and naive/memoized
  strategy, board size `N`). Only the controls an algorithm actually reads
  are shown, and only those inputs re-run it — nudging one parameter never
  re-rolls data another visualization is paused on.
- **Metrics Panel** — live comparisons, swaps/updates, array accesses, and
  progress, plus the algorithm's average-case time complexity
- **Code Viewer** — tabs for Pseudocode / full Code / Description /
  Complexity, with the current step's source line highlighted. Steps report
  *pseudocode* line numbers; each algorithm carries a `codeLineMap` that
  translates those to the corresponding lines of the real implementation, so
  both tabs highlight the same statement rather than sharing one set of
  indices across two texts of different lengths.

### Notable implementation choices

- **Quick Sort** uses median-of-three pivot selection (as the report
  recommends) to avoid worst-case degeneration on sorted/reverse-sorted
  input.
- **Graph algorithms** share one sample weighted graph (7 nodes, 10 edges)
  and a circular layout, so you can directly compare how each algorithm
  traverses or spans the same structure.
- **Dijkstra vs. Bellman-Ford** were cross-checked in development and agree
  on shortest-path distances for the sample graph.
- Steps are capped at 6,000 per run as a safety bound against runaway input
  sizes (e.g. very large N-Queens boards). A run that hits the cap says so —
  it reports "Step limit reached" rather than claiming to have completed.
- **Input is generated from an explicit seed**, not `Math.random`, so a run is
  reproducible and only the "New Random Input" button changes the data.

### Simplifications vs. the full report scope

To keep this a runnable, single-pass deliverable, a few report items were
scoped down intentionally:
- Graph layout uses a fixed circular layout rather than a full
  force-directed (Fruchterman-Reingold) simulation — the report's
  optimization strategy (decoupled Web Worker layout, interpolation) matters
  most at graph sizes far larger than a teaching demo needs.
- UI primitives (Button, Slider, Select, Tabs) are small hand-built Tailwind
  components rather than the full shadcn/ui package, to keep the dependency
  surface minimal — visually they follow the same design language shown in
  the report's screenshots.
- React Query wraps the (static) algorithm registry to mirror the intended
  data-layer split between library metadata and execution state; there's no
  backend, so it resolves instantly.

## Project structure

```
src/
  algorithms/        # step generators: sorting.ts, searching.ts, graph.ts,
                      # dp.ts, backtracking.ts, plus shared helpers
  components/
    layout/          # Sidebar, Header
    controls/        # ControlPanel
    panels/          # MetricsPanel, CodeViewer
    visualizers/     # ArrayVisualizer, GraphVisualizer, DPTableVisualizer,
                      # RecursionTreeVisualizer, ChessboardVisualizer,
                      # VisualizationCanvas (dispatcher)
    ui/              # Button, Slider, Select, Tabs, Badge, Panel
  hooks/
    useAlgorithmPlayer.ts   # play/pause/step/scrub/speed state machine
    useAlgorithmLibrary.ts  # React Query wrapper around the registry
  lib/
    algorithmRegistry.ts    # metadata: pseudocode, code, complexity, description
    runAlgorithm.ts         # materializes a step array for a given algorithm + options
    queryClient.ts
  pages/
    VisualizerPage.tsx      # top-level layout wiring everything together
  types.ts           # shared domain types (steps, visualization states)
```
