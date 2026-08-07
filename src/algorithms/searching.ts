import type { StepGenerator } from "@/types";
import { freshMetrics, makeArraySnapshotter } from "./helpers";

// ---------------------------------------------------------------------------
// Linear Search — O(1) best, O(n) average/worst, O(1) space
// ---------------------------------------------------------------------------
export function* linearSearchSteps(input: number[], target: number): StepGenerator {
  const arr = [...input];
  const metrics = freshMetrics();
  const { snapshot, setState } = makeArraySnapshotter(arr, metrics);

  yield snapshot(`Searching for ${target} sequentially.`, [1]);
  for (let i = 0; i < arr.length; i++) {
    setState(i, "comparing");
    metrics.comparisons++;
    metrics.arrayAccesses++;
    yield snapshot(`Checking index ${i}: is ${arr[i]} === ${target}?`, [2, 3]);
    if (arr[i] === target) {
      setState(i, "found");
      yield snapshot(`Found ${target} at index ${i}!`, [3]);
      return;
    }
    setState(i, "eliminated");
  }
  yield snapshot(`${target} not found in the array.`, [4]);
}

// ---------------------------------------------------------------------------
// Binary Search — O(1) best, O(log n) average/worst, requires sorted input
// ---------------------------------------------------------------------------
export function* binarySearchSteps(input: number[], target: number): StepGenerator {
  const arr = [...input].sort((a, b) => a - b);
  const metrics = freshMetrics();
  const { snapshot, setState, setRange } = makeArraySnapshotter(arr, metrics);

  let lo = 0;
  let hi = arr.length - 1;
  yield snapshot(`Searching sorted array for ${target}.`, [1]);
  setRange(lo, hi, "range");
  yield snapshot(`Active search range: [${lo}, ${hi}].`, [2]);

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    setState(mid, "comparing");
    metrics.comparisons++;
    metrics.arrayAccesses++;
    yield snapshot(`Midpoint index ${mid}: value ${arr[mid]}.`, [3, 4]);
    if (arr[mid] === target) {
      setState(mid, "found");
      yield snapshot(`Found ${target} at index ${mid}!`, [5]);
      return;
    } else if (arr[mid] < target) {
      for (let i = lo; i <= mid; i++) setState(i, "eliminated");
      lo = mid + 1;
      yield snapshot(`${arr[mid]} < ${target} — search right half.`, [6]);
    } else {
      for (let i = mid; i <= hi; i++) setState(i, "eliminated");
      hi = mid - 1;
      yield snapshot(`${arr[mid]} > ${target} — search left half.`, [7]);
    }
    setRange(lo, hi, "range");
  }
  yield snapshot(`${target} not found in the array.`, [8]);
}

// ---------------------------------------------------------------------------
// Jump Search — O(1) best, O(sqrt n) average/worst, requires sorted input
// ---------------------------------------------------------------------------
export function* jumpSearchSteps(input: number[], target: number): StepGenerator {
  const arr = [...input].sort((a, b) => a - b);
  const n = arr.length;
  const metrics = freshMetrics();
  const { snapshot, setState, setRange } = makeArraySnapshotter(arr, metrics);

  const step = Math.max(1, Math.floor(Math.sqrt(n)));
  yield snapshot(`Block size = √n ≈ ${step}. Jumping through blocks.`, [2]);

  let prev = 0;
  let curr = Math.min(step, n) - 1;
  // `curr < n - 1` (not `curr < n`) is what guarantees termination: once curr
  // reaches the last index it can no longer advance, so testing `curr < n`
  // would spin forever whenever the target exceeds every element.
  while (curr < n - 1 && arr[curr] < target) {
    setRange(prev, curr, "eliminated");
    metrics.comparisons++;
    metrics.arrayAccesses++;
    yield snapshot(`Block [${prev}, ${curr}] max is ${arr[curr]} < ${target}. Jump ahead.`, [4, 5]);
    prev = curr + 1;
    curr = Math.min(curr + step, n - 1);
  }

  metrics.comparisons++;
  metrics.arrayAccesses++;
  if (n === 0 || arr[curr] < target) {
    setRange(prev, curr, "eliminated");
    yield snapshot(`${target} is larger than every element — not found.`, [6]);
    return;
  }

  setRange(prev, curr, "range");
  yield snapshot(`Target block identified: [${prev}, ${curr}]. Linear scan begins.`, [7]);

  for (let i = prev; i <= curr; i++) {
    setState(i, "comparing");
    metrics.comparisons++;
    metrics.arrayAccesses++;
    yield snapshot(`Checking index ${i}: is ${arr[i]} === ${target}?`, [7, 8]);
    if (arr[i] === target) {
      setState(i, "found");
      yield snapshot(`Found ${target} at index ${i}!`, [8]);
      return;
    }
    setState(i, "eliminated");
  }
  yield snapshot(`${target} not found in the array.`, [9]);
}
