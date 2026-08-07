import type {
  AlgorithmStep,
  EdgeState,
  GraphEdge,
  GraphNode,
  NodeState,
  StepGenerator,
  StepMetrics,
} from "@/types";
import { buildAdjacency } from "./graphData";
import { freshMetrics } from "./helpers";

function makeGraphSnapshotter(
  nodes: GraphNode[],
  edges: GraphEdge[],
  metrics: StepMetrics
) {
  const nodeStates: Record<string, NodeState> = {};
  const edgeStates: Record<string, EdgeState> = {};
  nodes.forEach((n) => (nodeStates[n.id] = "unvisited"));
  edges.forEach((e) => (edgeStates[e.id] = "default"));

  function snapshot(
    description: string,
    codeLine: number[] = [],
    extra?: {
      distances?: Record<string, number | null>;
      frontier?: string[];
      frontierLabel?: string;
    }
  ): AlgorithmStep {
    return {
      description,
      metrics: { ...metrics },
      graph: {
        nodes,
        edges,
        nodeStates: { ...nodeStates },
        edgeStates: { ...edgeStates },
        distances: extra?.distances ? { ...extra.distances } : undefined,
        frontier: extra?.frontier ? [...extra.frontier] : undefined,
        frontierLabel: extra?.frontierLabel,
      },
      codeLine,
    };
  }

  return { nodeStates, edgeStates, snapshot };
}

// ---------------------------------------------------------------------------
// Breadth-First Search — O(V + E)
// ---------------------------------------------------------------------------
export function* bfsSteps(
  nodes: GraphNode[],
  edges: GraphEdge[],
  start: string
): StepGenerator {
  const metrics = freshMetrics();
  const adj = buildAdjacency(nodes, edges, false);
  const { nodeStates, edgeStates, snapshot } = makeGraphSnapshotter(nodes, edges, metrics);

  const queue: string[] = [start];
  nodeStates[start] = "queued";
  yield snapshot(`Enqueue source node ${start}.`, [2], { frontier: queue, frontierLabel: "Queue" });

  while (queue.length > 0) {
    const u = queue.shift()!;
    nodeStates[u] = "current";
    metrics.arrayAccesses++;
    yield snapshot(`Dequeue ${u} and examine its neighbours.`, [4, 5], {
      frontier: queue,
      frontierLabel: "Queue",
    });

    for (const { to, edgeId } of adj.get(u) ?? []) {
      metrics.comparisons++;
      edgeStates[edgeId] = "relaxing";
      yield snapshot(`Checking neighbour ${to} of ${u}.`, [5, 6], {
        frontier: queue,
        frontierLabel: "Queue",
      });
      if (nodeStates[to] === "unvisited") {
        nodeStates[to] = "queued";
        queue.push(to);
        edgeStates[edgeId] = "selected";
        yield snapshot(`${to} unvisited — enqueue it.`, [7, 8], {
          frontier: queue,
          frontierLabel: "Queue",
        });
      } else {
        edgeStates[edgeId] = "default";
      }
    }
    nodeStates[u] = "visited";
  }
  yield snapshot("BFS traversal complete — all reachable nodes visited.", [1]);
}

// ---------------------------------------------------------------------------
// Depth-First Search — O(V + E)
// ---------------------------------------------------------------------------
export function* dfsSteps(
  nodes: GraphNode[],
  edges: GraphEdge[],
  start: string
): StepGenerator {
  const metrics = freshMetrics();
  const adj = buildAdjacency(nodes, edges, false);
  const { nodeStates, edgeStates, snapshot } = makeGraphSnapshotter(nodes, edges, metrics);

  const stack: string[] = [start];
  yield snapshot(`Push source node ${start} onto the stack.`, [1], {
    frontier: stack,
    frontierLabel: "Stack",
  });

  function* visit(u: string): Generator<AlgorithmStep, void, unknown> {
    nodeStates[u] = "current";
    metrics.arrayAccesses++;
    yield snapshot(`Visiting ${u}.`, [2], { frontier: stack, frontierLabel: "Stack" });

    for (const { to, edgeId } of adj.get(u) ?? []) {
      metrics.comparisons++;
      if (nodeStates[to] === "unvisited") {
        edgeStates[edgeId] = "selected";
        stack.push(to);
        yield snapshot(`${to} unvisited — recurse depth-first.`, [4, 5], {
          frontier: stack,
          frontierLabel: "Stack",
        });
        yield* visit(to);
        stack.pop();
      } else {
        edgeStates[edgeId] = edgeStates[edgeId] === "selected" ? "selected" : "default";
      }
    }
    nodeStates[u] = "visited";
    yield snapshot(`Backtrack from ${u} — all neighbours explored.`, [3], {
      frontier: stack,
      frontierLabel: "Stack",
    });
  }

  yield* visit(start);
  yield snapshot("DFS traversal complete.", [1]);
}

// ---------------------------------------------------------------------------
// Dijkstra's Algorithm — O((V + E) log V) with a priority queue
// ---------------------------------------------------------------------------
export function* dijkstraSteps(
  nodes: GraphNode[],
  edges: GraphEdge[],
  start: string
): StepGenerator {
  const metrics = freshMetrics();
  const adj = buildAdjacency(nodes, edges, false);
  const { nodeStates, edgeStates, snapshot } = makeGraphSnapshotter(nodes, edges, metrics);

  const dist: Record<string, number | null> = {};
  nodes.forEach((n) => (dist[n.id] = n.id === start ? 0 : null));
  const visited = new Set<string>();

  yield snapshot(`Initialize distances: dist[${start}] = 0, others = ∞.`, [2], {
    distances: dist,
  });

  while (visited.size < nodes.length) {
    let u: string | null = null;
    let best = Infinity;
    for (const n of nodes) {
      if (!visited.has(n.id) && dist[n.id] !== null && (dist[n.id] as number) < best) {
        best = dist[n.id] as number;
        u = n.id;
      }
    }
    if (u === null) break;
    visited.add(u);
    nodeStates[u] = "current";
    yield snapshot(`Select unvisited node with smallest distance: ${u} (${best}).`, [4, 5], {
      distances: dist,
    });

    for (const { to, weight, edgeId } of adj.get(u) ?? []) {
      if (visited.has(to)) continue;
      metrics.comparisons++;
      edgeStates[edgeId] = "relaxing";
      const newDist = (dist[u] as number) + weight;
      yield snapshot(`Relax edge ${u}→${to}: ${dist[u]} + ${weight} = ${newDist} vs current ${dist[to] ?? "∞"}.`, [6, 7], {
        distances: dist,
      });
      if (dist[to] === null || newDist < (dist[to] as number)) {
        dist[to] = newDist;
        edgeStates[edgeId] = "selected";
        // Reachable with a finite tentative distance = on the frontier.
        nodeStates[to] = "queued";
        yield snapshot(`Improved distance to ${to}: ${newDist}.`, [8], { distances: dist });
      } else {
        edgeStates[edgeId] = "default";
      }
    }
    nodeStates[u] = "visited";
  }
  yield snapshot("Dijkstra complete — shortest distances finalized.", [1], { distances: dist });
}

// ---------------------------------------------------------------------------
// Bellman-Ford Algorithm — O(V * E), supports negative weights (no neg cycles)
// ---------------------------------------------------------------------------
export function* bellmanFordSteps(
  nodes: GraphNode[],
  edges: GraphEdge[],
  start: string
): StepGenerator {
  const metrics = freshMetrics();
  const { nodeStates, edgeStates, snapshot } = makeGraphSnapshotter(nodes, edges, metrics);

  const dist: Record<string, number | null> = {};
  nodes.forEach((n) => (dist[n.id] = n.id === start ? 0 : null));
  nodeStates[start] = "current";
  yield snapshot(`Initialize distances: dist[${start}] = 0, others = ∞.`, [2], { distances: dist });

  const directedEdges = edges.flatMap((e) => [
    { from: e.source, to: e.target, weight: e.weight ?? 1, edgeId: e.id },
    { from: e.target, to: e.source, weight: e.weight ?? 1, edgeId: e.id },
  ]);

  for (let pass = 1; pass < nodes.length; pass++) {
    let changed = false;
    yield snapshot(`Relaxation pass ${pass} of ${nodes.length - 1}.`, [3], { distances: dist });
    for (const { from, to, weight, edgeId } of directedEdges) {
      if (dist[from] === null) continue;
      metrics.comparisons++;
      edgeStates[edgeId] = "relaxing";
      // Show which endpoint is being relaxed from, and which are reachable.
      nodeStates[from] = "current";
      const newDist = (dist[from] as number) + weight;
      yield snapshot(`Relax edge ${from}→${to}: candidate distance ${newDist}.`, [4, 5], {
        distances: dist,
      });
      if (dist[to] === null || newDist < (dist[to] as number)) {
        dist[to] = newDist;
        edgeStates[edgeId] = "selected";
        nodeStates[to] = "queued";
        changed = true;
        yield snapshot(`Updated dist[${to}] = ${newDist}.`, [6], { distances: dist });
      } else {
        edgeStates[edgeId] = "default";
      }
      nodeStates[from] = "visited";
    }
    if (!changed) {
      yield snapshot("No changes this pass — distances have converged early.", [3]);
      break;
    }
  }
  nodes.forEach((n) => (nodeStates[n.id] = "visited"));
  yield snapshot("Bellman-Ford complete — final shortest distances computed.", [1], {
    distances: dist,
  });
}

// ---------------------------------------------------------------------------
// Prim's Algorithm (Minimum Spanning Tree) — O(V^2) with linear scan
// ---------------------------------------------------------------------------
export function* primSteps(nodes: GraphNode[], edges: GraphEdge[], start: string): StepGenerator {
  const metrics = freshMetrics();
  const adj = buildAdjacency(nodes, edges, false);
  const { nodeStates, edgeStates, snapshot } = makeGraphSnapshotter(nodes, edges, metrics);

  const inMST = new Set<string>([start]);
  nodeStates[start] = "visited";
  let totalWeight = 0;
  yield snapshot(`Start MST from node ${start}.`, [2]);

  while (inMST.size < nodes.length) {
    let bestEdge: { from: string; to: string; weight: number; edgeId: string } | null = null;
    for (const u of inMST) {
      for (const { to, weight, edgeId } of adj.get(u) ?? []) {
        if (inMST.has(to)) continue;
        metrics.comparisons++;
        // Anything reachable from the tree but not yet in it is the frontier.
        nodeStates[to] = "queued";
        if (!bestEdge || weight < bestEdge.weight) {
          bestEdge = { from: u, to, weight, edgeId };
        }
      }
    }
    if (!bestEdge) break;
    edgeStates[bestEdge.edgeId] = "relaxing";
    yield snapshot(
      `Cheapest edge crossing the cut: ${bestEdge.from}–${bestEdge.to} (weight ${bestEdge.weight}).`,
      [4]
    );
    inMST.add(bestEdge.to);
    nodeStates[bestEdge.to] = "visited";
    edgeStates[bestEdge.edgeId] = "selected";
    totalWeight += bestEdge.weight;
    yield snapshot(`Added ${bestEdge.to} to the MST. Running total weight: ${totalWeight}.`, [5]);
  }
  yield snapshot(`Prim's MST complete — total weight ${totalWeight}.`, [1]);
}

// ---------------------------------------------------------------------------
// Kruskal's Algorithm (Minimum Spanning Tree) — O(E log E) with union-find
// ---------------------------------------------------------------------------
export function* kruskalSteps(nodes: GraphNode[], edges: GraphEdge[]): StepGenerator {
  const metrics = freshMetrics();
  const { nodeStates, edgeStates, snapshot } = makeGraphSnapshotter(nodes, edges, metrics);

  const parent: Record<string, string> = {};
  nodes.forEach((n) => (parent[n.id] = n.id));
  function find(x: string): string {
    while (parent[x] !== x) x = parent[x];
    return x;
  }

  const sorted = [...edges].sort((a, b) => (a.weight ?? 1) - (b.weight ?? 1));
  yield snapshot("Sort all edges by weight, ascending.", [2]);

  let totalWeight = 0;
  let added = 0;
  for (const e of sorted) {
    metrics.comparisons++;
    edgeStates[e.id] = "relaxing";
    yield snapshot(`Consider edge ${e.source}–${e.target} (weight ${e.weight ?? 1}).`, [3, 4]);
    const rootA = find(e.source);
    const rootB = find(e.target);
    if (rootA !== rootB) {
      parent[rootA] = rootB;
      edgeStates[e.id] = "selected";
      nodeStates[e.source] = "visited";
      nodeStates[e.target] = "visited";
      totalWeight += e.weight ?? 1;
      added++;
      yield snapshot(`No cycle formed — add edge to MST. Total weight: ${totalWeight}.`, [5, 6]);
    } else {
      edgeStates[e.id] = "rejected";
      yield snapshot(`${e.source} and ${e.target} already connected — would form a cycle. Reject.`, [4]);
    }
    if (added === nodes.length - 1) break;
  }
  // Every vertex is spanned once the MST is built; isolated ones would remain
  // unvisited, which is the honest signal here.
  for (const n of nodes) {
    if (find(n.id) === find(nodes[0].id)) nodeStates[n.id] = "visited";
  }
  yield snapshot(`Kruskal's MST complete — total weight ${totalWeight}.`, [1]);
}
