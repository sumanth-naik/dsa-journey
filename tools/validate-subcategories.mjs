#!/usr/bin/env node
// validate-subcategories.mjs — Enforce max 5 problems per subcategory

import { readFileSync } from 'fs';
import { execFileSync } from 'child_process';

const MAX_PROBLEMS_PER_SUBCATEGORY = 5;
const MAX_EXTRAS_PER_PATTERN = 10;

const patternFiles = execFileSync('find', ['data/patterns', '-name', '*.json', '-not', '-name', '_template.json'],
  { encoding: 'utf-8' }).trim().split('\n');

let violations = [];

for (const file of patternFiles) {
  const pattern = JSON.parse(readFileSync(file, 'utf-8'));

  // Group ALL problems by subcategory (not just important)
  const bySubcategory = {};
  for (const p of pattern.problems || []) {
    const sub = p.subcategory || 'uncategorized';
    if (!bySubcategory[sub]) bySubcategory[sub] = [];
    bySubcategory[sub].push(p.id);
  }

  // Check violations
  for (const [sub, problems] of Object.entries(bySubcategory)) {
    const limit = sub === 'extras' ? MAX_EXTRAS_PER_PATTERN : MAX_PROBLEMS_PER_SUBCATEGORY;
    if (problems.length > limit) {
      violations.push({
        pattern: pattern.name,
        subcategory: sub,
        count: problems.length,
        file,
        problems: problems.slice(0, 10) // Show first 10 for debugging
      });
    }
  }
}

if (violations.length > 0) {
  console.error(`\n❌ SUBCATEGORY SIZE VIOLATIONS (max ${MAX_PROBLEMS_PER_SUBCATEGORY} per subcategory):\n`);
  for (const v of violations) {
    console.error(`  ${v.pattern} → ${v.subcategory}: ${v.count} problems`);
    console.error(`    File: ${v.file}\n`);
  }
  console.error(`\nℹ️  Quality over quantity: If a subcategory has > ${MAX_PROBLEMS_PER_SUBCATEGORY} problems,`);
  console.error(`   either create more specific subcategories or curate down to the best problems.\n`);
  process.exit(1);
}

console.log('✓ All subcategories have ≤ 5 problems');
