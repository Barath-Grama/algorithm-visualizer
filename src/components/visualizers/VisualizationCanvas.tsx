import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { MAX_STEPS } from "@/lib/runAlgorithm";
import type { AlgorithmStep } from "@/types";
import { ArrayVisualizer } from "./ArrayVisualizer";
import { GraphVisualizer } from "./GraphVisualizer";
import { DPTableVisualizer } from "./DPTableVisualizer";
import { RecursionTreeVisualizer } from "./RecursionTreeVisualizer";
import { ChessboardVisualizer } from "./ChessboardVisualizer";

export function VisualizationCanvas({
  step,
  isComplete,
  truncated = false,
}: {
  step: AlgorithmStep | undefined;
  isComplete: boolean;
  /** The run hit the step cap, so the last step is not the algorithm's end. */
  truncated?: boolean;
}) {
  const atEndOfTruncatedRun = isComplete && truncated;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-4 py-2.5">
        {atEndOfTruncatedRun ? (
          <AlertTriangle size={14} className="shrink-0 text-[var(--color-compare)]" />
        ) : isComplete ? (
          <CheckCircle2 size={14} className="shrink-0 text-[var(--color-sorted)]" />
        ) : (
          <Info size={14} className="shrink-0 text-[var(--color-text-muted)]" />
        )}
        <p className="truncate text-[13px] text-[var(--color-text-secondary)]">
          {atEndOfTruncatedRun
            ? `Stopped at the ${MAX_STEPS.toLocaleString()}-step limit — this run did not finish. Try a smaller input.`
            : step?.description ?? "Configure parameters and press Play to begin."}
        </p>
        {atEndOfTruncatedRun ? (
          <span className="ml-auto shrink-0 rounded-full bg-[#f5a5241a] px-2 py-0.5 text-[11px] font-medium text-[#facc15]">
            Step limit reached
          </span>
        ) : isComplete ? (
          <span className="ml-auto shrink-0 rounded-full bg-[#22c55e1a] px-2 py-0.5 text-[11px] font-medium text-[#4ade80]">
            Algorithm completed
          </span>
        ) : null}
      </div>
      <div className="min-h-0 flex-1">
        {!step ? (
          <div className="flex h-full items-center justify-center text-sm text-[var(--color-text-muted)]">
            No steps generated yet.
          </div>
        ) : step.array ? (
          <ArrayVisualizer state={step.array} />
        ) : step.graph ? (
          <GraphVisualizer state={step.graph} />
        ) : step.dp ? (
          <DPTableVisualizer state={step.dp} />
        ) : step.tree ? (
          <RecursionTreeVisualizer state={step.tree} />
        ) : step.board ? (
          <ChessboardVisualizer state={step.board} />
        ) : null}
      </div>
    </div>
  );
}
