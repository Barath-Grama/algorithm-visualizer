import { useCallback, useEffect, useRef, useState } from "react";
import type { MeasurableId, MeasureOptions, SamplePoint } from "@/lib/measureAlgorithm";
import type { MeasureRequest, MeasureResponse } from "@/lib/measure.worker";

export interface SweepState {
  status: "idle" | "running" | "done" | "error";
  results: Record<string, SamplePoint[]>;
  progress: { completed: number; total: number };
  elapsedMs: number;
  error: string | null;
}

const IDLE: SweepState = {
  status: "idle",
  results: {},
  progress: { completed: 0, total: 0 },
  elapsedMs: 0,
  error: null,
};

/**
 * Drives complexity sweeps in a Web Worker.
 *
 * The worker is created lazily on first run and torn down on unmount. A run id
 * guards against a stale worker's messages landing after the user has started
 * a new sweep.
 */
export function useComplexitySweep() {
  const [state, setState] = useState<SweepState>(IDLE);
  const workerRef = useRef<Worker | null>(null);
  const runIdRef = useRef(0);

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  const run = useCallback(
    (
      algorithmIds: MeasurableId[],
      sizes: number[],
      trials: number,
      options?: MeasureOptions
    ) => {
      // Terminating rather than reusing guarantees no in-flight sweep can keep
      // posting progress for a configuration the user has already changed.
      workerRef.current?.terminate();
      const worker = new Worker(new URL("../lib/measure.worker.ts", import.meta.url), {
        type: "module",
      });
      workerRef.current = worker;

      const runId = ++runIdRef.current;
      setState({
        status: "running",
        results: {},
        progress: { completed: 0, total: algorithmIds.length * sizes.length },
        elapsedMs: 0,
        error: null,
      });

      worker.addEventListener("message", (event: MessageEvent<MeasureResponse>) => {
        if (runId !== runIdRef.current) return;
        const message = event.data;

        if (message.type === "progress") {
          setState((s) => ({
            ...s,
            progress: { completed: message.completed, total: message.total },
          }));
        } else if (message.type === "result") {
          setState((s) => ({
            ...s,
            status: "done",
            results: message.results,
            elapsedMs: message.elapsedMs,
          }));
        } else {
          setState((s) => ({ ...s, status: "error", error: message.message }));
        }
      });

      worker.addEventListener("error", (event) => {
        if (runId !== runIdRef.current) return;
        setState((s) => ({ ...s, status: "error", error: event.message }));
      });

      worker.postMessage({
        type: "run",
        algorithmIds,
        sizes,
        trials,
        options,
      } satisfies MeasureRequest);
    },
    []
  );

  const cancel = useCallback(() => {
    runIdRef.current++;
    workerRef.current?.terminate();
    workerRef.current = null;
    setState(IDLE);
  }, []);

  return { ...state, run, cancel };
}
