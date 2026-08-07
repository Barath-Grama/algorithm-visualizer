import { useMemo, useState } from "react";
import { CATEGORY_LABELS, CATEGORY_ORDER } from "@/lib/algorithmRegistry";
import { useAlgorithmLibrary } from "@/hooks/useAlgorithmLibrary";
import type { AlgorithmCategory } from "@/types";
import {
  ArrowUpDown,
  Search,
  Waypoints,
  Grid3x3,
  GitBranch,
  Crown,
  SearchIcon,
} from "lucide-react";

const CATEGORY_ICONS: Record<AlgorithmCategory, React.ReactNode> = {
  sorting: <ArrowUpDown size={14} />,
  searching: <SearchIcon size={14} />,
  graph: <Waypoints size={14} />,
  dp: <Grid3x3 size={14} />,
  backtracking: <Crown size={14} />,
};

export function Sidebar({
  selectedId,
  onSelect,
}: {
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const { data: algorithms, isPending } = useAlgorithmLibrary();

  const grouped = useMemo(() => {
    const all = algorithms ?? [];
    const q = query.trim().toLowerCase();
    const filtered = q ? all.filter((a) => a.name.toLowerCase().includes(q)) : all;
    return CATEGORY_ORDER.map((cat) => ({
      category: cat,
      items: filtered.filter((a) => a.category === cat),
    })).filter((g) => g.items.length > 0);
  }, [algorithms, query]);

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-4 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-accent)]">
          <GitBranch size={16} className="text-white" />
        </div>
        <div>
          <div className="text-sm font-semibold text-[var(--color-text-primary)]">
            Algorithm Visualizer
          </div>
          <div className="text-[11px] text-[var(--color-text-muted)]">
            {isPending
              ? "Loading library…"
              : `${algorithms?.length ?? 0} algorithms · ${CATEGORY_ORDER.length} categories`}
          </div>
        </div>
      </div>

      <div className="px-3 pt-3">
        <div className="relative">
          <Search
            size={14}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search algorithms…"
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] py-2 pl-8 pr-3 text-xs text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)]"
          />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3">
        {isPending && (
          <div className="flex flex-col gap-1.5 px-1" aria-busy="true">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-8 animate-pulse rounded-lg bg-[var(--color-surface-hover)]"
              />
            ))}
          </div>
        )}
        {!isPending && grouped.length === 0 && (
          <p className="px-1 text-[12px] text-[var(--color-text-muted)]">
            No algorithms match “{query.trim()}”.
          </p>
        )}
        {grouped.map((g) => (
          <div key={g.category} className="mb-4">
            <div className="mb-1.5 flex items-center gap-1.5 px-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
              {CATEGORY_ICONS[g.category]}
              {CATEGORY_LABELS[g.category]}
              <span className="ml-auto text-[10px] font-normal">{g.items.length}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              {g.items.map((a) => (
                <button
                  key={a.id}
                  onClick={() => onSelect(a.id)}
                  className={`rounded-lg px-3 py-2 text-left text-[13px] transition-colors ${
                    selectedId === a.id
                      ? "bg-[var(--color-accent-soft)] font-medium text-[var(--color-accent-hover)]"
                      : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
                  }`}
                >
                  {a.name}
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
