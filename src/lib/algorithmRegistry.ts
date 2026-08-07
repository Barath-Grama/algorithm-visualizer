import type { AlgorithmMeta } from "@/types";

export const ALGORITHMS: AlgorithmMeta[] = [
  // --- Sorting ---------------------------------------------------------
  {
    id: "bubble-sort",
    name: "Bubble Sort",
    category: "sorting",
    visualization: "array",
    complexity: { best: "O(n)", average: "O(n²)", worst: "O(n²)", space: "O(1)" },
    description:
      "Repeatedly steps through the list, swapping adjacent elements that are out of order. A single pass with no swaps means the array is sorted, allowing early termination.",
    pseudocode: `BubbleSort(arr):
  for i in 0..n:
    for j in 0..n-i-1:
      if arr[j] > arr[j+1]:
        swap(arr[j], arr[j+1])
  return arr`,
    code: `function bubbleSort(arr) {
  const n = arr.length;
  for (let i = 0; i < n; i++) {
    let swapped = false;
    for (let j = 0; j < n - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        swapped = true;
      }
    }
    if (!swapped) break;
  }
  return arr;
}`,
    codeLineMap: { 1: [1], 2: [3], 3: [5], 4: [6], 5: [7], 6: [13] },
  },
  {
    id: "quick-sort",
    name: "Quick Sort",
    category: "sorting",
    visualization: "array",
    complexity: { best: "O(n log n)", average: "O(n log n)", worst: "O(n²)", space: "O(log n)" },
    description:
      "Divide-and-conquer sort that partitions the array around a pivot. This implementation uses median-of-three pivot selection to avoid degenerate partitions on sorted input.",
    pseudocode: `QuickSort(arr, lo, hi):
  if lo < hi:
    p = Partition(arr, lo, hi)
    QuickSort(arr, lo, p-1)
    QuickSort(arr, p+1, hi)

Partition(arr, lo, hi):
  pivot = medianOfThree(arr, lo, hi)
  move pivot to hi
  i = lo - 1
  for j in lo..hi:
    if arr[j] < pivot: i++; swap(arr[i], arr[j])
  swap(arr[i+1], arr[hi])
  return i + 1`,
    code: `function quickSort(arr, lo = 0, hi = arr.length - 1) {
  if (lo >= hi) return arr;
  const p = partition(arr, lo, hi);
  quickSort(arr, lo, p - 1);
  quickSort(arr, p + 1, hi);
  return arr;
}

function partition(arr, lo, hi) {
  const pivotIdx = medianOfThree(arr, lo, hi);
  [arr[pivotIdx], arr[hi]] = [arr[hi], arr[pivotIdx]];
  const pivot = arr[hi];
  let i = lo - 1;
  for (let j = lo; j < hi; j++) {
    if (arr[j] < pivot) {
      i++;
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
  [arr[i + 1], arr[hi]] = [arr[hi], arr[i + 1]];
  return i + 1;
}`,
    codeLineMap: {
      1: [1], 2: [2], 3: [3], 4: [4], 5: [5],
      7: [9], 8: [10], 9: [11, 12], 10: [13], 11: [14], 12: [15, 16, 17], 13: [20], 14: [21],
    },
  },
  {
    id: "merge-sort",
    name: "Merge Sort",
    category: "sorting",
    visualization: "array",
    complexity: { best: "O(n log n)", average: "O(n log n)", worst: "O(n log n)", space: "O(n)" },
    description:
      "Stable divide-and-conquer sort. Recursively splits the array into single-element subarrays, then merges them back together in sorted order.",
    pseudocode: `MergeSort(arr, lo, hi):
  if lo >= hi: return
  mid = (lo + hi) / 2
  MergeSort(arr, lo, mid)
  MergeSort(arr, mid+1, hi)
  Merge(arr, lo, mid, hi)

Merge(arr, lo, mid, hi):
  left = arr[lo..mid]; right = arr[mid+1..hi]
  while both halves still have elements:
    move the smaller front element into arr[k++]
  copy any remaining elements back into arr`,
    code: `function mergeSort(arr, lo = 0, hi = arr.length - 1) {
  if (lo >= hi) return arr;
  const mid = Math.floor((lo + hi) / 2);
  mergeSort(arr, lo, mid);
  mergeSort(arr, mid + 1, hi);
  merge(arr, lo, mid, hi);
  return arr;
}

function merge(arr, lo, mid, hi) {
  const left = arr.slice(lo, mid + 1);
  const right = arr.slice(mid + 1, hi + 1);
  let i = 0, j = 0, k = lo;
  while (i < left.length && j < right.length) {
    arr[k++] = left[i] <= right[j] ? left[i++] : right[j++];
  }
  while (i < left.length) arr[k++] = left[i++];
  while (j < right.length) arr[k++] = right[j++];
}`,
    codeLineMap: {
      1: [1], 2: [2], 3: [3], 4: [4], 5: [5], 6: [6],
      8: [10], 9: [11, 12], 10: [14], 11: [15], 12: [17, 18],
    },
  },
  {
    id: "heap-sort",
    name: "Heap Sort",
    category: "sorting",
    visualization: "array",
    complexity: { best: "O(n log n)", average: "O(n log n)", worst: "O(n log n)", space: "O(1)" },
    description:
      "Builds a max-heap from the array, then repeatedly extracts the maximum element and restores the heap property, achieving consistent O(n log n) performance in-place.",
    pseudocode: `HeapSort(arr):
  buildMaxHeap(arr)
  for end from n-1 downto 1:
    swap(arr[0], arr[end])
    heapify(arr, end, 0)

heapify(arr, size, root):
  largest = root; l = 2*root+1; r = 2*root+2
  if arr[l] > arr[largest]: largest = l
  if arr[r] > arr[largest]: largest = r
  if largest != root:
    swap(arr[root], arr[largest])
    heapify(arr, size, largest)`,
    code: `function heapSort(arr) {
  const n = arr.length;
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) heapify(arr, n, i);
  for (let end = n - 1; end > 0; end--) {
    [arr[0], arr[end]] = [arr[end], arr[0]];
    heapify(arr, end, 0);
  }
  return arr;
}

function heapify(arr, size, root) {
  let largest = root;
  const l = 2 * root + 1, r = 2 * root + 2;
  if (l < size && arr[l] > arr[largest]) largest = l;
  if (r < size && arr[r] > arr[largest]) largest = r;
  if (largest !== root) {
    [arr[root], arr[largest]] = [arr[largest], arr[root]];
    heapify(arr, size, largest);
  }
}`,
    codeLineMap: {
      1: [1], 2: [3], 3: [4], 4: [5], 5: [6],
      7: [11], 8: [12, 13], 9: [14], 10: [15], 11: [16], 12: [17], 13: [18],
    },
  },
  {
    id: "insertion-sort",
    name: "Insertion Sort",
    category: "sorting",
    visualization: "array",
    complexity: { best: "O(n)", average: "O(n²)", worst: "O(n²)", space: "O(1)" },
    description:
      "Builds a sorted region one element at a time, inserting each new element into its correct position. Exhibits strong cache locality and performs well on small or nearly-sorted arrays.",
    pseudocode: `InsertionSort(arr):
  for i in 1..n:
    key = arr[i]
    j = i - 1
    while j >= 0 and arr[j] > key:
      arr[j+1] = arr[j]
      j--
    arr[j+1] = key`,
    code: `function insertionSort(arr) {
  for (let i = 1; i < arr.length; i++) {
    const key = arr[i];
    let j = i - 1;
    while (j >= 0 && arr[j] > key) {
      arr[j + 1] = arr[j];
      j--;
    }
    arr[j + 1] = key;
  }
  return arr;
}`,
    codeLineMap: { 1: [1], 2: [2], 3: [3], 4: [4], 5: [5], 6: [6], 7: [7], 8: [9] },
  },

  // --- Searching ---------------------------------------------------------
  {
    id: "linear-search",
    name: "Linear Search",
    category: "searching",
    visualization: "array",
    complexity: { best: "O(1)", average: "O(n)", worst: "O(n)", space: "O(1)" },
    description:
      "Sequentially examines each element until the target is found or the list is exhausted. Requires no preprocessing and works on unsorted data.",
    pseudocode: `LinearSearch(arr, target):
  for i in 0..n:
    if arr[i] == target: return i
  return -1`,
    code: `function linearSearch(arr, target) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === target) return i;
  }
  return -1;
}`,
    codeLineMap: { 1: [1], 2: [2], 3: [3], 4: [5] },
  },
  {
    id: "binary-search",
    name: "Binary Search",
    category: "searching",
    visualization: "array",
    complexity: { best: "O(1)", average: "O(log n)", worst: "O(log n)", space: "O(1)" },
    description:
      "Repeatedly halves the search space on a sorted array by comparing the target to the midpoint, discarding the half that cannot contain it.",
    pseudocode: `BinarySearch(arr, target):
  lo = 0; hi = n - 1
  while lo <= hi:
    mid = (lo + hi) / 2
    if arr[mid] == target: return mid
    else if arr[mid] < target: lo = mid + 1
    else: hi = mid - 1
  return -1`,
    code: `function binarySearch(arr, target) {
  let lo = 0, hi = arr.length - 1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}`,
    codeLineMap: { 1: [1], 2: [2], 3: [3], 4: [4], 5: [5], 6: [6], 7: [7], 8: [9] },
  },
  {
    id: "jump-search",
    name: "Jump Search",
    category: "searching",
    visualization: "array",
    complexity: { best: "O(1)", average: "O(√n)", worst: "O(√n)", space: "O(1)" },
    description:
      "A hybrid approach that jumps forward by fixed block size on a sorted array, then performs a linear scan within the identified block.",
    pseudocode: `JumpSearch(arr, target):
  step = floor(sqrt(n))
  prev = 0; curr = min(step, n) - 1
  while curr < n-1 and arr[curr] < target:
    prev = curr + 1; curr = min(curr + step, n-1)
  if arr[curr] < target: return -1
  for i in prev..curr:
    if arr[i] == target: return i
  return -1`,
    code: `function jumpSearch(arr, target) {
  const n = arr.length;
  const step = Math.max(1, Math.floor(Math.sqrt(n)));
  let prev = 0, curr = Math.min(step, n) - 1;
  // curr < n - 1 (not curr < n): once curr pins to the last index it can no
  // longer advance, so the looser bound would spin forever on a too-big target.
  while (curr < n - 1 && arr[curr] < target) {
    prev = curr + 1;
    curr = Math.min(curr + step, n - 1);
  }
  if (arr[curr] < target) return -1;
  for (let i = prev; i <= curr; i++) {
    if (arr[i] === target) return i;
  }
  return -1;
}`,
    codeLineMap: { 1: [1], 2: [3], 3: [4], 4: [7], 5: [8, 9], 6: [11], 7: [12], 8: [13], 9: [15] },
  },

  // --- Graph ---------------------------------------------------------
  {
    id: "bfs",
    name: "Breadth-First Search",
    category: "graph",
    visualization: "graph",
    complexity: { best: "O(V+E)", average: "O(V+E)", worst: "O(V+E)", space: "O(V)" },
    description:
      "Explores the graph level-by-level from a source vertex using a queue, guaranteeing shortest paths in unweighted graphs.",
    pseudocode: `BFS(graph, start):
  queue = [start]; visited = {start}
  while queue not empty:
    u = queue.dequeue()
    for each neighbour v of u:
      if v not in visited:
        visited.add(v)
        queue.enqueue(v)`,
    code: `function bfs(adj, start) {
  const visited = new Set([start]);
  const queue = [start];
  const order = [];
  while (queue.length) {
    const u = queue.shift();
    order.push(u);
    for (const v of adj.get(u)) {
      if (!visited.has(v)) {
        visited.add(v);
        queue.push(v);
      }
    }
  }
  return order;
}`,
    codeLineMap: { 1: [1], 2: [2, 3], 3: [5], 4: [6], 5: [8], 6: [9], 7: [10], 8: [11] },
  },
  {
    id: "dfs",
    name: "Depth-First Search",
    category: "graph",
    visualization: "graph",
    complexity: { best: "O(V+E)", average: "O(V+E)", worst: "O(V+E)", space: "O(V)" },
    description:
      "Recursively explores as far as possible along each branch before backtracking, using a stack (explicit or via recursion).",
    pseudocode: `DFS(graph, u, visited):
  visited.add(u)
  for each neighbour v of u:
    if v not in visited:
      DFS(graph, v, visited)`,
    code: `function dfs(adj, u, visited = new Set(), order = []) {
  visited.add(u);
  order.push(u);
  for (const v of adj.get(u)) {
    if (!visited.has(v)) dfs(adj, v, visited, order);
  }
  return order;
}`,
    codeLineMap: { 1: [1], 2: [2], 3: [4], 4: [5], 5: [5] },
  },
  {
    id: "dijkstra",
    name: "Dijkstra's Algorithm",
    category: "graph",
    visualization: "graph",
    complexity: {
      best: "O((V+E) log V)",
      average: "O((V+E) log V)",
      worst: "O((V+E) log V)",
      space: "O(V)",
    },
    description:
      "Computes shortest paths from a source to all vertices in a weighted graph with non-negative edge weights, greedily expanding the closest unvisited node.",
    pseudocode: `Dijkstra(graph, start):
  dist[start] = 0; others = ∞
  while unvisited nodes remain:
    u = unvisited node with min dist
    mark u visited
    for each edge (u, v, w):
      if dist[u] + w < dist[v]:
        dist[v] = dist[u] + w`,
    code: `function dijkstra(adj, nodes, start) {
  const dist = Object.fromEntries(nodes.map(n => [n, n === start ? 0 : Infinity]));
  const visited = new Set();
  while (visited.size < nodes.length) {
    const u = nodes
      .filter(n => !visited.has(n))
      .reduce((a, b) => (dist[a] < dist[b] ? a : b));
    visited.add(u);
    for (const { to, weight } of adj.get(u)) {
      if (dist[u] + weight < dist[to]) dist[to] = dist[u] + weight;
    }
  }
  return dist;
}`,
    codeLineMap: { 1: [1], 2: [2], 3: [4], 4: [5, 6, 7], 5: [8], 6: [9], 7: [10], 8: [10] },
  },
  {
    id: "bellman-ford",
    name: "Bellman-Ford Algorithm",
    category: "graph",
    visualization: "graph",
    complexity: { best: "O(VE)", average: "O(VE)", worst: "O(VE)", space: "O(V)" },
    description:
      "Computes shortest paths from a source even with negative edge weights (no negative cycles), by relaxing every edge V-1 times.",
    pseudocode: `BellmanFord(graph, start):
  dist[start] = 0; others = ∞
  repeat V-1 times:
    for each edge (u, v, w):
      if dist[u] + w < dist[v]:
        dist[v] = dist[u] + w`,
    code: `function bellmanFord(edges, nodes, start) {
  const dist = Object.fromEntries(nodes.map(n => [n, n === start ? 0 : Infinity]));
  for (let i = 1; i < nodes.length; i++) {
    for (const { from, to, weight } of edges) {
      if (dist[from] + weight < dist[to]) dist[to] = dist[from] + weight;
    }
  }
  return dist;
}`,
    codeLineMap: { 1: [1], 2: [2], 3: [3], 4: [4], 5: [5], 6: [5] },
  },
  {
    id: "prim",
    name: "Minimum Spanning Tree (Prim's)",
    category: "graph",
    visualization: "graph",
    complexity: { best: "O(V²)", average: "O(V²)", worst: "O(V²)", space: "O(V)" },
    description:
      "Greedily grows a minimum spanning tree by repeatedly adding the cheapest edge that connects a new vertex to the existing tree.",
    pseudocode: `Prim(graph, start):
  MST = {start}
  while MST doesn't span all vertices:
    pick cheapest edge (u, v) with u in MST, v not in MST
    add v and the edge to MST`,
    code: `function prim(adj, nodes, start) {
  const inMst = new Set([start]);
  const mstEdges = [];
  while (inMst.size < nodes.length) {
    let best = null;
    for (const u of inMst) {
      for (const e of adj.get(u)) {
        if (!inMst.has(e.to) && (!best || e.weight < best.weight)) best = { ...e, from: u };
      }
    }
    if (!best) break;
    inMst.add(best.to);
    mstEdges.push(best);
  }
  return mstEdges;
}`,
    codeLineMap: { 1: [1], 2: [2], 3: [4], 4: [5, 6, 7, 8], 5: [12, 13] },
  },
  {
    id: "kruskal",
    name: "Minimum Spanning Tree (Kruskal's)",
    category: "graph",
    visualization: "graph",
    complexity: { best: "O(E log E)", average: "O(E log E)", worst: "O(E log E)", space: "O(V)" },
    description:
      "Sorts all edges by weight and greedily adds each edge that doesn't form a cycle, using a union-find structure to detect cycles efficiently.",
    pseudocode: `Kruskal(graph):
  sort edges by weight ascending
  for each edge (u, v, w) in order:
    if find(u) != find(v):
      union(u, v)
      add edge to MST`,
    code: `function kruskal(nodes, edges) {
  const parent = Object.fromEntries(nodes.map(n => [n, n]));
  const find = x => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  const mst = [];
  for (const e of [...edges].sort((a, b) => a.weight - b.weight)) {
    const [ra, rb] = [find(e.source), find(e.target)];
    if (ra !== rb) {
      parent[ra] = rb;
      mst.push(e);
    }
  }
  return mst;
}`,
    codeLineMap: { 1: [1], 2: [5], 3: [5], 4: [6, 7], 5: [8], 6: [9] },
  },

  // --- Dynamic Programming ---------------------------------------------
  {
    id: "knapsack",
    name: "0/1 Knapsack",
    category: "dp",
    visualization: "dp-table",
    complexity: { best: "O(nW)", average: "O(nW)", worst: "O(nW)", space: "O(nW)" },
    description:
      "Selects a subset of items maximizing total value within a weight capacity, using a 2D DP table where each cell represents the best value achievable with a given item count and capacity.",
    pseudocode: `Knapsack(weights, values, W):
  dp = array[0..n][0..W] of 0
  for i in 1..n:
    for w in 0..W:
      if weights[i] <= w:
        dp[i][w] = max(dp[i-1][w], values[i] + dp[i-1][w-weights[i]])
      else:
        dp[i][w] = dp[i-1][w]
  return dp[n][W]`,
    code: `function knapsack(weights, values, W) {
  const n = weights.length;
  const dp = Array.from({ length: n + 1 }, () => Array(W + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let w = 0; w <= W; w++) {
      dp[i][w] = weights[i - 1] > w
        ? dp[i - 1][w]
        : Math.max(dp[i - 1][w], values[i - 1] + dp[i - 1][w - weights[i - 1]]);
    }
  }
  return dp[n][W];
}`,
    codeLineMap: { 1: [1], 2: [3], 3: [4], 4: [5], 5: [6], 6: [8], 7: [6], 8: [7], 9: [11] },
  },
  {
    id: "fibonacci",
    name: "Fibonacci (DP)",
    category: "dp",
    visualization: "tree",
    complexity: { best: "O(n)", average: "O(n)", worst: "O(n)", space: "O(n)" },
    description:
      "Naive recursion recomputes overlapping subproblems exponentially (O(2ⁿ)); memoization caches each result, reducing the recursion tree to O(n) unique calls.",
    pseudocode: `Fib(n, memo = {}):
  if n in memo: return memo[n]
  if n <= 1: return n
  memo[n] = Fib(n-1) + Fib(n-2)
  return memo[n]`,
    code: `function fib(n, memo = new Map()) {
  if (memo.has(n)) return memo.get(n);
  if (n <= 1) return n;
  const result = fib(n - 1, memo) + fib(n - 2, memo);
  memo.set(n, result);
  return result;
}`,
    codeLineMap: { 1: [1], 2: [2], 3: [3], 4: [4], 5: [5, 6] },
  },

  // --- Backtracking ---------------------------------------------------
  {
    id: "n-queens",
    name: "N-Queens Problem",
    category: "backtracking",
    visualization: "board",
    complexity: { best: "O(N!)", average: "O(N!)", worst: "O(N!)", space: "O(N)" },
    description:
      "Places N queens on an N×N board so that no two attack each other, exploring placements row by row and pruning branches with conflicts via backtracking.",
    pseudocode: `NQueens(row, queens):
  if row == N: report solution; return
  for col in 0..N:
    if isSafe(row, col, queens):
      queens[row] = col
      NQueens(row + 1, queens)
      queens[row] = -1  // backtrack`,
    code: `function solveNQueens(n) {
  const queens = new Array(n).fill(-1);
  const solutions = [];
  function isSafe(row, col) {
    for (let r = 0; r < row; r++) {
      const c = queens[r];
      if (c === col || Math.abs(c - col) === Math.abs(r - row)) return false;
    }
    return true;
  }
  function solve(row) {
    if (row === n) { solutions.push([...queens]); return true; }
    for (let col = 0; col < n; col++) {
      if (isSafe(row, col)) {
        queens[row] = col;
        if (solve(row + 1)) return true;
        queens[row] = -1;
      }
    }
    return false;
  }
  solve(0);
  return solutions;
}`,
    codeLineMap: { 1: [11], 2: [12], 3: [13], 4: [14], 5: [15], 6: [16], 7: [17] },
  },
];

export function getAlgorithm(id: string): AlgorithmMeta | undefined {
  return ALGORITHMS.find((a) => a.id === id);
}

export const CATEGORY_LABELS: Record<string, string> = {
  sorting: "Sorting",
  searching: "Searching",
  graph: "Graph",
  dp: "Dynamic Programming",
  backtracking: "Backtracking",
};

export const CATEGORY_ORDER: Array<AlgorithmMeta["category"]> = [
  "sorting",
  "searching",
  "graph",
  "dp",
  "backtracking",
];
