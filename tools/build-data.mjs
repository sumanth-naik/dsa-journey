#!/usr/bin/env node
// build-data.mjs — LOCAL authoring helper. NOT part of the hosted site.
//
// Does two things:
//   1. Inlines code: if a solution has "codeFile": "<path in a local Striver-191 checkout>"
//      (resolved relative to --repo), its file contents are read into "code".
//   2. Regenerates data/manifest.json's `patterns` list and `problemIndex` from the
//      per-pattern JSON files, so you never hand-maintain the index.
//
// ORDERING (important): patterns render in the order they appear in manifest.patterns, and
// problems render in the order they appear inside each pattern file. To keep the pedagogical
// sequence stable, this script sorts patterns by (phaseId, order, name) using each pattern
// file's numeric `order` field — NOT by filename. Give every pattern an `order`. The
// problemIndex is emitted in that same (phase → pattern-order → in-file problem-order) sequence.
//
// Usage:
//   node tools/build-data.mjs                 # regenerate manifest from data/patterns/*.json
//   node tools/build-data.mjs --repo /path/to/Striver-191   # also inline any codeFile refs
//
// The hosted site loads only the static JSON this produces — no toolchain needed to deploy.

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PATTERNS_DIR = join(ROOT, 'data', 'patterns');
const MANIFEST = join(ROOT, 'data', 'manifest.json');

const repoArg = process.argv.indexOf('--repo');
const REPO = repoArg > -1 ? process.argv[repoArg + 1] : null;

const NO_ORDER = 9999; // patterns missing an `order` sort last, then by name — deterministic.

const files = readdirSync(PATTERNS_DIR).filter(f => f.endsWith('.json') && !f.startsWith('_'));
const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));

// 1. Load + parse every pattern file (and inline codeFile refs while we're here).
const loaded = [];
for (const file of files) {
  const path = join(PATTERNS_DIR, file);
  const pat = JSON.parse(readFileSync(path, 'utf8'));
  let mutated = false;

  for (const prob of pat.problems || []) {
    for (const sol of prob.solutions || []) {
      if (sol.codeFile && REPO) {
        try { sol.code = readFileSync(join(REPO, sol.codeFile), 'utf8').replace(/\s+$/, ''); mutated = true; }
        catch (e) { console.warn(`! could not read ${sol.codeFile}: ${e.message}`); }
      }
    }
  }

  if (mutated) writeFileSync(path, JSON.stringify(pat, null, 2) + '\n');
  loaded.push({ file, pat });
}

// 2. Sort by (phaseId, order, name) so the manifest reflects the authored learning sequence,
//    independent of alphabetical filename order.
loaded.sort((a, b) =>
  (a.pat.phaseId - b.pat.phaseId) ||
  ((a.pat.order ?? NO_ORDER) - (b.pat.order ?? NO_ORDER)) ||
  String(a.pat.name).localeCompare(String(b.pat.name)));

// 3. Emit patterns[] and problemIndex[] in that order (problems keep their in-file order).
const patterns = [];
const problemIndex = [];
const seenPatternIds = new Set();
const seenProblemIds = new Set();

for (const { file, pat } of loaded) {
  if (seenPatternIds.has(pat.id)) console.warn(`! duplicate pattern id "${pat.id}" (${file})`);
  seenPatternIds.add(pat.id);

  const meta = manifest.patterns?.find(p => p.id === pat.id);
  patterns.push({
    id: pat.id,
    phaseId: pat.phaseId,
    order: pat.order ?? NO_ORDER,
    name: pat.name,
    file,
    tagline: (meta && meta.tagline) || pat.tagline || '',
  });

  for (const prob of pat.problems || []) {
    if (seenProblemIds.has(prob.id)) console.warn(`! duplicate problem id "${prob.id}" (${file})`);
    seenProblemIds.add(prob.id);
    problemIndex.push({ id: prob.id, title: prob.title, patternId: pat.id, phaseId: pat.phaseId, difficulty: prob.difficulty, leetcodeSlug: prob.leetcodeSlug });
  }
}

manifest.patterns = patterns;
manifest.problemIndex = problemIndex;
writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
console.log(`Rebuilt manifest: ${patterns.length} patterns, ${problemIndex.length} problems${REPO ? ' (with codeFile inlining)' : ''}.`);
