import { describe, expect, it } from "vitest";
import type { AlgorithmStep, StepGenerator } from "@/types";
import { buildSampleGraph } from "./graphData";
import {
  bellmanFordSteps,
  bfsSteps,
  dfsSteps,
  dijkstraSteps,
  kruskalSteps,
  primSteps,
} from "./graph";

const { nodes, edges } = buildSampleGraph();
const NODE_IDS = nodes.map((n) => n.id);

function lastStep(gen: StepGenerator): AlgorithmStep {
  let last: AlgorithmStep | undefined;
  let guard = 0;
  for (const step of gen) {
    if (++guard > 50_000) throw new Error("generator did not terminate");
    last = step;
  }
  if (!last) throw new Error("generator produced no steps");
  return last;
}

/** Total weight of the edges an MST algorithm marked "selected" at the end. */
function selectedWeight(gen: StepGenerator): number {
  const final = lastStep(gen).graph!;
  return edges
    .filter((e) => final.edgeStates[e.id] === "selected")
    .reduce((sum, e) => sum + (e.weight ?? 1), 0);
}

describe("shortest paths", () => {
  // Dijkstra and Bellman-Ford are independent implementations of the same
  // problem, so disagreement means one of them is wrong. The README claims
  // this was cross-checked during development; this makes it an assertion.
  it.each(NODE_IDS)("Dijkstra and Bellman-Ford agree from source %s", (start) => {
    const dijkstra = lastStep(dijkstraSteps(nodes, edges, start)).graph!.distances!;
    const bellman = lastStep(bellmanFordSteps(nodes, edges, start)).graph!.distances!;

    for (const id of NODE_IDS) {
      expect(dijkstra[id], `dist to ${id} from ${start}`).toBe(bellman[id]);
    }
  });

  it("reports zero distance to the source and finite distances elsewhere", () => {
    const dist = lastStep(dijkstraSteps(nodes, edges, "A")).graph!.distances!;
    expect(dist.A).toBe(0);
    // The sample graph is connected, so nothing should remain unreachable.
    for (const id of NODE_IDS) expect(dist[id]).not.toBeNull();
  });

  it("satisfies the triangle inequality along every edge", () => {
    const dist = lastStep(dijkstraSteps(nodes, edges, "A")).graph!.distances!;
    for (const e of edges) {
      const w = e.weight ?? 1;
      const [u, v] = [dist[e.source]!, dist[e.target]!];
      expect(v).toBeLessThanOrEqual(u + w);
      expect(u).toBeLessThanOrEqual(v + w);
    }
  });
});

describe("minimum spanning trees", () => {
  // Prim and Kruskal use completely different strategies (grow from a vertex
  // vs. sort edges globally) but any MST of a graph has the same total weight.
  it("Prim and Kruskal find the same total weight", () => {
    const kruskal = selectedWeight(kruskalSteps(nodes, edges));
    for (const start of NODE_IDS) {
      expect(selectedWeight(primSteps(nodes, edges, start)), `Prim from ${start}`).toBe(
        kruskal
      );
    }
  });

  it("selects exactly V-1 edges", () => {
    const final = lastStep(kruskalSteps(nodes, edges)).graph!;
    const selected = edges.filter((e) => final.edgeStates[e.id] === "selected");
    expect(selected).toHaveLength(nodes.length - 1);
  });

  it("spans every vertex", () => {
    for (const gen of [kruskalSteps(nodes, edges), primSteps(nodes, edges, "A")]) {
      const final = lastStep(gen).graph!;
      expect(Object.values(final.nodeStates).filter((s) => s === "unvisited")).toHaveLength(0);
    }
  });
});

describe("traversals", () => {
  it.each(NODE_IDS)("BFS from %s visits every node in the connected graph", (start) => {
    const final = lastStep(bfsSteps(nodes, edges, start)).graph!;
    for (const id of NODE_IDS) {
      expect(final.nodeStates[id], `node ${id}`).toBe("visited");
    }
  });

  it.each(NODE_IDS)("DFS from %s visits every node in the connected graph", (start) => {
    const final = lastStep(dfsSteps(nodes, edges, start)).graph!;
    for (const id of NODE_IDS) {
      expect(final.nodeStates[id], `node ${id}`).toBe("visited");
    }
  });

  it("BFS empties its queue by the end", () => {
    const steps = [...bfsSteps(nodes, edges, "A")];
    const withFrontier = steps.filter((s) => s.graph?.frontier);
    expect(withFrontier.at(-1)!.graph!.frontier).toHaveLength(0);
  });
});

describe("graph step payloads", () => {
  const ALL: [string, () => StepGenerator][] = [
    ["bfs", () => bfsSteps(nodes, edges, "A")],
    ["dfs", () => dfsSteps(nodes, edges, "A")],
    ["dijkstra", () => dijkstraSteps(nodes, edges, "A")],
    ["bellman-ford", () => bellmanFordSteps(nodes, edges, "A")],
    ["prim", () => primSteps(nodes, edges, "A")],
    ["kruskal", () => kruskalSteps(nodes, edges)],
  ];

  it.each(ALL)("%s emits a state for every node and edge on every step", (_name, make) => {
    for (const step of make()) {
      const g = step.graph!;
      expect(Object.keys(g.nodeStates)).toHaveLength(nodes.length);
      expect(Object.keys(g.edgeStates)).toHaveLength(edges.length);
    }
  });
});
