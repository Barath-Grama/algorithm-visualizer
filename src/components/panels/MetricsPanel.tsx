import { GitCompare, Repeat, MemoryStick, Clock } from "lucide-react";
import type { AlgorithmMeta, StepMetrics } from "@/types";

function MetricRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-[var(--color-surface-raised)] px-3 py-2.5">
      <div className="flex items-center gap-2 text-[13px] text-[var(--color-text-secondary)]">
        {icon}
        {label}
      </div>
      <span className="mono text-sm font-semibold text-[var(--color-text-primary)]">{value}</span>
    </div>
  );
}

export function MetricsPanel({
  metrics,
  index,
  totalSteps,
  algorithm,
}: {
  metrics: StepMetrics | undefined;
  index: number;
  totalSteps: number;
  algorithm: AlgorithmMeta;
}) {
  const m = metrics ?? { comparisons: 0, swaps: 0, arrayAccesses: 0 };
  const progressPct = totalSteps > 0 ? ((index + 1) / totalSteps) * 100 : 0;

  return (
    <div className="flex flex-col gap-3 p-4">
      <div>
        <div className="mb-1.5 flex items-center justify-between text-[11px] text-[var(--color-text-secondary)]">
          <span>Progress</span>
          <span className="mono">
            {totalSteps > 0 ? index + 1 : 0} / {totalSteps}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-border)]">
          <div
            className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-200"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <MetricRow icon={<GitCompare size={14} />} label="Comparisons" value={m.comparisons} />
      <MetricRow icon={<Repeat size={14} />} label="Swaps / Updates" value={m.swaps} />
      <MetricRow icon={<MemoryStick size={14} />} label="Array Accesses" value={m.arrayAccesses} />

      <div className="mt-1 rounded-lg bg-[var(--color-accent-soft)] px-3 py-2.5">
        <div className="flex items-center gap-2 text-[11px] text-[var(--color-accent-hover)]">
          <Clock size={13} />
          Time Complexity (avg)
        </div>
        <div className="mono mt-0.5 text-base font-bold text-[var(--color-text-primary)]">
          {algorithm.complexity.average}
        </div>
      </div>
    </div>
  );
}
