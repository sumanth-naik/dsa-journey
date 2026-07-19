#!/usr/bin/env node
// mark-important.mjs — Mark ~150 core interview problems as important

import { readFileSync, writeFileSync } from 'fs';
import { execFileSync } from 'child_process';

// Core NeetCode 150-like problems (must-know for interviews)
const IMPORTANT_PROBLEMS = [
  // Two Pointers
  'valid-palindrome', 'two-sum-ii', 'three-sum', 'container-with-most-water', 'trapping-rain-water',

  // Hashing
  'two-sum', 'group-anagrams', 'top-k-frequent-elements', 'product-of-array-except-self', 'valid-sudoku',
  'longest-consecutive-sequence',

  // Sliding Window
  'best-time-to-buy-and-sell-stock', 'longest-substring-without-repeating-characters',
  'longest-repeating-character-replacement', 'permutation-in-string', 'minimum-window-substring',

  // Stack
  'valid-parentheses', 'min-stack', 'evaluate-reverse-polish-notation', 'generate-parentheses',
  'daily-temperatures', 'car-fleet', 'largest-rectangle-in-histogram',

  // Binary Search
  'binary-search', 'search-a-2d-matrix', 'koko-eating-bananas', 'find-minimum-in-rotated-sorted-array',
  'search-in-rotated-sorted-array', 'time-based-key-value-store', 'median-of-two-sorted-arrays',

  // Linked List
  'reverse-linked-list', 'merge-two-sorted-lists', 'reorder-list', 'remove-nth-node-from-end-of-list',
  'copy-list-with-random-pointer', 'add-two-numbers', 'linked-list-cycle', 'find-the-duplicate-number',
  'lru-cache', 'merge-k-sorted-lists',

  // Trees
  'invert-binary-tree', 'maximum-depth-of-binary-tree', 'diameter-of-binary-tree', 'balanced-binary-tree',
  'same-tree', 'subtree-of-another-tree', 'lowest-common-ancestor-of-a-binary-search-tree',
  'binary-tree-level-order-traversal', 'binary-tree-right-side-view', 'count-good-nodes-in-binary-tree',
  'validate-binary-search-tree', 'kth-smallest-element-in-a-bst', 'construct-binary-tree-from-preorder-and-inorder-traversal',
  'binary-tree-maximum-path-sum', 'serialize-and-deserialize-binary-tree',

  // Tries
  'implement-trie-prefix-tree', 'design-add-and-search-words-data-structure', 'word-search-ii',

  // Heap
  'kth-largest-element-in-an-array', 'last-stone-weight', 'k-closest-points-to-origin',
  'kth-largest-element-in-a-stream', 'task-scheduler', 'design-twitter', 'find-median-from-data-stream',

  // Backtracking
  'subsets', 'combination-sum', 'permutations', 'subsets-ii', 'combination-sum-ii', 'word-search',
  'palindrome-partitioning', 'letter-combinations-of-a-phone-number', 'n-queens',

  // Graphs
  'number-of-islands', 'clone-graph', 'max-area-of-island', 'pacific-atlantic-water-flow',
  'surrounded-regions', 'rotting-oranges', 'walls-and-gates', 'course-schedule', 'course-schedule-ii',
  'redundant-connection', 'number-of-connected-components-in-an-undirected-graph', 'graph-valid-tree',
  'word-ladder',

  // Advanced Graphs
  'reconstruct-itinerary', 'min-cost-to-connect-all-points', 'network-delay-time',
  'swim-in-rising-water', 'alien-dictionary', 'cheapest-flights-within-k-stops',

  // 1-D DP
  'climbing-stairs', 'min-cost-climbing-stairs', 'house-robber', 'house-robber-ii',
  'longest-palindromic-substring', 'palindromic-substrings', 'decode-ways', 'coin-change',
  'maximum-product-subarray', 'word-break', 'longest-increasing-subsequence', 'partition-equal-subset-sum',

  // 2-D DP
  'unique-paths', 'longest-common-subsequence', 'best-time-to-buy-and-sell-stock-with-cooldown',
  'coin-change-2', 'target-sum', 'interleaving-string', 'longest-increasing-path-in-a-matrix',
  'distinct-subsequences', 'edit-distance', 'burst-balloons', 'regular-expression-matching',

  // Greedy
  'maximum-subarray', 'jump-game', 'jump-game-ii', 'gas-station', 'hand-of-straights',
  'merge-triplets-to-form-target-triplet', 'partition-labels', 'valid-parenthesis-string',

  // Intervals
  'insert-interval', 'merge-intervals', 'non-overlapping-intervals', 'meeting-rooms',
  'meeting-rooms-ii', 'minimum-interval-to-include-each-query',

  // Math & Geometry
  'rotate-image', 'spiral-matrix', 'set-matrix-zeroes', 'happy-number', 'plus-one',
  'pow-x-n', 'multiply-strings', 'detect-squares',

  // Bit Manipulation
  'single-number', 'number-of-1-bits', 'counting-bits', 'reverse-bits', 'missing-number',
  'sum-of-two-integers', 'reverse-integer',
];

const patternFiles = execFileSync('find', ['data/patterns', '-name', '*.json', '-not', '-name', '_template.json'],
  { encoding: 'utf-8' }).trim().split('\n');

let marked = 0;
let total = 0;

for (const file of patternFiles) {
  const pattern = JSON.parse(readFileSync(file, 'utf-8'));
  let changed = false;

  for (const p of pattern.problems || []) {
    total++;
    if (IMPORTANT_PROBLEMS.includes(p.id)) {
      p.important = true;
      marked++;
      changed = true;
    } else if (p.important !== undefined) {
      // Remove important flag if not in list
      delete p.important;
      changed = true;
    }
  }

  if (changed) {
    writeFileSync(file, JSON.stringify(pattern, null, 2) + '\n');
    console.log(`✓ ${file}`);
  }
}

console.log(`\n✓ Marked ${marked}/${total} problems as important`);
console.log(`\nRun: bun tools/build-data.mjs`);
