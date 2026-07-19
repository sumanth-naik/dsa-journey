#!/usr/bin/env node
// categorize-all-problems.mjs — Assign subcategories to ALL problems based on repo folders

import { readFileSync, writeFileSync } from 'fs';
import { execFileSync } from 'child_process';

// Load the repo mapping which has folder → subcategory mappings
const repoMapping = JSON.parse(readFileSync('tools/repo-pattern-mapping.json', 'utf-8'));

// Build reverse index: problem title → subcategory from repo
const titleToSubcategory = {};

console.log('Fetching problem titles from repo...\n');

// Fetch all Python files with their folder paths
const treeJson = execFileSync('gh', [
  'api',
  'repos/sumanth-naik/Striver-191/git/trees/HEAD?recursive=1',
  '--jq',
  '.tree[] | select(.type=="blob" and (.path | endswith(".py"))) | {path}'
], { encoding: 'utf-8' });

const files = treeJson.trim().split('\n').filter(Boolean).map(line => JSON.parse(line));

for (const file of files) {
  const parts = file.path.split('/');
  if (parts.length < 2) continue;

  const folder = parts[0];
  const filename = parts[parts.length - 1].replace('.py', '');

  // Skip ignored folders
  if (repoMapping.skip.includes(folder)) continue;

  // Get subcategory from mapping
  const mapping = repoMapping.mappings[folder];
  if (!mapping || !mapping.subcategory) continue;

  // Normalize filename to match problem IDs
  const problemId = filename
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');

  titleToSubcategory[problemId] = mapping.subcategory;
}

console.log(`Mapped ${Object.keys(titleToSubcategory).length} problems from repo\n`);

// Now update all pattern files
const patternFiles = execFileSync('find', ['data/patterns', '-name', '*.json', '-not', '-name', '_template.json'],
  { encoding: 'utf-8' }).trim().split('\n');

let categorized = 0;
let alreadyCategorized = 0;
let unchanged = 0;

for (const file of patternFiles) {
  const pattern = JSON.parse(readFileSync(file, 'utf-8'));
  let changed = false;

  for (const p of pattern.problems || []) {
    // Skip if already has a good subcategory (not uncategorized/null/basic)
    if (p.subcategory && p.subcategory !== 'uncategorized' && p.subcategory !== 'basic') {
      alreadyCategorized++;
      continue;
    }

    // Try to find in repo mapping
    if (titleToSubcategory[p.id]) {
      p.subcategory = titleToSubcategory[p.id];
      categorized++;
      changed = true;
    } else if (!p.subcategory || p.subcategory === null) {
      // Default to 'basics' instead of leaving null
      p.subcategory = 'basics';
      changed = true;
    } else {
      unchanged++;
    }
  }

  if (changed) {
    writeFileSync(file, JSON.stringify(pattern, null, 2) + '\n');
    console.log(`✓ ${pattern.name}`);
  }
}

console.log(`\n✓ Categorized ${categorized} problems from repo mapping`);
console.log(`  Already had categories: ${alreadyCategorized}`);
console.log(`  Defaulted to 'basics': ${unchanged}`);
console.log('\nRun: bun tools/build-data.mjs');
