import type { DPTableVizState } from "@/types";

function isSameCell(a?: [number, number], b?: [number, number]) {
  return !!a && !!b && a[0] === b[0] && a[1] === b[1];
}

function containsCell(cells: [number, number][] | undefined, cell: [number, number]) {
  return !!cells?.some((c) => c[0] === cell[0] && c[1] === cell[1]);
}

export function DPTableVisualizer({ state }: { state: DPTableVizState }) {
  const { rowLabels, colLabels, table, activeCell, sourceCells, selectedCells } = state;
  const maxVal = Math.max(1, ...table.flat().filter((v): v is number => v !== null));

  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <div className="flex-1 overflow-auto rounded-lg bg-[var(--color-bg)] p-3">
        <table className="mono border-separate text-center" style={{ borderSpacing: 4 }}>
          <thead>
            <tr>
              <th className="w-14"></th>
              {colLabels.map((c, i) => (
                <th key={i} className="px-1 text-[10px] font-normal text-[var(--color-text-muted)]">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.map((row, ri) => (
              <tr key={ri}>
                <td className="pr-2 text-right text-[11px] text-[var(--color-text-secondary)]">
                  {rowLabels[ri]}
                </td>
                {row.map((cell, ci) => {
                  const isActive = isSameCell(activeCell, [ri, ci]);
                  const isSource = containsCell(sourceCells, [ri, ci]);
                  const isSelected = containsCell(selectedCells, [ri, ci]);
                  const intensity = cell === null ? 0 : cell / maxVal;
                  let bg = `color-mix(in srgb, var(--color-accent) ${Math.round(intensity * 55)}%, var(--color-surface-raised))`;
                  let border = "transparent";
                  if (isActive) border = "var(--color-current)";
                  else if (isSource) border = "var(--color-compare)";
                  if (isSelected) bg = "var(--color-sorted)";
                  return (
                    <td
                      key={ci}
                      className="h-8 w-10 rounded-md text-xs font-semibold transition-all duration-150"
                      style={{
                        backgroundColor: cell === null ? "var(--color-surface-raised)" : bg,
                        border: `2px solid ${border}`,
                        color: cell === null ? "var(--color-text-muted)" : "#eef0f5",
                      }}
                    >
                      {cell === null ? "·" : cell}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap gap-4 text-[11px] text-[var(--color-text-secondary)]">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm border-2" style={{ borderColor: "var(--color-current)" }} />
          Active cell
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm border-2" style={{ borderColor: "var(--color-compare)" }} />
          Source cell(s)
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: "var(--color-sorted)" }} />
          Selected item
        </div>
      </div>
    </div>
  );
}
