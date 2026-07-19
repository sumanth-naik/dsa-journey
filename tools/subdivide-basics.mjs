#!/usr/bin/env node
// subdivide-basics.mjs — Break down large "basics" subcategories into smaller ones

import { readFileSync, writeFileSync } from 'fs';
import { execFileSync } from 'child_process';

const SUBDIVISIONS = {
  'one-d-dp': {
    // Stock problems
    'stock-buy-and-sell-d-p': 'stock-trading',
    'best-time-to-buy-and-sell-stock-with-transaction-fee': 'stock-trading',

    // Grid-based DP
    'cherry-pickup': 'grid-dp',
    'cherry-pickup2': 'grid-dp',
    'count-fertile-pyramids-in-a-land': 'grid-dp',
    'count-square-sub-matrices-with-all-ones': 'grid-dp',
    'minimum-path-cost-in-a-grid': 'grid-dp',
    'minimum-path-sum-in-a-matrix': 'grid-dp',
    'number-of-increasing-paths-in-a-grid': 'grid-dp',
    'unique-paths1': 'grid-dp',
    'unique-paths-with-obstacles': 'grid-dp',

    // Path/falling problems
    'min-falling-path-sum': 'paths',
    'min-falling-path-sum2': 'paths',

    // Counting/enumeration
    'count-number-of-teams': 'counting',
    'count-vowels-permutation': 'counting',
    'different-ways-to-add-paranthesis': 'enumeration',
    'number-of-music-playlists': 'counting',
    'number-of-ways-of-cutting-a-pizza': 'counting',
    'number-of-ways-to-form-a-target-string-given-a-dictionary': 'counting',
    'number-of-ways-to-print-nx3-grid': 'counting',
    'number-of-ways-to-separate-numbers': 'counting',

    // String DP
    'min-delete-operations-for-two-strings': 'string-dp',
    'minimum-insertions-steps-to-make-a-string-palindrome': 'string-dp',
    'wildcard-matching': 'string-matching',
    'word-break2': 'string-dp',
    'generate-paranthesis': 'string-generation',

    // Game theory / optimization
    'best-team-with-no-conflicts': 'optimization',
    'build-array-where-you-can-find-the-maximum-exactly-k-comparisons': 'optimization',
    'knight-probability-in-chess-board': 'probability',
    'maximum-height-by-stacking-cuboids': 'optimization',
    'maximum-score-words-formed-by-letters': 'optimization',
    'partition-array-for-maximum-sum': 'optimization',
    'tallest-billboard': 'optimization',
    'restore-the-array': 'reconstruction',
    'selling-pieces-of-wood': 'optimization',

    // Sequences
    'perfect-squares': 'sequences',
    'ugly-number2': 'sequences',
    'unique-binary-search-trees': 'sequences',
    'minimum-cost-for-tickets': 'sequences',
    'minimum-cost-tree-from-leaf-values': 'tree-dp',

    // Games
    'stone-game3': 'game-theory',
    'stone-game5': 'game-theory',

    // Misc
    'sort-integers-by-the-power-values': 'simulation',

    // Keep only true basics
    'climbing-stairs': 'basics',
    'min-cost-climbing-stairs': 'basics',
  },

  'trees': {
    // Traversal
    'binary-tree-level-order-traversal': 'traversal',
    'binary-tree-right-side-view': 'traversal',
    'binary-tree-zigzag-level-order-traversal': 'traversal',

    // Construction
    'construct-binary-tree-from-preorder-and-inorder-traversal': 'construction',
    'construct-binary-tree-from-inorder-and-postorder-traversal': 'construction',

    // Serialization
    'serialize-and-deserialize-binary-tree': 'serialization',

    // Path problems
    'binary-tree-maximum-path-sum': 'path-sum',
    'path-sum': 'path-sum',
    'sum-root-to-leaf-numbers': 'path-sum',

    // Keep only true basics
    'invert-binary-tree': 'basics',
    'maximum-depth-of-binary-tree': 'basics',
    'same-tree': 'basics',
    'balanced-binary-tree': 'basics',
    'subtree-of-another-tree': 'basics',
  },

  'linked-list': {
    // Merging
    'merge-two-sorted-lists': 'basics',
    'merge-k-sorted-lists': 'merge',

    // Manipulation
    'reorder-list': 'manipulation',
    'rotate-list': 'manipulation',
    'swap-nodes-in-pairs': 'manipulation',
    'reverse-nodes-in-k-group': 'manipulation',

    // Two pointer
    'remove-nth-node-from-end-of-list': 'basics',
    'middle-of-the-linked-list': 'basics',

    // Design
    'lru-cache': 'design',
    'lfu-cache': 'design',

    // Other
    'add-two-numbers': 'arithmetic',
    'copy-list-with-random-pointer': 'deep-copy',
  },

  'two-pointers': {
    // Keep only true basics
    'valid-palindrome': 'basics',
    'two-sum-ii': 'basics',
    'container-with-most-water': 'basics',
    'move-zeroes': 'basics',

    // Advanced
    'three-sum': 'triplets',
    '3sum': 'triplets',
    'four-sum': 'quadruplets',
    'trapping-rain-water': 'advanced',
  },

  'sliding-window': {
    'best-time-to-buy-and-sell-stock': 'basics',
    'max-consecutive-ones-iii': 'basics',

    'longest-substring-without-repeating-characters': 'variable-size',
    'longest-substring-without-repeating': 'variable-size',
    'longest-repeating-character-replacement': 'variable-size',
    'minimum-window-substring': 'variable-size',

    'permutation-in-string': 'fixed-size',
    'find-all-anagrams-in-a-string': 'fixed-size',
  },
};

const patternFiles = execFileSync('find', ['data/patterns', '-name', '*.json', '-not', '-name', '_template.json'],
  { encoding: 'utf-8' }).trim().split('\n');

for (const file of patternFiles) {
  const pattern = JSON.parse(readFileSync(file, 'utf-8'));
  const rules = SUBDIVISIONS[pattern.id] || {};
  let changed = false;

  for (const p of pattern.problems || []) {
    if (rules[p.id]) {
      p.subcategory = rules[p.id];
      changed = true;
    }
  }

  if (changed) {
    writeFileSync(file, JSON.stringify(pattern, null, 2) + '\n');
    console.log(`✓ ${pattern.name}`);
  }
}

console.log('\n✓ Subdivided large basics categories');
