import type { AlgorithmStep, StepGenerator } from "@/types";
import { freshMetrics, makeArraySnapshotter } from "./helpers";

// ---------------------------------------------------------------------------
// Bubble Sort — O(n) best, O(n^2) average/worst, O(1) space
// ---------------------------------------------------------------------------
export function* bubbleSortSteps(input: number[]): StepGenerator {
  const arr = [...input];
  const n = arr.length;
  const metrics = freshMetrics();
  const { snapshot, setState, resetNonSorted } = makeArraySnapshotter(arr, metrics);

  yield snapshot("Starting Bubble Sort: repeated adjacent comparisons.", [1]);
  for (let i = 0; i < n; i++) {
    let swapped = false;
    for (let j = 0; j < n - i - 1; j++) {
      setState(j, "comparing");
      setState(j + 1, "comparing");
      metrics.comparisons++;
      metrics.arrayAccesses += 2;
      yield snapshot(`Comparing ${arr[j]} and ${arr[j + 1]}.`, [3, 4]);
      if (arr[j] > arr[j + 1]) {
        const [left, right] = [arr[j], arr[j + 1]];
        setState(j, "swapping");
        setState(j + 1, "swapping");
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        metrics.swaps++;
        metrics.arrayAccesses += 4;
        swapped = true;
        yield snapshot(`Swapped ${left} and ${right} — out of order.`, [5]);
      }
      resetNonSorted();
    }
    setState(n - i - 1, "sorted");
    yield snapshot(`${arr[n - i - 1]} is now in its final sorted position.`, [2]);
    if (!swapped) break;
  }
  for (let k = 0; k < n; k++) setState(k, "sorted");
  yield snapshot("Array is fully sorted.", [6]);
}

// ---------------------------------------------------------------------------
// Insertion Sort — O(n) best, O(n^2) average/worst, O(1) space
// ---------------------------------------------------------------------------
export function* insertionSortSteps(input: number[]): StepGenerator {
  const arr = [...input];
  const n = arr.length;
  const metrics = freshMetrics();
  const { snapshot, setState, resetNonSorted } = makeArraySnapshotter(arr, metrics);

  setState(0, "sorted");
  yield snapshot("First element trivially sorted.", [1]);

  for (let i = 1; i < n; i++) {
    const key = arr[i];
    let j = i - 1;
    setState(i, "pivot");
    yield snapshot(`Inserting ${key} into the sorted region.`, [3, 4]);
    while (j >= 0 && arr[j] > key) {
      metrics.comparisons++;
      metrics.arrayAccesses += 2;
      setState(j, "comparing");
      yield snapshot(`${arr[j]} > ${key}, shifting right.`, [5, 6]);
      arr[j + 1] = arr[j];
      metrics.swaps++;
      setState(j, "default");
      j--;
    }
    // The comparison that fails and ends the loop still counts.
    metrics.comparisons++;
    if (j >= 0) metrics.arrayAccesses += 2;
    arr[j + 1] = key;
    resetNonSorted();
    for (let k = 0; k <= i; k++) setState(k, "sorted");
    yield snapshot(`${key} placed at index ${j + 1}.`, [8]);
  }
  yield snapshot("Array is fully sorted.", [1]);
}

// ---------------------------------------------------------------------------
// Quick Sort (median-of-three pivot) — O(n log n) avg, O(n^2) worst, O(log n) space
// ---------------------------------------------------------------------------
export function* quickSortSteps(input: number[]): StepGenerator {
  const arr = [...input];
  const metrics = freshMetrics();
  const { snapshot, setState, resetNonSorted } = makeArraySnapshotter(arr, metrics);

  function medianOfThree(lo: number, hi: number): number {
    const mid = Math.floor((lo + hi) / 2);
    const trio = [lo, mid, hi].sort((a, b) => arr[a] - arr[b]);
    return trio[1];
  }

  function* partition(lo: number, hi: number): Generator<AlgorithmStep, number, unknown> {
    const pivotIdx = medianOfThree(lo, hi);
    const pivotVal = arr[pivotIdx];
    [arr[pivotIdx], arr[hi]] = [arr[hi], arr[pivotIdx]];
    setState(hi, "pivot");
    yield snapshot(`Pivot chosen: ${pivotVal} (median-of-three).`, [8, 9]);

    let i = lo - 1;
    for (let j = lo; j < hi; j++) {
      setState(j, "comparing");
      metrics.comparisons++;
      metrics.arrayAccesses++;
      yield snapshot(`Comparing ${arr[j]} with pivot ${pivotVal}.`, [11, 12]);
      if (arr[j] < pivotVal) {
        i++;
        [arr[i], arr[j]] = [arr[j], arr[i]];
        metrics.swaps++;
        metrics.arrayAccesses += 4;
        yield snapshot(`${arr[i]} < pivot — moved into the lower partition.`, [12]);
      }
      resetNonSorted();
      setState(hi, "pivot");
    }
    [arr[i + 1], arr[hi]] = [arr[hi], arr[i + 1]];
    metrics.swaps++;
    metrics.arrayAccesses += 4;
    setState(i + 1, "sorted");
    yield snapshot(`Pivot ${pivotVal} placed at its sorted index ${i + 1}.`, [13, 14]);
    return i + 1;
  }

  function* qs(lo: number, hi: number): StepGenerator {
    if (lo >= hi) {
      if (lo === hi) setState(lo, "sorted");
      return;
    }
    const p = yield* partition(lo, hi);
    yield* qs(lo, p - 1);
    yield* qs(p + 1, hi);
  }

  yield snapshot("Starting Quick Sort.", [1]);
  yield* qs(0, arr.length - 1);
  for (let k = 0; k < arr.length; k++) setState(k, "sorted");
  yield snapshot("Array is fully sorted.", [1]);
}

// ---------------------------------------------------------------------------
// Merge Sort — O(n log n) all cases, O(n) space
// ---------------------------------------------------------------------------
export function* mergeSortSteps(input: number[]): StepGenerator {
  const arr = [...input];
  const metrics = freshMetrics();
  const { snapshot, setState, resetNonSorted } = makeArraySnapshotter(arr, metrics);

  function* mergeSortRange(lo: number, hi: number): StepGenerator {
    if (lo >= hi) return;
    const mid = Math.floor((lo + hi) / 2);
    yield snapshot(`Dividing range [${lo}, ${hi}] at midpoint ${mid}.`, [3]);
    yield* mergeSortRange(lo, mid);
    yield* mergeSortRange(mid + 1, hi);
    yield* merge(lo, mid, hi);
  }

  function* merge(lo: number, mid: number, hi: number): StepGenerator {
    const left = arr.slice(lo, mid + 1);
    const right = arr.slice(mid + 1, hi + 1);
    // Copying the two halves into scratch buffers is itself hi-lo+1 reads.
    metrics.arrayAccesses += hi - lo + 1;
    let i = 0,
      j = 0,
      k = lo;
    for (let x = lo; x <= hi; x++) setState(x, "comparing");
    yield snapshot(`Merging subarrays [${lo}..${mid}] and [${mid + 1}..${hi}].`, [9]);

    while (i < left.length && j < right.length) {
      metrics.comparisons++;
      metrics.arrayAccesses += 3; // two reads to compare, one write back
      if (left[i] <= right[j]) {
        arr[k] = left[i];
        i++;
      } else {
        arr[k] = right[j];
        j++;
      }
      setState(k, "swapping");
      yield snapshot(`Placed ${arr[k]} at index ${k}.`, [10, 11]);
      setState(k, "comparing");
      k++;
    }
    while (i < left.length) {
      arr[k] = left[i];
      metrics.arrayAccesses += 2;
      setState(k, "swapping");
      i++;
      k++;
      yield snapshot(`Copied remaining left element ${arr[k - 1]}.`, [12]);
    }
    while (j < right.length) {
      arr[k] = right[j];
      metrics.arrayAccesses += 2;
      setState(k, "swapping");
      j++;
      k++;
      yield snapshot(`Copied remaining right element ${arr[k - 1]}.`, [12]);
    }
    resetNonSorted();
    for (let x = lo; x <= hi; x++) setState(x, "sorted");
    yield snapshot(`Range [${lo}, ${hi}] merged and sorted.`, [6]);
    if (lo !== 0 || hi !== arr.length - 1) {
      for (let x = lo; x <= hi; x++) setState(x, "default");
    }
  }

  yield snapshot("Starting Merge Sort.", [1]);
  yield* mergeSortRange(0, arr.length - 1);
  for (let k = 0; k < arr.length; k++) setState(k, "sorted");
  yield snapshot("Array is fully sorted.", [1]);
}

// ---------------------------------------------------------------------------
// Heap Sort — O(n log n) all cases, O(1) space
// ---------------------------------------------------------------------------
export function* heapSortSteps(input: number[]): StepGenerator {
  const arr = [...input];
  const n = arr.length;
  const metrics = freshMetrics();
  const { snapshot, setState, resetNonSorted } = makeArraySnapshotter(arr, metrics);

  function* heapify(size: number, root: number): StepGenerator {
    let largest = root;
    const l = 2 * root + 1;
    const r = 2 * root + 2;
    setState(root, "pivot");
    if (l < size) setState(l, "comparing");
    if (r < size) setState(r, "comparing");
    yield snapshot(`Sifting down at index ${root} to restore heap order.`, [9, 10]);

    if (l < size) {
      metrics.comparisons++;
      metrics.arrayAccesses += 2;
      if (arr[l] > arr[largest]) largest = l;
    }
    if (r < size) {
      metrics.comparisons++;
      metrics.arrayAccesses += 2;
      if (arr[r] > arr[largest]) largest = r;
    }

    if (largest !== root) {
      const [parent, child] = [arr[root], arr[largest]];
      [arr[root], arr[largest]] = [arr[largest], arr[root]];
      metrics.swaps++;
      metrics.arrayAccesses += 4;
      yield snapshot(`Swapped ${parent} and ${child} to fix heap property.`, [12]);
      resetNonSorted();
      yield* heapify(size, largest);
    }
    resetNonSorted();
  }

  yield snapshot("Building max heap from the array.", [2]);
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    yield* heapify(n, i);
  }
  yield snapshot("Max heap constructed. Beginning extraction phase.", [3]);

  for (let end = n - 1; end > 0; end--) {
    [arr[0], arr[end]] = [arr[end], arr[0]];
    metrics.swaps++;
    metrics.arrayAccesses += 4;
    setState(end, "sorted");
    yield snapshot(`Extracted max ${arr[end]} to the end of the array.`, [4]);
    resetNonSorted();
    for (let k = end; k < n; k++) setState(k, "sorted");
    yield* heapify(end, 0);
    for (let k = end; k < n; k++) setState(k, "sorted");
  }
  for (let k = 0; k < n; k++) setState(k, "sorted");
  yield snapshot("Array is fully sorted.", [1]);
}
