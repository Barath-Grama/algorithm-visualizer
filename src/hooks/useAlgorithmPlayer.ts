import { useCallback, useEffect, useRef, useState } from "react";
import type { AlgorithmStep } from "@/types";

/**
 * @param steps  the materialized run to play back
 * @param runId  stable identity of that run. Must be a primitive derived from
 *   the inputs, NOT the `steps` array: comparing array identity here would
 *   never settle, because the memo that produces `steps` re-allocates it on
 *   each render-phase retry, re-triggering the reset below forever.
 */
export function useAlgorithmPlayer(steps: AlgorithmStep[], runId: string) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speedMs, setSpeedMs] = useState(500);
  const [renderedRunId, setRenderedRunId] = useState(runId);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset the playhead whenever the run changes. This runs *during* render
  // rather than in an effect: an effect fires after paint, so switching to a
  // shorter run would flash one frame of the old index against the new steps
  // (or of `undefined`, if the new run has fewer steps than that index).
  if (runId !== renderedRunId) {
    setRenderedRunId(runId);
    setIndex(0);
    setPlaying(false);
  }

  useEffect(() => {
    if (!playing) return;
    if (index >= steps.length - 1) {
      setPlaying(false);
      return;
    }
    timerRef.current = setTimeout(() => {
      setIndex((i) => Math.min(i + 1, steps.length - 1));
    }, speedMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [playing, index, speedMs, steps.length]);

  const play = useCallback(() => {
    if (steps.length === 0) return;
    if (index >= steps.length - 1) setIndex(0);
    setPlaying(true);
  }, [index, steps.length]);

  const pause = useCallback(() => setPlaying(false), []);

  const stepForward = useCallback(() => {
    setPlaying(false);
    setIndex((i) => Math.min(i + 1, steps.length - 1));
  }, [steps.length]);

  const stepBackward = useCallback(() => {
    setPlaying(false);
    setIndex((i) => Math.max(i - 1, 0));
  }, []);

  const reset = useCallback(() => {
    setPlaying(false);
    setIndex(0);
  }, []);

  const goToEnd = useCallback(() => {
    setPlaying(false);
    setIndex(Math.max(steps.length - 1, 0));
  }, [steps.length]);

  const seek = useCallback(
    (i: number) => {
      setPlaying(false);
      setIndex(Math.min(Math.max(i, 0), Math.max(steps.length - 1, 0)));
    },
    [steps.length]
  );

  const currentStep: AlgorithmStep | undefined = steps[index];
  const isComplete = index >= steps.length - 1 && steps.length > 0;

  return {
    index,
    currentStep,
    totalSteps: steps.length,
    playing,
    speedMs,
    setSpeedMs,
    play,
    pause,
    stepForward,
    stepBackward,
    reset,
    goToEnd,
    seek,
    isComplete,
  };
}
