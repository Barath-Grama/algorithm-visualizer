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
      <span className="mono text-[12px] text-[var(--color-text-muted)]">{inputSummary}</span>
    </header>
  );
}
