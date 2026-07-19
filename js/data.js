// data.js — loads the manifest + lazily loads per-pattern JSON files.
// All fetches are RELATIVE so they resolve correctly under /dsa-journey/ on GitHub Pages.

let manifest = null;
const patternCache = new Map();

export async function getManifest() {
  if (manifest) return manifest;
  const res = await fetch('data/manifest.json');
  if (!res.ok) throw new Error('Could not load manifest.json');
  manifest = await res.json();
  // Views derive pattern display order from patterns[] order. Sort defensively by
  // (phaseId, order, name) so the learning sequence is correct even if the manifest
  // was hand-edited out of order. `order` is authored per-pattern; missing sorts last.
  if (Array.isArray(manifest.patterns)) {
    manifest.patterns.sort((a, b) =>
      ((a.phaseId ?? 0) - (b.phaseId ?? 0)) ||
      ((a.order ?? 9999) - (b.order ?? 9999)) ||
      String(a.name || '').localeCompare(String(b.name || '')));
  }
  return manifest;
}

export async function getPattern(patternId) {
  if (patternCache.has(patternId)) return patternCache.get(patternId);
  const m = await getManifest();
  const meta = m.patterns.find(p => p.id === patternId);
  if (!meta) throw new Error('Unknown pattern: ' + patternId);
  const res = await fetch(`data/patterns/${meta.file}`);
  if (!res.ok) throw new Error('Could not load pattern ' + patternId);
  const data = await res.json();
  patternCache.set(patternId, data);
  return data;
}

// Load every pattern file (used by the Key-Ideas review view and dashboard coverage).
export async function getAllPatterns() {
  const m = await getManifest();
  return Promise.all(m.patterns.map(p => getPattern(p.id)));
}

export async function getProblemById(problemId) {
  const m = await getManifest();
  const entry = m.problemIndex.find(p => p.id === problemId);
  if (!entry) return null;
  const pattern = await getPattern(entry.patternId);
  const problem = pattern.problems.find(p => p.id === problemId);
  return problem ? { problem, pattern } : null;
}
