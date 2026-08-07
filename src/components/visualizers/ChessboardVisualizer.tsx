import type { BoardVizState } from "@/types";

export function ChessboardVisualizer({ state }: { state: BoardVizState }) {
  const { size, queens, activeRow, activeCol, conflict } = state;

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-4">
      <div
        className="grid overflow-hidden rounded-lg border border-[var(--color-border)]"
        style={{
          gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
          width: "min(100%, 420px)",
          aspectRatio: "1 / 1",
        }}
      >
        {Array.from({ length: size }).map((_, row) =>
          Array.from({ length: size }).map((_, col) => {
            const isQueen = queens[row] === col;
            const isActive = activeRow === row && activeCol === col;
            const dark = (row + col) % 2 === 1;
            return (
              <div
                key={`${row}-${col}`}
                className="relative flex items-center justify-center transition-colors duration-150"
                style={{
                  backgroundColor: isActive
                    ? conflict
                      ? "#f5455c55"
                      : "#6366f166"
                    : dark
                    ? "var(--color-board-dark)"
                    : "var(--color-board-light)",
                }}
              >
                {isActive && (
                  <div
                    className="absolute inset-1 rounded-sm border-2"
                    style={{ borderColor: conflict ? "var(--color-swap)" : "var(--color-accent)" }}
                  />
                )}
                {isQueen && (
                  <span
                    className="text-[clamp(16px,4vw,26px)]"
                    style={{ color: "var(--color-sorted)" }}
                  >
                    ♛
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
      <div className="flex flex-wrap justify-center gap-4 text-[11px] text-[var(--color-text-secondary)]">
        <div className="flex items-center gap-1.5">
          <span style={{ color: "var(--color-sorted)" }}>♛</span>
          Placed queen
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm border-2" style={{ borderColor: "var(--color-accent)" }} />
          Testing position
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm border-2" style={{ borderColor: "var(--color-swap)" }} />
          Conflict
        </div>
      </div>
    </div>
  );
}
