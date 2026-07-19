#!/usr/bin/env node
// check-premium-problems.mjs — Quick check for known premium problems

import { readFileSync } from 'fs';
import { execFileSync } from 'child_process';

// Known LeetCode Premium problems
const KNOWN_PREMIUM = [
  'encode-and-decode-strings',
  'alien-dictionary',
  'graph-valid-tree',
  'number-of-connected-components-in-an-undirected-graph',
  'walls-and-gates',
  'meeting-rooms',
  'meeting-rooms-ii',
  'design-phone-directory',
  'inorder-successor-in-bst',
  'count-univalue-subtrees',
  'closest-binary-search-tree-value',
  'binary-tree-longest-consecutive-sequence',
  'paint-house',
  'paint-house-ii',
  'paint-fence'
];

const patternFiles = execFileSync('find', ['data/patterns', '-name', '*.json', '-not', '-name', '_template.json'],
  { encoding: 'utf-8' }).trim().split('\n');

const premiumProblems = [];
const importantPremiumProblems = [];

for (const file of patternFiles) {
  const pattern = JSON.parse(readFileSync(file, 'utf-8'));
  for (const p of pattern.problems || []) {
    if (KNOWN_PREMIUM.includes(p.id) || KNOWN_PREMIUM.includes(p.leetcodeSlug)) {
      premiumProblems.push({
        id: p.id,
        title: p.title,
        pattern: pattern.name,
        important: p.important || false
      });

      if (p.important) {
        importantPremiumProblems.push({
          id: p.id,
          title: p.title,
          pattern: pattern.name
        });
      }
    }
  }
}

console.log('='.repeat(60));
console.log('PREMIUM PROBLEMS CHECK');
console.log('='.repeat(60));
console.log(`Total premium problems: ${premiumProblems.length}`);
console.log(`Premium marked as important: ${importantPremiumProblems.length}`);

if (premiumProblems.length > 0) {
  console.log('\nAll premium problems:');
  for (const p of premiumProblems) {
    const star = p.important ? ' ⭐ IMPORTANT' : '';
    console.log(`  ${p.pattern} → ${p.title}${star}`);
  }
}

if (importantPremiumProblems.length > 0) {
  console.log('\n' + '='.repeat(60));
  console.log('❌ ERROR: Important problems are premium!');
  console.log('='.repeat(60));
  console.log('These problems are marked as important but require LeetCode Premium:');
  for (const p of importantPremiumProblems) {
    console.log(`  - ${p.title} (${p.id})`);
    console.log(`    Pattern: ${p.pattern}`);
  }
  console.log('\nFix: Remove "important" flag or replace with free alternatives.');
  process.exit(1);
}

console.log('\n✅ No important problems are premium');
