#!/usr/bin/env node
// import-from-repo.mjs — Import problems from Striver-191 repo

import { readFileSync, writeFileSync } from 'fs';
import { execFileSync } from 'child_process';

const REPO = 'sumanth-naik/Striver-191';

// Fetch all Python files from repo
console.log('Fetching file tree from GitHub...');
const treeJson = execFileSync('gh', [
  'api',
  'repos/sumanth-naik/Striver-191/git/trees/HEAD?recursive=1',
  '--jq',
  '.tree[] | select(.type=="blob" and (.path | endswith(".py"))) | {path, size}'
], { encoding: 'utf-8' });

const files = treeJson.trim().split('\n').filter(Boolean).map(line => JSON.parse(line));

console.log(`Found ${files.length} Python files\n`);

// Group by folder (pattern)
const byFolder = {};
files.forEach(f => {
  const parts = f.path.split('/');
  if (parts.length < 2) return; // skip root files
  const folder = parts[0];
  if (!byFolder[folder]) byFolder[folder] = [];
  byFolder[folder].push(f);
});

// Skip implementation/utility folders
const SKIP_FOLDERS = [
  'Trie - Implementations',
  'Union Find - Implementations',
  'New Data Structures Implementation',
  'Design new Data Structures',
  'Doubly Linked List',
  'Easy OR Repeated Patterns - ignore',
  'incomplete',
  'They dont want to hire you',
  'Resume',
  'Puzzling Ideas',
  'CandyCrush'
];

const folders = Object.keys(byFolder)
  .filter(f => !SKIP_FOLDERS.includes(f))
  .sort();

console.log(`Patterns found: ${folders.length}`);
console.log(folders.slice(0, 20).join(', '), '...\n');

// Map folder names to pattern IDs
const PATTERN_MAP = {
  'Two Pointer': 'two-pointers',
  'Sliding Window': 'sliding-window',
  'Binary Search': 'binary-search',
  'Back Tracking': 'backtracking',
  'Graphs - BFS': 'graphs',
  'Graphs - DFS': 'graphs',
  'Graphs - BFS In Grid': 'graphs',
  'Graphs - Djikstras': 'graphs',
  'Graphs - Topological Sort': 'graphs',
  'Union Find': 'graphs',
  'Trees': 'trees',
  'Binary Search Trees': 'trees',
  'Heaps': 'heap',
  'HashMaps': 'hashing',
  'Stacks - Parantheses': 'stack',
  'Monotonic Stacks': 'stack',
  'DP on Grids': 'two-d-dp',
  'DP - Coin Change': 'one-d-dp',
  'DP - Take or Not Take': 'one-d-dp',
  'DP - LIS': 'one-d-dp',
  'Intervals': 'intervals',
  'Greedy': 'greedy',
  'Tries': 'tries',
  'Bit Manipulation': 'bit-manipulation',
  'Linked List': 'linked-list',
  'Math': 'math-and-geometry'
};

// Load existing patterns
const patternFiles = execFileSync('ls', ['data/patterns/*.json'], { shell: true, encoding: 'utf-8' })
  .trim().split('\n');
const existingPatterns = {};
patternFiles.forEach(file => {
  const content = JSON.parse(readFileSync(file, 'utf-8'));
  existingPatterns[content.id] = { file, data: content };
});

console.log(`Existing pattern files: ${Object.keys(existingPatterns).length}\n`);

// For each folder, find or create pattern
let added = 0;
let skipped = 0;

for (const folder of folders.slice(0, 5)) { // Start with first 5 for testing
  console.log(`\n=== ${folder} (${byFolder[folder].length} files) ===`);

  const patternId = PATTERN_MAP[folder] || folder.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  if (!existingPatterns[patternId]) {
    console.log(`  ⚠ Pattern "${patternId}" not found, skipping folder for now`);
    skipped += byFolder[folder].length;
    continue;
  }

  const pattern = existingPatterns[patternId].data;
  const existingTitles = new Set(pattern.problems.map(p => p.title.toLowerCase()));

  for (const file of byFolder[folder].slice(0, 3)) { // Test with 3 files per folder
    const filename = file.path.split('/').pop().replace('.py', '');
    const title = filename
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .replace(/\s+/g, ' ');

    if (existingTitles.has(title.toLowerCase())) {
      console.log(`  • ${title}: already exists`);
      skipped++;
      continue;
    }

    console.log(`  • ${title}: fetching code...`);

    try {
      // Fetch file content
      const content = execFileSync('gh', [
        'api',
        `repos/${REPO}/contents/${file.path}`,
        '--jq',
        '.content'
      ], { encoding: 'utf-8' });

      const decoded = Buffer.from(content.trim(), 'base64').toString('utf-8');

      // Extract key ideas from comments (first 3 lines starting with #)
      const lines = decoded.split('\n');
      const comments = lines.filter(l => l.trim().startsWith('#')).slice(0, 3);
      const keyIdeas = comments.map(c => c.replace(/^#\s*/, '')).join(' ').trim() ||
                       'TODO: Add key ideas';

      // Create problem stub
      const problemId = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const newProblem = {
        id: problemId,
        title,
        difficulty: 'Medium', // TODO: fetch from LeetCode
        patternId,
        leetcodeSlug: problemId,
        tags: [],
        video: { title: '', url: '', lang: 'python' },
        keyIdeas,
        hints: ['TODO: Add hints'],
        solutions: [{
          label: 'Optimal',
          keyIdea: keyIdeas,
          code: decoded,
          timeComplexity: 'O(?)',
          spaceComplexity: 'O(?)'
        }]
      };

      pattern.problems.push(newProblem);
      added++;
      console.log(`    ✓ Added`);

    } catch (err) {
      console.error(`    ✗ Error: ${err.message}`);
      skipped++;
    }
  }

  // Save updated pattern
  writeFileSync(
    existingPatterns[patternId].file,
    JSON.stringify(pattern, null, 2) + '\n'
  );
  console.log(`  ✓ Saved ${existingPatterns[patternId].file}`);
}

console.log(`\n✓ Done! Added ${added} problems, skipped ${skipped}`);
console.log(`Run 'bun tools/add-descriptions.mjs' to fetch descriptions from LeetCode`);
console.log(`Run 'bun tools/build-data.mjs' to regenerate manifest`);
