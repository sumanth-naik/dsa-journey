#!/usr/bin/env node
// fix-subcategories.mjs — Better subcategory mapping from repo folders

import { readFileSync, writeFileSync } from 'fs';
import { execFileSync } from 'child_process';

// Enhanced mapping: repo folder → subcategory
const SUBCATEGORY_FIXES = {
  // DP subcategories
  'DP - Coin Change': 'coin-change',
  'DP - Partitions': 'partitions',
  'DP Take or Not Take': 'take-or-skip',
  'DP on Grids': 'grids',
  'DP on Trees': 'tree-dp',
  'DP with Greedy': 'dp-greedy',
  'DP on Digits': 'digit-dp',
  'DP on enumeration for distinct subsequences': 'distinct-subsequences',
  'Bitmasking DP': 'bitmask-dp',
  'Minimax DP': 'minimax',

  // Graphs subcategories
  'Graphs - BFS In Grid': 'grid-bfs',
  'Graphs - DFS in Grid': 'grid-dfs',
  'Graphs - Djikstras': 'shortest-path',
  'Graphs - Bellman Fords': 'shortest-path',
  'Graphs - Multipoint BFS': 'multi-source-bfs',
  'Graphs - Cycle Detection': 'cycle-detection',
  'Graphs - Number of Components': 'components',
  'Graphs - Coloring': 'bipartite',
  'Kahn\'s Algo for Topo Sort': 'topological-sort',
  'Union Find': 'union-find',

  // Trees subcategories
  'Trees - LCA': 'lca',
  'Trees - Max Diameter': 'diameter',
  'Binary Search Tree Property - Validating': 'bst',
  'Binary Search Tree Property - Inorder is sorted': 'bst',
  'Binary Tree Properties': 'properties',

  // Binary Search subcategories
  'Binary Search on Answer': 'on-answer',
  'Binary Search for length on DP solution': 'on-length',
  'Binary Search in Two Arrays': 'two-arrays',

  // Greedy subcategories
  'Greedy in intervals': 'intervals',
  'Greedy in intervals using heap': 'intervals-heap',
  'Greedy - Pick two maximums': 'two-max',

  // Two Pointer subcategories
  'Two Pointer - Expand from middle': 'expand-middle',
  'Three Pointer': 'three-pointer',

  // Stack subcategories
  'Monotonic Stacks': 'monotonic',
  'Monotonic Queues': 'monotonic-queue',
  'Stacks - Parantheses': 'parentheses',

  // Linked List subcategories
  'Linked List Cycle Method': 'cycle',
  'List Reversal': 'reversal',
  'Linked list - Kth Node': 'kth-node',

  // Sliding Window subcategories
  'Sliding Window on Auxillary Array': 'auxiliary-array',

  // Backtracking subcategories
  'Character Combinations': 'combinations',

  // Heap subcategories
  'Two Heaps': 'two-heaps',
  'K Sorted Lists': 'k-lists',
};

// Load repo mapping
const repoMapping = JSON.parse(readFileSync('tools/repo-pattern-mapping.json', 'utf-8'));

// Update subcategories in mapping
for (const [folder, info] of Object.entries(repoMapping.mappings)) {
  if (SUBCATEGORY_FIXES[folder]) {
    info.subcategory = SUBCATEGORY_FIXES[folder];
  }
}

writeFileSync('tools/repo-pattern-mapping.json', JSON.stringify(repoMapping, null, 2) + '\n');
console.log('✓ Updated repo-pattern-mapping.json with better subcategories\n');

// Now update existing problems with better subcategories based on their titles
const patternFiles = execFileSync('find', ['data/patterns', '-name', '*.json', '-not', '-name', '_template.json'],
  { encoding: 'utf-8' }).trim().split('\n');

// Pattern-specific subcategory inference rules
const INFERENCE_RULES = {
  'one-d-dp': {
    'house-robber': 'take-or-skip',
    'house-robber-ii': 'take-or-skip',
    'climbing-stairs': 'basics',
    'min-cost-climbing-stairs': 'basics',
    'coin-change': 'coin-change',
    'partition-equal-subset-sum': 'partitions',
    'longest-increasing-subsequence': 'lis',
    'longest-palindromic-substring': 'palindromes',
    'palindromic-substrings': 'palindromes',
    'word-break': 'string-dp',
    'decode-ways': 'string-dp',
    'maximum-product-subarray': 'kadane-variant',
    'edit-distance': 'string-dp',
    'longest-common-subsequence': 'string-dp',
    'longest-increasing-path-in-a-matrix': 'grid-dp',
    'regular-expression-matching': 'string-matching',
  },
  'two-d-dp': {
    'unique-paths': 'grids',
    'longest-common-subsequence': 'strings',
    'edit-distance': 'strings',
    'distinct-subsequences': 'strings',
    'interleaving-string': 'strings',
    'burst-balloons': 'partitions',
    'regular-expression-matching': 'string-matching',
    'best-time-to-buy-and-sell-stock-with-cooldown': 'state-machine',
    'coin-change-2': 'coin-change',
    'coin-change-ii': 'coin-change',
    'target-sum': 'subset-sum',
    'longest-increasing-path-in-a-matrix': 'grid-dp',
  },
  'graphs': {
    'number-of-islands': 'grid-dfs',
    'clone-graph': 'graph-basics',
    'max-area-of-island': 'grid-dfs',
    'rotting-oranges': 'grid-bfs',
    'pacific-atlantic-water-flow': 'grid-dfs',
    'surrounded-regions': 'grid-dfs',
    'walls-and-gates': 'grid-bfs',
    'course-schedule': 'topological-sort',
    'course-schedule-ii': 'topological-sort',
    'redundant-connection': 'union-find',
    'graph-valid-tree': 'union-find',
    'number-of-connected-components-in-an-undirected-graph': 'union-find',
    'word-ladder': 'bfs',
  },
  'advanced-graphs': {
    'reconstruct-itinerary': 'euler-path',
    'network-delay-time': 'shortest-path',
    'min-cost-to-connect-all-points': 'mst',
    'cheapest-flights-within-k-stops': 'shortest-path',
    'swim-in-rising-water': 'shortest-path',
    'alien-dictionary': 'topological-sort',
  },
  'trees': {
    'invert-binary-tree': 'basics',
    'maximum-depth-of-binary-tree': 'basics',
    'diameter-of-binary-tree': 'diameter',
    'balanced-binary-tree': 'basics',
    'same-tree': 'basics',
    'subtree-of-another-tree': 'basics',
    'lowest-common-ancestor-of-a-binary-search-tree': 'lca',
    'lowest-common-ancestor-of-a-binary-tree': 'lca',
    'validate-binary-search-tree': 'bst',
    'kth-smallest-element-in-a-bst': 'bst',
    'binary-tree-level-order-traversal': 'traversal',
    'binary-tree-right-side-view': 'traversal',
    'count-good-nodes-in-binary-tree': 'dfs',
    'construct-binary-tree-from-preorder-and-inorder-traversal': 'construction',
    'binary-tree-maximum-path-sum': 'path-sum',
    'serialize-and-deserialize-binary-tree': 'serialization',
  },
  'binary-search': {
    'binary-search': 'basics',
    'search-a-2d-matrix': 'basics',
    'koko-eating-bananas': 'on-answer',
    'find-minimum-in-rotated-sorted-array': 'rotated-array',
    'search-in-rotated-sorted-array': 'rotated-array',
    'time-based-key-value-store': 'design',
    'median-of-two-sorted-arrays': 'two-arrays',
  },
  'backtracking': {
    'subsets': 'subsets',
    'subsets-ii': 'subsets',
    'permutations': 'permutations',
    'combination-sum': 'combinations',
    'combination-sum-ii': 'combinations',
    'letter-combinations-of-a-phone-number': 'combinations',
    'palindrome-partitioning': 'partitioning',
    'word-search': 'grid-backtracking',
    'n-queens': 'board-games',
  },
  'linked-list': {
    'reverse-linked-list': 'reversal',
    'merge-two-sorted-lists': 'basics',
    'reorder-list': 'manipulation',
    'remove-nth-node-from-end-of-list': 'basics',
    'copy-list-with-random-pointer': 'deep-copy',
    'add-two-numbers': 'arithmetic',
    'linked-list-cycle': 'cycle',
    'linked-list-cycle-ii': 'cycle',
    'find-the-duplicate-number': 'cycle',
    'lru-cache': 'design',
    'merge-k-sorted-lists': 'merge',
  },
  'stack': {
    'valid-parentheses': 'parentheses',
    'min-stack': 'design',
    'evaluate-reverse-polish-notation': 'expression-eval',
    'generate-parentheses': 'parentheses',
    'daily-temperatures': 'monotonic',
    'car-fleet': 'monotonic',
    'largest-rectangle-in-histogram': 'monotonic',
  },
  'sliding-window': {
    'best-time-to-buy-and-sell-stock': 'basics',
    'longest-substring-without-repeating-characters': 'variable-size',
    'longest-substring-without-repeating': 'variable-size',
    'longest-repeating-character-replacement': 'variable-size',
    'permutation-in-string': 'fixed-size',
    'minimum-window-substring': 'variable-size',
  },
  'two-pointers': {
    'valid-palindrome': 'basics',
    'two-sum-ii': 'basics',
    'three-sum': 'triplets',
    '3sum': 'triplets',
    'container-with-most-water': 'basics',
    'trapping-rain-water': 'advanced',
  },
  'greedy': {
    'maximum-subarray': 'kadane',
    'jump-game': 'array-jumps',
    'jump-game-ii': 'array-jumps',
    'gas-station': 'circular-array',
    'hand-of-straights': 'grouping',
    'merge-triplets-to-form-target-triplet': 'triplets',
    'partition-labels': 'intervals',
    'valid-parenthesis-string': 'string-validation',
  },
  'intervals': {
    'insert-interval': 'basics',
    'merge-intervals': 'basics',
    'non-overlapping-intervals': 'scheduling',
    'meeting-rooms': 'scheduling',
    'meeting-rooms-ii': 'scheduling',
    'minimum-interval-to-include-each-query': 'advanced',
  },
  'tries': {
    'implement-trie-prefix-tree': 'basics',
    'design-add-and-search-words-data-structure': 'wildcard-search',
    'word-search-ii': 'grid-search',
  },
  'bit-manipulation': {
    'single-number': 'xor-tricks',
    'number-of-1-bits': 'counting',
    'counting-bits': 'counting',
    'reverse-bits': 'bit-operations',
    'missing-number': 'xor-tricks',
    'sum-of-two-integers': 'arithmetic',
    'reverse-integer': 'arithmetic',
  },
  'hashing': {
    'contains-duplicate': 'basics',
    'valid-anagram': 'basics',
    'two-sum': 'lookup',
    'group-anagrams': 'grouping',
    'top-k-frequent-elements': 'frequency',
    'product-of-array-except-self': 'prefix-suffix',
    'encode-and-decode-strings': 'serialization',
    'valid-sudoku': 'validation',
    'longest-consecutive-sequence': 'sequence',
  },
  'heap': {
    'kth-largest-element-in-an-array': 'kth-element',
    'last-stone-weight': 'simulation',
    'k-closest-points-to-origin': 'kth-element',
    'kth-largest-element-in-a-stream': 'design',
    'task-scheduler': 'scheduling',
    'design-twitter': 'design',
    'find-median-from-data-stream': 'two-heaps',
  },
  'math-geometry': {
    'rotate-image': 'matrix',
    'spiral-matrix': 'matrix',
    'set-matrix-zeroes': 'matrix',
    'happy-number': 'number-theory',
    'plus-one': 'arithmetic',
    'pow-x-n': 'exponentiation',
    'powx-n': 'exponentiation',
    'multiply-strings': 'arithmetic',
    'detect-squares': 'geometry',
  },
};

for (const file of patternFiles) {
  const pattern = JSON.parse(readFileSync(file, 'utf-8'));
  const rules = INFERENCE_RULES[pattern.id] || {};
  let changed = false;

  for (const p of pattern.problems || []) {
    // Apply inference rules
    if (rules[p.id]) {
      p.subcategory = rules[p.id];
      changed = true;
    } else if (!p.subcategory || p.subcategory === 'basic') {
      // Default uncategorized for problems without subcategory
      p.subcategory = 'uncategorized';
      changed = true;
    }
  }

  if (changed) {
    writeFileSync(file, JSON.stringify(pattern, null, 2) + '\n');
    console.log(`✓ ${pattern.name}`);
  }
}

console.log('\n✓ Fixed subcategories\n');
console.log('Run: bun tools/validate-subcategories.mjs to check violations');
