#!/usr/bin/env node
// redistribute-phases.mjs — Reorganize problems into breadth-first phases

import { readFileSync, writeFileSync } from 'fs';
import { execFileSync } from 'child_process';

// Load all pattern files
const patternFiles = execFileSync('find', ['data/patterns', '-name', '*.json', '-not', '-name', '_template.json'],
  { encoding: 'utf-8' }).trim().split('\n');

const patterns = patternFiles.map(file => ({
  file,
  data: JSON.parse(readFileSync(file, 'utf-8'))
}));

console.log(`Found ${patterns.length} pattern files\n`);

// Difficulty ordering
const diffOrder = { 'Easy': 0, 'Medium': 1, 'Hard': 2 };

// Sort problems within each pattern by difficulty
for (const p of patterns) {
  p.data.problems.sort((a, b) =>
    (diffOrder[a.difficulty] || 1) - (diffOrder[b.difficulty] || 1)
  );
}

// Redistribute phases in rounds (breadth-first)
// Phase 1: First 3 problems from each pattern
// Phase 2: Next 4 problems from each pattern
// Phase 3: Next 5 problems from each pattern
// Phase 4+: Remaining problems distributed evenly

const PHASE_SIZES = [3, 4, 5, 6, 8]; // Problems per pattern per phase
const MAX_PHASES = 8;

for (const p of patterns) {
  let idx = 0;

  for (let phase = 1; phase <= MAX_PHASES && idx < p.data.problems.length; phase++) {
    const batchSize = PHASE_SIZES[Math.min(phase - 1, PHASE_SIZES.length - 1)];
    const batch = p.data.problems.slice(idx, idx + batchSize);

    batch.forEach(prob => {
      prob.phaseId = phase;
    });

    idx += batchSize;
  }

  console.log(`${p.data.name}: ${p.data.problems.length} problems across ${Math.max(...p.data.problems.map(pr => pr.phaseId))} phases`);
}

// Save updated patterns
console.log('\nSaving updated patterns...');
for (const p of patterns) {
  writeFileSync(p.file, JSON.stringify(p.data, null, 2) + '\n');
  console.log(`  ✓ ${p.file}`);
}

console.log('\n✓ Done! Run: bun tools/build-data.mjs');
