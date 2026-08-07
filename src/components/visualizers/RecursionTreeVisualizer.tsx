import { useMemo } from "react";
import type { RecursionTreeNode, TreeVizState } from "@/types";

interface LaidOutNode extends RecursionTreeNode {
  x: number;
  y: number;
}

const NODE_R = 22;
const X_GAP = 52;
const Y_GAP = 64;

/** Leaves in the *naive* fib(k) call tree — Fib(k+1). Memoized on the way up. */
const naiveLeafCounts = new Map<number, number>();
function naiveLeafCount(k: number): number {
  if (k <= 1) return 1;
  const hit = naiveLeafCounts.get(k);
  if (hit !== undefined) return hit;
  const value = naiveLeafCount(k - 1) + naiveLeafCount(k - 2);
  naiveLeafCounts.set(k, value);
  return value;
}

function labelArg(label: string): number {
  return Number.parseInt(label.replace(/[^\d-]/g, ""), 10);
}

function layoutTree(nodes: RecursionTreeNode[], reserveNaiveWidth: boolean): LaidOutNode[] {
  const byParent = new Map<string | null, RecursionTreeNode[]>();
  for (const n of nodes) {
    const arr = byParent.get(n.parentId) ?? [];
    arr.push(n);
    byParent.set(n.parentId, arr);
  }

  const positions = new Map<string, { x: number; y: number }>();

  /**
   * Width-reserving layout: a node's slot comes from its label alone, so it is
   * fixed the moment the node appears and never moves as siblings arrive.
   */
  function placeReserved(node: RecursionTreeNode, left: number): void {
    const k = labelArg(node.label);
    const width = Number.isFinite(k) ? naiveLeafCount(k) : 1;
    positions.set(node.id, {
      x: (left + width / 2) * X_GAP,
      y: node.depth * Y_GAP,
    });
    // fib(k) always recurses on k-1 first, then k-2, so child offsets are known
    // without needing the children to exist yet.
    let cursor = left;
    for (const child of byParent.get(node.id) ?? []) {
      placeReserved(child, cursor);
      const ck = labelArg(child.label);
      cursor += Number.isFinite(ck) ? naiveLeafCount(ck) : 1;
    }
  }

  /** Compact layout: centre each parent over its children. */
  let leafCounter = 0;
  function placeCompact(node: RecursionTreeNode): number {
    const children = byParent.get(node.id) ?? [];
    let x: number;
    if (children.length === 0) {
      x = leafCounter * X_GAP;
      leafCounter++;
    } else {
      const childXs = children.map(placeCompact);
      x = childXs.reduce((a, b) => a + b, 0) / childXs.length;
    }
    positions.set(node.id, { x, y: node.depth * Y_GAP });
    return x;
  }

  for (const root of byParent.get(null) ?? []) {
    if (reserveNaiveWidth) placeReserved(root, 0);
    else placeCompact(root);
  }

  return nodes.map((n) => ({
    ...n,
    x: (positions.get(n.id)?.x ?? 0) + 40,
    y: (positions.get(n.id)?.y ?? 0) + 30,
  }));
}

const STATUS_COLOR: Record<RecursionTreeNode["status"], string> = {
  active: "var(--color-compare)",
  resolved: "var(--color-sorted)",
  cached: "var(--color-pivot)",
};

export function RecursionTreeVisualizer({ state }: { state: TreeVizState }) {
  const laidOut = useMemo(
    () => layoutTree(state.nodes, state.reserveNaiveWidth ?? false),
    [state.nodes, state.reserveNaiveWidth]
  );
  const maxX = Math.max(...laidOut.map((n) => n.x), 200) + 40;
  const maxY = Math.max(...laidOut.map((n) => n.y), 200) + 40;
  const byId = new Map(laidOut.map((n) => [n.id, n]));

  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <div className="flex-1 overflow-auto rounded-lg bg-[var(--color-bg)]">
        <svg width={Math.max(maxX, 480)} height={Math.max(maxY, 260)}>
          {laidOut.map((n) =>
            n.parentId ? (
              <line
                key={`edge-${n.id}`}
                x1={byId.get(n.parentId)!.x}
                y1={byId.get(n.parentId)!.y}
                x2={n.x}
                y2={n.y}
                stroke="#3a4152"
                strokeWidth={2}
              />
            ) : null
          )}
          {laidOut.map((n) => (
            <g key={n.id}>
              <circle
                cx={n.x}
                cy={n.y}
                r={NODE_R}
                fill={n.duplicate ? "#4b304022" : "var(--color-surface-raised)"}
                stroke={
                  n.id === state.activeId ? "#fff" : n.duplicate ? "var(--color-swap)" : STATUS_COLOR[n.status]
                }
                strokeWidth={n.id === state.activeId ? 3 : 2}
                style={{
                  filter: n.id === state.activeId ? "drop-shadow(0 0 8px #fff8)" : undefined,
                }}
              />
              <text
                x={n.x}
                y={n.y + 4}
                textAnchor="middle"
                fontSize={10}
                className="mono"
                fill="var(--color-text-primary)"
              >
                {n.label.replace("fib(", "").replace(")", "")}
              </text>
              {n.value !== undefined && (
                <text
                  x={n.x}
                  y={n.y + NODE_R + 14}
                  textAnchor="middle"
                  fontSize={10}
                  className="mono"
                  fill="var(--color-text-muted)"
                >
                  = {n.value}
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>
      <div className="flex flex-wrap gap-4 text-[11px] text-[var(--color-text-secondary)]">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: STATUS_COLOR.active }} />
          Active call
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: STATUS_COLOR.resolved }} />
          Resolved
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: STATUS_COLOR.cached }} />
          Cache hit
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full border-2" style={{ borderColor: "var(--color-swap)" }} />
          Duplicate subtree
        </div>
      </div>
    </div>
  );
}
