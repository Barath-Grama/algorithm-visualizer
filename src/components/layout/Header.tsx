import { Link } from "react-router-dom";
import { LineChart } from "lucide-react";
import { Badge } from "@/components/ui/Primitives";
import { CATEGORY_LABELS } from "@/lib/algorithmRegistry";
import type { AlgorithmMeta } from "@/types";

export function Header({
  algorithm,
  inputSummary,
}: {
  algorithm: AlgorithmMeta;
  inputSummary: string;
}) {
  return (
    <header className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-3.5">
      <div className="flex items-center gap-3">
        <h1 className="text-base font-semibold text-[var(--color-text-primary)]">
          {algorithm.name}
        </h1>
        <Badge tone="accent">{CATEGORY_LABELS[algorithm.category]}</Badge>
      </div>
      <div className="flex items-center gap-4">
        <span className="mono text-[12px] text-[var(--color-text-muted)]">{inputSummary}</span>
        <Link
          to="/complexity"
          className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-2.5 py-1.5 text-[12px] text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
        >
          <LineChart size={14} />
          Complexity Lab
        </Link>
      </div>
    </header>
  );
}
