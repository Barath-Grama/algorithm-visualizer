// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import type { AlgorithmStep } from "@/types";
import { useAlgorithmPlayer } from "./useAlgorithmPlayer";

/** Fresh array identity every call — mirrors what useMemo hands the hook. */
const makeSteps = (count: number): AlgorithmStep[] =>
  Array.from({ length: count }, (_, i) => ({
    description: `step ${i}`,
    metrics: { comparisons: i, swaps: 0, arrayAccesses: 0 },
  }));

describe("useAlgorithmPlayer", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("starts at the first step", () => {
    const { result } = renderHook(() => useAlgorithmPlayer(makeSteps(5), "run-a"));
    expect(result.current.index).toBe(0);
    expect(result.current.totalSteps).toBe(5);
    expect(result.current.playing).toBe(false);
  });

  it("steps forward and backward within bounds", () => {
    const { result } = renderHook(() => useAlgorithmPlayer(makeSteps(3), "run-a"));

    act(() => result.current.stepForward());
    act(() => result.current.stepForward());
    act(() => result.current.stepForward()); // clamps at the end
    expect(result.current.index).toBe(2);

    act(() => result.current.stepBackward());
    act(() => result.current.stepBackward());
    act(() => result.current.stepBackward()); // clamps at the start
    expect(result.current.index).toBe(0);
  });

  it("seeks, resets and jumps to the end", () => {
    const { result } = renderHook(() => useAlgorithmPlayer(makeSteps(10), "run-a"));

    act(() => result.current.seek(4));
    expect(result.current.index).toBe(4);
    act(() => result.current.seek(999));
    expect(result.current.index).toBe(9);
    act(() => result.current.seek(-5));
    expect(result.current.index).toBe(0);

    act(() => result.current.goToEnd());
    expect(result.current.index).toBe(9);
    expect(result.current.isComplete).toBe(true);

    act(() => result.current.reset());
    expect(result.current.index).toBe(0);
  });

  it("advances on a timer while playing and stops at the end", () => {
    const { result } = renderHook(() => useAlgorithmPlayer(makeSteps(3), "run-a"));

    act(() => result.current.play());
    expect(result.current.playing).toBe(true);

    act(() => void vi.advanceTimersByTime(result.current.speedMs));
    expect(result.current.index).toBe(1);

    act(() => void vi.advanceTimersByTime(result.current.speedMs));
    expect(result.current.index).toBe(2);
    expect(result.current.playing).toBe(false);
  });

  it("replays from the start when play is pressed at the end", () => {
    const { result } = renderHook(() => useAlgorithmPlayer(makeSteps(3), "run-a"));
    act(() => result.current.goToEnd());
    act(() => result.current.play());
    expect(result.current.index).toBe(0);
  });

  // --- Reset semantics -----------------------------------------------------
  // These two pin down the bug that once froze the app: the reset compared the
  // `steps` array by identity, but useMemo re-allocates that array on every
  // render-phase retry, so the reset re-fired forever and no state update could
  // ever commit. Keying on a stable runId is what makes it settle.

  it("resets the playhead when the run changes", () => {
    const { result, rerender } = renderHook(
      ({ steps, runId }) => useAlgorithmPlayer(steps, runId),
      { initialProps: { steps: makeSteps(10), runId: "run-a" } }
    );

    act(() => result.current.seek(7));
    expect(result.current.index).toBe(7);

    rerender({ steps: makeSteps(3), runId: "run-b" });
    expect(result.current.index).toBe(0);
    expect(result.current.playing).toBe(false);
    expect(result.current.currentStep).toBeDefined();
  });

  it("does NOT reset when only the steps array identity changes", () => {
    const { result, rerender } = renderHook(
      ({ steps, runId }) => useAlgorithmPlayer(steps, runId),
      { initialProps: { steps: makeSteps(10), runId: "run-a" } }
    );

    act(() => result.current.seek(6));
    // Same run, brand-new array reference — exactly what a memo recompute does.
    rerender({ steps: makeSteps(10), runId: "run-a" });
    expect(result.current.index).toBe(6);
  });

  it("stays responsive across repeated identity churn", () => {
    const { result, rerender } = renderHook(
      ({ steps, runId }) => useAlgorithmPlayer(steps, runId),
      { initialProps: { steps: makeSteps(10), runId: "run-a" } }
    );

    // Under the old identity-based reset this loop never converged.
    for (let i = 0; i < 20; i++) rerender({ steps: makeSteps(10), runId: "run-a" });
    act(() => result.current.seek(5));
    expect(result.current.index).toBe(5);
  });

  it("never lands on an out-of-range step when switching to a shorter run", () => {
    const { result, rerender } = renderHook(
      ({ steps, runId }) => useAlgorithmPlayer(steps, runId),
      { initialProps: { steps: makeSteps(300), runId: "long" } }
    );

    act(() => result.current.goToEnd());
    rerender({ steps: makeSteps(4), runId: "short" });

    expect(result.current.index).toBeLessThan(4);
    expect(result.current.currentStep).toBeDefined();
  });

  it("handles an empty run without crashing", () => {
    const { result } = renderHook(() => useAlgorithmPlayer([], "empty"));
    expect(result.current.currentStep).toBeUndefined();
    expect(result.current.isComplete).toBe(false);
    act(() => result.current.play());
    expect(result.current.playing).toBe(false);
  });
});
