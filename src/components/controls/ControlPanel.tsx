import { Pause, Play, Shuffle, SkipBack, SkipForward, StepBack, StepForward } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Slider } from "@/components/ui/Slider";
import { Select } from "@/components/ui/Primitives";
import type { AlgorithmMeta } from "@/types";
import type { RunOptions } from "@/lib/runAlgorithm";
import { SHORTCUT_HINTS } from "@/hooks/usePlayerShortcuts";

interface ControlPanelProps {
  algorithm: AlgorithmMeta;
  options: RunOptions;
  onOptionsChange: (opts: Partial<RunOptions>) => void;
  onRegenerate: () => void;
  /** Re-seeding only affects algorithms with randomly generated input. */
  canRegenerate: boolean;
  /** The target the current run actually searched for, explicit or auto-picked. */
  resolvedTarget?: number;
  playing: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  onReset: () => void;
  onGoToEnd: () => void;
  speedMs: number;
  onSpeedChange: (ms: number) => void;
  index: number;
  totalSteps: number;
  onSeek: (i: number) => void;
}

export function ControlPanel({
  algorithm,
  options,
  onOptionsChange,
  onRegenerate,
  canRegenerate,
  resolvedTarget,
  playing,
  onPlay,
  onPause,
  onStepForward,
  onStepBackward,
  onReset,
  onGoToEnd,
  speedMs,
  onSpeedChange,
  index,
  totalSteps,
  onSeek,
}: ControlPanelProps) {
  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Transport controls */}
      <div className="flex items-center justify-center gap-2" role="group" aria-label="Playback">
        <Button variant="icon" onClick={onReset} title="Restart (Home)" aria-label="Restart">
          <SkipBack size={16} aria-hidden="true" />
        </Button>
        <Button
          variant="icon"
          onClick={onStepBackward}
          disabled={index === 0}
          title="Previous step (←)"
          aria-label="Previous step"
        >
          <StepBack size={16} aria-hidden="true" />
        </Button>
        <Button
          variant="primary"
          size="md"
          onClick={playing ? onPause : onPlay}
          className="w-24"
          title={playing ? "Pause (Space)" : "Play (Space)"}
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? (
            <>
              <Pause size={16} aria-hidden="true" /> Pause
            </>
          ) : (
            <>
              <Play size={16} aria-hidden="true" /> Play
            </>
          )}
        </Button>
        <Button
          variant="icon"
          onClick={onStepForward}
          disabled={index >= totalSteps - 1}
          title="Next step (→)"
          aria-label="Next step"
        >
          <StepForward size={16} aria-hidden="true" />
        </Button>
        <Button
          variant="icon"
          onClick={onGoToEnd}
          title="Jump to end (End)"
          aria-label="Jump to end"
        >
          <SkipForward size={16} aria-hidden="true" />
        </Button>
      </div>

      {/* Scrubber */}
      <div className="flex items-center gap-3">
        <span className="mono w-16 shrink-0 text-[11px] text-[var(--color-text-muted)]">
          {totalSteps > 0 ? index + 1 : 0} / {totalSteps}
        </span>
        <input
          type="range"
          min={0}
          max={Math.max(totalSteps - 1, 0)}
          value={index}
          onChange={(e) => onSeek(Number(e.target.value))}
          aria-label="Step position"
          aria-valuetext={`Step ${totalSteps > 0 ? index + 1 : 0} of ${totalSteps}`}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[var(--color-border)] accent-[var(--color-accent)]"
        />
      </div>

      <Slider
        label="Speed"
        value={1100 - speedMs}
        min={100}
        max={1000}
        step={50}
        onChange={(v) => onSpeedChange(1100 - v)}
        leftHint="Slow"
        rightHint="Fast"
        valueLabel={`${speedMs}ms`}
      />

      <div className="h-px bg-[var(--color-border)]" />

      {/* Algorithm-specific parameters */}
      <div className="flex flex-col gap-3">
        {(algorithm.visualization === "array" ? (
          <>
            <Slider
              label="Input Size"
              value={options.arraySize}
              min={5}
              max={60}
              onChange={(v) => onOptionsChange({ arraySize: v })}
            />
            {algorithm.category === "sorting" && (
              <Select
                label="Data Distribution"
                value={options.distribution}
                onChange={(v) => onOptionsChange({ distribution: v as RunOptions["distribution"] })}
                options={[
                  { value: "random", label: "Random" },
                  { value: "sorted", label: "Sorted" },
                  { value: "reversed", label: "Reversed" },
                  { value: "nearly-sorted", label: "Nearly sorted" },
                ]}
              />
            )}
            {algorithm.category === "searching" && (
              <Slider
                label="Search Target"
                value={options.searchTarget ?? resolvedTarget ?? 50}
                min={1}
                max={100}
                onChange={(v) => onOptionsChange({ searchTarget: v })}
                rightHint={
                  options.searchTarget === undefined
                    ? "auto-picked from the array"
                    : "drag off-array to see a failed search"
                }
              />
            )}
          </>
        ) : null)}

        {algorithm.visualization === "graph" && (
          <Select
            label="Source Node"
            value={options.graphStart}
            onChange={(v) => onOptionsChange({ graphStart: v })}
            options={["A", "B", "C", "D", "E", "F", "G"].map((id) => ({ value: id, label: id }))}
          />
        )}

        {algorithm.id === "knapsack" && (
          <Slider
            label="Knapsack Capacity"
            value={options.knapsackCapacity}
            min={5}
            max={25}
            onChange={(v) => onOptionsChange({ knapsackCapacity: v })}
          />
        )}

        {algorithm.id === "fibonacci" && (
          <>
            <Slider
              label="n"
              value={options.fibN}
              min={2}
              max={10}
              onChange={(v) => onOptionsChange({ fibN: v })}
              rightHint="Higher n = larger tree"
            />
            <Select
              label="Strategy"
              value={options.fibMemoized ? "memoized" : "naive"}
              onChange={(v) => onOptionsChange({ fibMemoized: v === "memoized" })}
              options={[
                { value: "naive", label: "Naive recursion" },
                { value: "memoized", label: "Memoized (top-down)" },
              ]}
            />
          </>
        )}

        {algorithm.id === "n-queens" && (
          <Slider
            label="Board Size (N)"
            value={options.queensN}
            min={4}
            max={8}
            onChange={(v) => onOptionsChange({ queensN: v })}
          />
        )}

        {canRegenerate && (
          <Button variant="secondary" onClick={onRegenerate} className="w-full">
            <Shuffle size={14} aria-hidden="true" /> New Random Input
          </Button>
        )}
      </div>

      <div className="h-px bg-[var(--color-border)]" />

      <dl className="flex flex-col gap-1 text-[10px] text-[var(--color-text-muted)]">
        {SHORTCUT_HINTS.map(([keys, action]) => (
          <div key={keys} className="flex items-center justify-between">
            <dt className="mono">{keys}</dt>
            <dd>{action}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
