import type { AlgorithmStep, StepGenerator } from "@/types";
import { freshMetrics } from "./helpers";

// ---------------------------------------------------------------------------
// N-Queens — O(N!) worst case, pruning reduces actual runtime substantially
// ---------------------------------------------------------------------------
export function* nQueensSteps(size: number): StepGenerator {
  const metrics = freshMetrics();
  const queens: number[] = new Array(size).fill(-1);
  let solutionsFound = 0;

  function isSafe(row: number, col: number): boolean {
    for (let r = 0; r < row; r++) {
      const c = queens[r];
      if (c === col || Math.abs(c - col) === Math.abs(r - row)) return false;
    }
    return true;
  }

  function snapshot(
    description: string,
    codeLine: number[],
    opts?: { activeRow?: number; activeCol?: number; conflict?: boolean }
  ): AlgorithmStep {
    return {
      description,
      metrics: { ...metrics },
      board: {
        size,
        queens: [...queens],
        activeRow: opts?.activeRow,
        activeCol: opts?.activeCol,
        conflict: opts?.conflict,
      },
      codeLine,
    };
  }

  function* solve(row: number): Generator<AlgorithmStep, boolean, unknown> {
    if (row === size) {
      solutionsFound++;
      yield snapshot(`Valid arrangement found — all ${size} queens placed safely!`, [2], {
        activeRow: row,
      });
      return true;
    }

    for (let col = 0; col < size; col++) {
      metrics.comparisons++;
      yield snapshot(`Test position (${row}, ${col}).`, [3, 4], { activeRow: row, activeCol: col });
      if (isSafe(row, col)) {
        queens[row] = col;
        metrics.swaps++;
        yield snapshot(`Placing queen at row ${row}, column ${col}.`, [5, 6], {
          activeRow: row,
          activeCol: col,
        });
        const found = yield* solve(row + 1);
        if (found) return true;
        queens[row] = -1;
        yield snapshot(`Backtrack — remove queen from row ${row}.`, [7], { activeRow: row });
      } else {
        yield snapshot(`Conflict at (${row}, ${col}) — same column or diagonal.`, [4], {
          activeRow: row,
          activeCol: col,
          conflict: true,
        });
      }
    }
    return false;
  }

  yield snapshot(`Solving the ${size}-Queens problem with backtracking.`, [1]);
  const solved = yield* solve(0);
  yield snapshot(
    solved
      ? `Solution complete (${solutionsFound} found). Explored with pruning — ${metrics.comparisons} position checks.`
      : `No solution exists for N = ${size}.`,
    [1]
  );
}
