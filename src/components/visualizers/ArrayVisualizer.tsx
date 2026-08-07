import type { ArrayElementState, ArrayVizState } from "@/types";

const STATE_COLORS: Record<ArrayElementState, string> = {
  default: "var(--color-unvisited)",
  comparing: "var(--color-compare)",
  swapping: "var(--color-swap)",
  sorted: "var(--color-sorted)",
  pivot: "var(--color-pivot)",
  found: "var(--color-sorted)",
  eliminated: "#2a2f3b",
  range: "var(--color-accent)",
};

const LEGEND: { state: ArrayElementState; label: string }[] = [
  { state: "comparing", label: "Comparing" },
  { state: "swapping", label: "Swapping" },
  { state: "sorted", label: "Sorted" },
  { state: "pivot", label: "Pivot" },
];

export function ArrayVisualizer({ state }: { state: ArrayVizState }) {
  const max = Math.max(...state.values, 1);

  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <div className="flex min-h-0 flex-1 items-stretch justify-center gap-[3px] overflow-x-auto rounded-lg bg-[var(--color-bg)] px-3 py-4">
        {state.values.map((v, i) => {
          const heightPct = Math.max((v / max) * 100, 4);
          const s = state.states[i] ?? "default";
          const showLabel = state.values.length <= 40;
          return (
            <div
              key={i}
              className="flex min-w-[6px] flex-1 flex-col items-center gap-1"
              style={{ maxWidth: 48 }}
            >
              {showLabel && (
                <span className="mono shrink-0 text-[10px] text-[var(--color-text-muted)]">{v}</span>
              )}
              {/* Dedicated bar track: flex-1 gives it a definite height, so the
                  bar's percentage height resolves against the plot area alone
                  (excluding the value label above it). */}
              <div className="flex w-full min-h-0 flex-1 flex-col justify-end">
                <div
                  className="w-full rounded-t-sm transition-all duration-200 ease-out"
                  style={{
                    height: `${heightPct}%`,
                    backgroundColor: STATE_COLORS[s],
                    boxShadow: s === "comparing" || s === "swapping" ? `0 0 12px 0 ${STATE_COLORS[s]}80` : undefined,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-3">
          {LEGEND.map((l) => (
            <div key={l.state} className="flex items-center gap-1.5 text-[11px] text-[var(--color-text-secondary)]">
              <span
                className="h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: STATE_COLORS[l.state] }}
              />
              {l.label}
            </div>
          ))}
        </div>
        {state.rangeLabel && (
          <span className="mono text-[11px] text-[var(--color-text-muted)]">{state.rangeLabel}</span>
        )}
      </div>
    </div>
  );
}
