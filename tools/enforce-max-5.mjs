#!/usr/bin/env node
// enforce-max-5.mjs — Subdivide every category with >5 problems

import { readFileSync, writeFileSync } from 'fs';
import { execFileSync } from 'child_process';

const SUBDIVISIONS = {
  // Graphs: union-find (16) → connection-checking, mst, advanced
  'graphs': {
    'union-find': {
      'redundant-connection': 'union-find-cycle',
      'graph-valid-tree': 'union-find-cycle',
      'number-of-connected-components-in-an-undirected-graph': 'union-find-components',
      'accounts-merge': 'union-find-components',
      'smallest-string-with-swaps': 'union-find-components',
      'satisfiability-of-equality-equations': 'union-find-components',
      'regions-cut-by-slashes': 'union-find-grid',
      'number-of-operations-to-make-network-connected': 'union-find-components',
      'minimize-malware-spread': 'union-find-components',
      'minimize-malware-spread2': 'union-find-components',
      'checking-existence-of-edge-length-limited-paths': 'union-find-advanced',
      'count-unreachable-pairs-of-nodes-in-an-undirected-graph': 'union-find-components',
      'number-of-good-paths': 'union-find-advanced',
      'couples-holding-hands': 'union-find-advanced',
      'swim-in-rising-water': 'union-find-advanced',
      'find-critical-and-pseudo-critical-edgesin-m-s-t': 'union-find-mst',
    },
    'grid-bfs': {
      'rotting-oranges': 'multi-source-bfs',
      'walls-and-gates': 'multi-source-bfs',
      '01-matrix': 'multi-source-bfs',
      'as-far-from-land-as-possible': 'multi-source-bfs',
      'shortest-path-in-binary-matrix': 'shortest-path-bfs',
      'shortest-path-to-get-all-keys': 'shortest-path-bfs',
      'shortest-bridge': 'multi-source-bfs',
      'minimum-knight-moves': 'shortest-path-bfs',
      'shortest-path-in-grid-with-obstacles': 'shortest-path-bfs',
    },
  },

  // Stack: monotonic (12) → next-greater, histogram, other
  'stack': {
    'monotonic': {
      'daily-temperatures': 'next-greater',
      'next-greater-element': 'next-greater',
      'next-greater-element-ii': 'next-greater',
      'online-stock-spanner': 'next-greater',
      'stock-spanner': 'next-greater',
      'largest-rectangle-in-histogram': 'histogram',
      'maximal-rectangle': 'histogram',
      '132-pattern': 'pattern-matching',
      'car-fleet': 'simulation',
      'sliding-window-maximum': 'deque',
      'remove-duplicate-letters': 'greedy-stack',
      'minimum-number-of-incrementson-subarraysto-form-a-target-array': 'advanced',
    },
  },

  // Trees: basics (21) → traversal, properties, simple-ops
  'trees': {
    'basics': {
      'invert-binary-tree': 'simple-ops',
      'same-tree': 'simple-ops',
      'maximum-depth-of-binary-tree': 'properties',
      'minimum-depth-of-binary-tree': 'properties',
      'balanced-binary-tree': 'properties',
      'symmetric-tree': 'properties',
      'subtree-of-another-tree': 'matching',
      'merge-two-binary-trees': 'simple-ops',
      'path-sum': 'path-problems',
      'sum-of-left-leaves': 'properties',
      'leaf-similar-trees': 'properties',
      'univalued-binary-tree': 'properties',
      'range-sum-of-b-s-t': 'bst-basics',
      'search-in-a-binary-search-tree': 'bst-basics',
      'insert-into-a-binary-search-tree': 'bst-basics',
      'delete-node-in-a-b-s-t': 'bst-basics',
      'trim-a-binary-search-tree': 'bst-basics',
      'convert-sorted-array-to-binary-search-tree': 'bst-construction',
      'flatten-binary-tree-to-linked-list': 'transformation',
      'populating-next-right-pointers': 'transformation',
      'sum-root-to-leaf-numbers': 'path-problems',
    },
  },

  // Two Pointers: basics (19) → pair-finding, array-manipulation, partitioning
  'two-pointers': {
    'basics': {
      'valid-palindrome': 'palindrome-check',
      'two-sum-ii': 'pair-finding',
      'container-with-most-water': 'optimization',
      'move-zeroes': 'in-place-ops',
      'remove-element': 'in-place-ops',
      'remove-duplicates-from-sorted-array': 'in-place-ops',
      'sort-colors': 'partitioning',
      'boats-to-save-people': 'pair-finding',
      'reverse-string': 'palindrome-check',
      'reverse-vowels-of-a-string': 'palindrome-check',
      'is-subsequence': 'matching',
      'merge-sorted-array': 'merging',
      'squares-of-a-sorted-array': 'merging',
      'intersection-of-two-arrays': 'set-ops',
      'intersection-of-two-arrays-ii': 'set-ops',
      'longest-mountain-in-array': 'subarray',
      'find-k-closest-elements': 'selection',
      'backspace-string-compare': 'matching',
      'partition-labels': 'partitioning',
    },
  },

  // Linked List: basics (18) → traversal, simple-ops, two-pointer
  'linked-list': {
    'basics': {
      'reverse-linked-list': 'reversal-simple',
      'merge-two-sorted-lists': 'merging',
      'remove-nth-node-from-end-of-list': 'two-pointer',
      'middle-of-the-linked-list': 'two-pointer',
      'palindrome-linked-list': 'two-pointer',
      'delete-node-in-a-linked-list': 'simple-ops',
      'remove-linked-list-elements': 'simple-ops',
      'reverse-linked-list-ii': 'reversal-partial',
      'remove-duplicates-from-sorted-list': 'simple-ops',
      'remove-duplicates-from-sorted-list-ii': 'simple-ops',
      'partition-list': 'partitioning',
      'odd-even-linked-list': 'partitioning',
      'split-linked-list-in-parts': 'partitioning',
      'design-linked-list': 'design',
      'flatten-a-multilevel-doubly-linked-list': 'advanced',
      'insertion-sort-list': 'sorting',
      'sort-list': 'sorting',
      'intersection-of-two-linked-lists': 'two-pointer',
    },
  },

  // Sliding Window: basics (8) → fixed vs variable
  'sliding-window': {
    'basics': {
      'max-consecutive-ones-iii': 'variable-window',
      'best-time-to-buy-and-sell-stock': 'single-pass',
      'longest-continuous-subarray-absolute-diff': 'variable-window',
      'grumpy-bookstore-owner': 'fixed-window',
      'defuse-the-bomb': 'fixed-window',
      'get-equal-substrings-within-budget': 'variable-window',
      'max-consecutive-ones': 'single-pass',
      'k-radius-subarray-averages': 'fixed-window',
    },
  },

  // Greedy: basics (10) → scheduling, intervals, optimization
  'greedy': {
    'basics': {
      'find-min-arrow-shots': 'interval-overlap',
      'interval-list-intersections': 'interval-merge',
      'frog-jump2': 'optimization',
      'ipo': 'selection',
      'jump-game2': 'array-jumps',
      'max-num-of-meetings': 'scheduling',
      'max-profit-in-unit-time-jobs': 'scheduling',
      'maximum-ice-cream-bars': 'selection',
      'queue-reconstruction-from-height': 'reconstruction',
      'reducing-dishes': 'optimization',
    },
  },

  // 1D DP subdivisions for large categories
  'one-d-dp': {
    'grid-dp': {
      'unique-paths1': 'grid-paths',
      'unique-paths-with-obstacles': 'grid-paths',
      'minimum-path-cost-in-a-grid': 'grid-paths',
      'minimum-path-sum-in-a-matrix': 'grid-paths',
      'cherry-pickup': 'grid-collection',
      'cherry-pickup2': 'grid-collection',
      'number-of-increasing-paths-in-a-grid': 'grid-paths',
      'count-square-sub-matrices-with-all-ones': 'grid-counting',
      'count-fertile-pyramids-in-a-land': 'grid-counting',
      'paths-in-matrix': 'grid-paths',
    },
    'counting': {
      'count-vowels-permutation': 'sequence-counting',
      'count-number-of-teams': 'sequence-counting',
      'number-of-music-playlists': 'sequence-counting',
      'number-of-ways-of-cutting-a-pizza': 'partition-counting',
      'number-of-ways-to-form-a-target-string-given-a-dictionary': 'string-counting',
      'number-of-ways-to-print-nx3-grid': 'pattern-counting',
      'number-of-ways-to-separate-numbers': 'partition-counting',
    },
    'string-dp': {
      'word-break2': 'word-break',
      'min-delete-operations-for-two-strings': 'edit-distance',
      'minimum-insertions-steps-to-make-a-string-palindrome': 'palindrome-ops',
      'number-of-ways-to-form-a-target-string-given-a-dictionary': 'string-matching',
      'generate-paranthesis': 'generation',
      'different-ways-to-add-paranthesis': 'expression',
      'concatenated-words': 'word-break',
    },
    'optimization': {
      'best-team-with-no-conflicts': 'selection',
      'build-array-where-you-can-find-the-maximum-exactly-k-comparisons': 'construction',
      'maximum-height-by-stacking-cuboids': 'stacking',
      'maximum-score-words-formed-by-letters': 'selection',
      'partition-array-for-maximum-sum': 'partitioning',
      'tallest-billboard': 'balancing',
      'selling-pieces-of-wood': 'cutting',
    },
  },
};

const patternFiles = execFileSync('find', ['data/patterns', '-name', '*.json', '-not', '-name', '_template.json'],
  { encoding: 'utf-8' }).trim().split('\n');

for (const file of patternFiles) {
  const pattern = JSON.parse(readFileSync(file, 'utf-8'));
  const patternRules = SUBDIVISIONS[pattern.id] || {};
  let changed = false;

  for (const p of pattern.problems || []) {
    const subcatRules = patternRules[p.subcategory];
    if (subcatRules && subcatRules[p.id]) {
      p.subcategory = subcatRules[p.id];
      changed = true;
    }
  }

  if (changed) {
    writeFileSync(file, JSON.stringify(pattern, null, 2) + '\n');
    console.log(`✓ ${pattern.name}`);
  }
}

console.log('\n✓ Enforced max 5 per subcategory');
console.log('Run: bun tools/validate-subcategories.mjs');
