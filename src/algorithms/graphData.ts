import type { GraphEdge, GraphNode } from "@/types";

export interface RawEdge {
  source: string;
  target: string;
  weight: number;
}

const NODE_IDS = ["A", "B", "C", "D", "E", "F", "G"];

const RAW_EDGES: RawEdge[] = [
  { source: "A", target: "B", weight: 4 },
  { source: "A", target: "C", weight: 2 },
  { source: "B", target: "C", weight: 5 },
  { source: "B", target: "D", weight: 10 },
  { source: "C", target: "E", weight: 3 },
  { source: "E", target: "D", weight: 4 },
  { source: "D", target: "F", weight: 11 },
  { source: "E", target: "F", weight: 7 },
  { source: "F", target: "G", weight: 6 },
  { source: "D", target: "G", weight: 2 },
];

export function circularLayout(
  ids: string[],
  cx = 260,
  cy = 200,
  r = 150
): GraphNode[] {
  return ids.map((id, i) => {
    const angle = (2 * Math.PI * i) / ids.length - Math.PI / 2;
    return {
      id,
      x: Math.round(cx + r * Math.cos(angle)),
      y: Math.round(cy + r * Math.sin(angle)),
    };
  });
}

export function buildSampleGraph(): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes = circularLayout(NODE_IDS);
  const edges: GraphEdge[] = RAW_EDGES.map((e, i) => ({
    id: `e${i}`,
    source: e.source,
    target: e.target,
    weight: e.weight,
  }));
  return { nodes, edges };
}

export function buildAdjacency(
  nodes: GraphNode[],
  edges: GraphEdge[],
  directed = false
): Map<string, { to: string; weight: number; edgeId: string }[]> {
  const adj = new Map<string, { to: string; weight: number; edgeId: string }[]>();
  for (const n of nodes) adj.set(n.id, []);
  for (const e of edges) {
    adj.get(e.source)!.push({ to: e.target, weight: e.weight ?? 1, edgeId: e.id });
    if (!directed) {
      adj.get(e.target)!.push({ to: e.source, weight: e.weight ?? 1, edgeId: e.id });
    }
  }
  return adj;
}
