import type { EdgeState, GraphVizState, NodeState } from "@/types";

const NODE_COLORS: Record<NodeState, string> = {
  unvisited: "var(--color-unvisited)",
  queued: "var(--color-queued)",
  current: "var(--color-current)",
  visited: "var(--color-visited)",
};

const EDGE_COLORS: Record<EdgeState, string> = {
  default: "#3a4152",
  relaxing: "var(--color-compare)",
  selected: "var(--color-sorted)",
  rejected: "#4b3040",
};

export function GraphVisualizer({ state }: { state: GraphVizState }) {
  const { nodes, edges, nodeStates, edgeStates, distances, frontier, frontierLabel } = state;

  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <div className="relative flex-1 overflow-hidden rounded-lg bg-[var(--color-bg)]">
        <svg viewBox="0 0 520 400" className="h-full w-full">
          <g>
            {edges.map((e) => {
              const s = nodes.find((n) => n.id === e.source)!;
              const t = nodes.find((n) => n.id === e.target)!;
              const mx = (s.x + t.x) / 2;
              const my = (s.y + t.y) / 2;
              const estate = edgeStates[e.id] ?? "default";
              return (
                <g key={e.id}>
                  <line
                    x1={s.x}
                    y1={s.y}
                    x2={t.x}
                    y2={t.y}
                    stroke={EDGE_COLORS[estate]}
                    strokeWidth={estate === "selected" ? 3 : 2}
                    className="transition-all duration-200"
                  />
                  <circle cx={mx} cy={my} r={11} fill="var(--color-surface)" opacity={0.9} />
                  <text
                    x={mx}
                    y={my + 4}
                    textAnchor="middle"
                    fontSize={11}
                    className="mono"
                    fill="var(--color-text-secondary)"
                  >
                    {e.weight}
                  </text>
                </g>
              );
            })}
          </g>
          <g>
            {nodes.map((n) => {
              const nstate = nodeStates[n.id] ?? "unvisited";
              const dist = distances?.[n.id];
              return (
                <g key={n.id}>
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r={20}
                    fill={NODE_COLORS[nstate]}
                    stroke={nstate === "current" ? "#fff" : "transparent"}
                    strokeWidth={2}
                    className="transition-all duration-300"
                    style={{
                      filter:
                        nstate === "current"
                          ? `drop-shadow(0 0 8px ${NODE_COLORS.current})`
                          : undefined,
                    }}
                  />
                  <text
                    x={n.x}
                    y={n.y + 5}
                    textAnchor="middle"
                    fontSize={14}
                    fontWeight={700}
                    fill="#0b0d12"
                  >
                    {n.id}
                  </text>
                  {dist !== undefined && (
                    <text
                      x={n.x}
                      y={n.y - 28}
                      textAnchor="middle"
                      fontSize={12}
                      className="mono"
                      fill="var(--color-text-primary)"
                    >
                      {dist === null ? "∞" : dist}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          {(
            [
              ["unvisited", "Unvisited"],
              ["queued", "Queued"],
              ["current", "Current"],
              ["visited", "Visited"],
            ] as [NodeState, string][]
          ).map(([s, label]) => (
            <div key={s} className="flex items-center gap-1.5 text-[11px] text-[var(--color-text-secondary)]">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: NODE_COLORS[s] }} />
              {label}
            </div>
          ))}
        </div>
        {frontier && (
          <div className="flex items-center gap-2 text-[11px] text-[var(--color-text-secondary)]">
            <span className="text-[var(--color-text-muted)]">{frontierLabel ?? "Frontier"}:</span>
            <div className="mono flex gap-1">
              {frontier.length === 0 ? (
                <span className="text-[var(--color-text-muted)]">empty</span>
              ) : (
                frontier.map((f, i) => (
                  <span
                    key={i}
                    className="rounded bg-[var(--color-surface-hover)] px-1.5 py-0.5 text-[var(--color-text-primary)]"
                  >
                    {f}
                  </span>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
