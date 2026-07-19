#!/usr/bin/env node
// import-all-problems.mjs — Import all problems from Striver-191 repo with subcategories

import { readFileSync, writeFileSync } from 'fs';
import { execFileSync } from 'child_process';

const REPO = 'sumanth-naik/Striver-191';
const BATCH_SIZE = parseInt(process.argv[2]) || 10; // How many problems to add per run

// Load mapping
const mapping = JSON.parse(readFileSync('tools/repo-pattern-mapping.json', 'utf-8'));

console.log('Fetching file tree from GitHub...');
const treeJson = execFileSync('gh', [
  'api',
  'repos/sumanth-naik/Striver-191/git/trees/HEAD?recursive=1',
  '--jq',
  '.tree[] | select(.type=="blob" and (.path | endswith(".py"))) | {path, size}'
], { encoding: 'utf-8' });

const files = treeJson.trim().split('\n').filter(Boolean).map(line => JSON.parse(line));
console.log(`Found ${files.length} Python files\n`);

// Group by folder
const byFolder = {};
files.forEach(f => {
  const parts = f.path.split('/');
  if (parts.length < 2) return;
  const folder = parts[0];
  if (mapping.skip.includes(folder)) return;
  if (!byFolder[folder]) byFolder[folder] = [];
  byFolder[folder].push(f);
});

const folders = Object.keys(byFolder).sort();
console.log(`Usable folders: ${folders.length}\n`);

// Load existing patterns
const patternFiles = execFileSync('find', ['data/patterns', '-name', '*.json'], { encoding: 'utf-8' })
  .trim().split('\n');
const existingPatterns = {};
patternFiles.forEach(file => {
  const content = JSON.parse(readFileSync(file, 'utf-8'));
  existingPatterns[content.id] = { file, data: content };
});

console.log(`Existing patterns: ${Object.keys(existingPatterns).length}\n`);

let added = 0;
let skipped = 0;
let updated = new Set();

for (const folder of folders) {
  if (added >= BATCH_SIZE) {
    console.log(`\n⏸ Reached batch limit (${BATCH_SIZE}). Run again to continue.`);
    break;
  }

  const mapped = mapping.mappings[folder];
  if (!mapped) {
    console.log(`⚠ No mapping for "${folder}", skipping ${byFolder[folder].length} files`);
    skipped += byFolder[folder].length;
    continue;
  }

  const patternId = mapped.pattern;
  const subcategory = mapped.subcategory;

  if (!existingPatterns[patternId]) {
    console.log(`⚠ Pattern "${patternId}" not found, skipping folder "${folder}"`);
    skipped += byFolder[folder].length;
    continue;
  }

  const pattern = existingPatterns[patternId].data;
  const existingIds = new Set(pattern.problems.map(p => p.id));
  const existingTitles = new Set(pattern.problems.map(p => p.title.toLowerCase()));

  console.log(`\n${folder} → ${patternId}/${subcategory} (${byFolder[folder].length} files)`);

  for (const file of byFolder[folder]) {
    if (added >= BATCH_SIZE) break;

    const filename = file.path.split('/').pop().replace('.py', '');
    const title = filename
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .replace(/\s+/g, ' ');

    const problemId = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    if (existingIds.has(problemId) || existingTitles.has(title.toLowerCase())) {
      skipped++;
      continue;
    }

    console.log(`  + ${title}`);

    try {
      const content = execFileSync('gh', [
        'api',
        `repos/${REPO}/contents/${file.path}`,
        '--jq',
        '.content'
      ], { encoding: 'utf-8' });

      const code = Buffer.from(content.trim(), 'base64').toString('utf-8');

      // Extract key ideas from comments
      const lines = code.split('\n');
      const comments = lines.filter(l => l.trim().startsWith('#')).slice(0, 5);
      const keyIdeas = comments
        .map(c => c.replace(/^#\s*/, ''))
        .join(' ')
        .trim() || 'TODO: Add key ideas';

      // Create problem
      const problemId = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const newProblem = {
        id: problemId,
        title,
        difficulty: 'Medium', // Will be updated by add-descriptions.mjs
        patternId,
        subcategory,
        leetcodeSlug: problemId,
        tags: [],
        video: { title: '', url: '', lang: 'python' },
        keyIdeas,
        hints: ['Consider the constraints', 'Think about the optimal approach'],
        solutions: [{
          label: 'Solution from repo',
          keyIdea: keyIdeas,
          code,
          timeComplexity: 'O(?)',
          spaceComplexity: 'O(?)'
        }]
      };

      pattern.problems.push(newProblem);
      updated.add(patternId);
      added++;

    } catch (err) {
      console.error(`    ✗ Error: ${err.message}`);
      skipped++;
    }
  }
}

// Save updated patterns
console.log(`\nSaving updated patterns...`);
for (const patternId of updated) {
  const { file, data } = existingPatterns[patternId];
  writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
  console.log(`  ✓ ${file}`);
}

console.log(`\n✓ Done!`);
console.log(`  Added: ${added} problems`);
console.log(`  Skipped: ${skipped} (duplicates or errors)`);
console.log(`  Updated: ${updated.size} pattern files`);
console.log(`\nNext steps:`);
console.log(`  1. Run: bun tools/add-descriptions.mjs  (fetch LeetCode descriptions)`);
console.log(`  2. Run: bun tools/build-data.mjs        (regenerate manifest)`);
console.log(`  3. Run this script again to add more problems (batch size: ${BATCH_SIZE})`);
