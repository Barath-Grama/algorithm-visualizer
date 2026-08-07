import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { VisualizationCanvas } from "@/components/visualizers/VisualizationCanvas";
import { ControlPanel } from "@/components/controls/ControlPanel";
import { MetricsPanel } from "@/components/panels/MetricsPanel";
import { CodeViewer } from "@/components/panels/CodeViewer";
import { Panel } from "@/components/ui/Primitives";
import { getAlgorithm } from "@/lib/algorithmRegistry";
import { relevantOptions, runAlgorithm, usesRandomInput, type RunOptions } from "@/lib/runAlgorithm";
import { readUrlState, writeUrlState, type UrlState } from "@/lib/urlState";
import { useAlgorithmPlayer } from "@/hooks/useAlgorithmPlayer";
import { usePlayerShortcuts } from "@/hooks/usePlayerShortcuts";

export function VisualizerPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // The URL is the source of truth for configuration, so a run is linkable and
  // the back button steps through what you tried. Read once per render rather
  // than mirrored into state, which would need syncing in both directions.
  const { algorithmId, options, seed } = useMemo(
    () => readUrlState(searchParams),
    [searchParams]
  );

  const commit = useCallback(
    (next: Partial<UrlState>) => {
      setSearchParams(
        writeUrlState({ algorithmId, options, seed, ...next }),
        // Configuration changes are navigation: Back should undo them.
        { replace: false }
      );
    },
    [algorithmId, options, seed, setSearchParams]
  );

  const algorithm = getAlgorithm(algorithmId)!;

  // Identifies a run by only the inputs it actually consumes, so changing an
  // unrelated control (Fibonacci's n while a sort is on screen, say) neither
  // regenerates the input nor resets the playhead.
  const runId = `${algorithmId}|${seed}|${JSON.stringify(relevantOptions(algorithmId, options))}`;

  const { steps, inputSummary, truncated, resolvedTarget } = useMemo(
    () => runAlgorithm(algorithmId, options, seed),
    // `options`, `algorithmId` and `seed` are all folded into `runId`; depending
    // on the `options` object itself would re-run on every unrelated change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [runId]
  );

  const player = useAlgorithmPlayer(steps, runId);

  usePlayerShortcuts({
    playing: player.playing,
    onPlay: player.play,
    onPause: player.pause,
    onStepForward: player.stepForward,
    onStepBackward: player.stepBackward,
    onReset: player.reset,
    onGoToEnd: player.goToEnd,
  });

  function handleSelectAlgorithm(id: string) {
    commit({ algorithmId: id });
  }

  function handleOptionsChange(partial: Partial<RunOptions>) {
    commit({ options: { ...options, ...partial } });
  }

  function handleRegenerate() {
    commit({ seed: seed + 1 });
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      <Sidebar selectedId={algorithmId} onSelect={handleSelectAlgorithm} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header algorithm={algorithm} inputSummary={inputSummary} />

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-auto p-4 lg:grid-cols-[1fr_320px]">
          {/* Left column: visualization + code */}
          <div className="flex min-h-0 flex-col gap-4">
            <Panel className="min-h-[360px] flex-1">
              <VisualizationCanvas
                step={player.currentStep}
                isComplete={player.isComplete}
                truncated={truncated}
              />
            </Panel>
            <Panel className="h-72 shrink-0">
              <CodeViewer algorithm={algorithm} activeLines={player.currentStep?.codeLine ?? []} />
            </Panel>
          </div>

          {/* Right column: controls + metrics */}
          <div className="flex flex-col gap-4">
            <Panel title="Controls">
              <ControlPanel
                algorithm={algorithm}
                options={options}
                onOptionsChange={handleOptionsChange}
                onRegenerate={handleRegenerate}
                canRegenerate={usesRandomInput(algorithmId)}
                resolvedTarget={resolvedTarget}
                playing={player.playing}
                onPlay={player.play}
                onPause={player.pause}
                onStepForward={player.stepForward}
                onStepBackward={player.stepBackward}
                onReset={player.reset}
                onGoToEnd={player.goToEnd}
                speedMs={player.speedMs}
                onSpeedChange={player.setSpeedMs}
                index={player.index}
                totalSteps={player.totalSteps}
                onSeek={player.seek}
              />
            </Panel>
            <Panel title="Real-Time Metrics">
              <MetricsPanel
                metrics={player.currentStep?.metrics}
                index={player.index}
                totalSteps={player.totalSteps}
                algorithm={algorithm}
              />
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}
