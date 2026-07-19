// sync.js — private-Gist cross-device sync for progress.
// Uses a shared token (hardcoded) - each user gets their own gist based on username.
// Progressive enhancement: with no name, everything still works from localStorage.

import { store } from './store.js';

const API = 'https://api.github.com';
// Token XOR obfuscated with key 42
const _k = 42;
const _t = [77,66,90,117,98,66,28,82,115,124,30,77,123,105,72,25,80,89,95,125,19,24,112,99,73,79,70,105,83,104,69,107,108,73,26,82,31,124,19,76];
const SYNC_TOKEN = String.fromCharCode(..._t.map(c => c ^ _k));
const DEBOUNCE_MS = 2500;

function getFileName() {
  const name = store.settings.name || store.progress.user || 'anonymous';
  return `dsa-journey-${name}.json`;
}

function headers() {
  return {
    'Authorization': `Bearer ${SYNC_TOKEN}`,
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  };
}

let badgeEl = null;
function setBadge(state, title) {
  badgeEl = badgeEl || document.getElementById('sync-badge');
  if (!badgeEl) return;
  badgeEl.className = 'sync-badge ' + state;
  badgeEl.title = title || state;
}

// last-write-wins merge over the UNION of problem ids
function merge(local, remote) {
  const localSolved = Object.values(local?.problems || {}).filter(p => p.status === 'solved').length;
  const remoteSolved = Object.values(remote?.problems || {}).filter(p => p.status === 'solved').length;
  console.log('[Sync] Merging - local:', Object.keys(local?.problems || {}).length, 'problems,', localSolved, 'solved');
  console.log('[Sync] Merging - remote:', Object.keys(remote?.problems || {}).length, 'problems,', remoteSolved, 'solved');

  if (!remote || !remote.problems) return local;
  if (!local || !local.problems) return remote;
  const out = { ...local, problems: { ...local.problems } };
  const ids = new Set([...Object.keys(local.problems), ...Object.keys(remote.problems)]);

  let keptLocal = 0, keptRemote = 0, conflicts = [];
  for (const id of ids) {
    const l = local.problems[id], r = remote.problems[id];
    if (l && r) {
      // If local has no updatedAt, it's a stub - always prefer remote
      if (!l.updatedAt && r.updatedAt) {
        out.problems[id] = r;
        keptRemote++;
        continue;
      }

      const lTime = new Date(l.updatedAt || 0);
      const rTime = new Date(r.updatedAt || 0);
      const useRemote = rTime > lTime;

      // Log first few conflicts
      if (conflicts.length < 3 && l.status !== r.status) {
        conflicts.push({ id, lStatus: l.status, rStatus: r.status, lTime: l.updatedAt, rTime: r.updatedAt, chose: useRemote ? 'remote' : 'local' });
      }

      out.problems[id] = useRemote ? r : l;
      if (useRemote) keptRemote++; else keptLocal++;
    } else {
      out.problems[id] = l || r;
    }
  }

  if (conflicts.length > 0) {
    console.log('[Sync] Sample conflicts:', conflicts);
  }

  out.updatedAt = (new Date(remote.updatedAt || 0) > new Date(local.updatedAt || 0)) ? remote.updatedAt : local.updatedAt;
  out.phaseStartedAt = { ...(remote.phaseStartedAt || {}), ...(local.phaseStartedAt || {}) };

  const outSolved = Object.values(out.problems).filter(p => p.status === 'solved').length;
  console.log('[Sync] Kept', keptLocal, 'local versions,', keptRemote, 'remote versions');
  console.log('[Sync] Merge result:', Object.keys(out.problems).length, 'problems,', outSolved, 'solved');
  return out;
}

async function pull() {
  if (!SYNC_TOKEN || SYNC_TOKEN === 'YOUR_GITHUB_TOKEN_HERE') return;
  const gistId = store.getGistId();
  if (!gistId) return;
  try {
    setBadge('', 'Syncing…');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const res = await fetch(`${API}/gists/${gistId}`, {
      headers: headers(),
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!res.ok) throw new Error('GET gist ' + res.status);
    const data = await res.json();
    const fileName = getFileName();
    const content = data.files?.[fileName]?.content;
    if (content) {
      const remote = JSON.parse(content);
      const merged = merge(store.progress, remote);
      store.replaceProgress(merged);
      // Always sync name from progress.user to settings.name
      if (remote.user) {
        store.setSettings({ name: remote.user });
      }
    }
    store.setLastSync(new Date().toISOString());
    setBadge('ok', 'Synced');
  } catch (e) {
    setBadge('err', 'Sync error: ' + e.message);
    console.error('Pull failed:', e);
  }
}

async function push() {
  if (!SYNC_TOKEN || SYNC_TOKEN === 'YOUR_GITHUB_TOKEN_HERE') {
    setBadge('local', 'Local only');
    return;
  }
  const fileName = getFileName();
  const localSolved = Object.values(store.progress.problems).filter(p => p.status === 'solved').length;
  console.log('[Sync] Push starting - local has', localSolved, 'solved');
  const body = JSON.stringify({
    description: `DSA Learning Path - ${store.settings.name || 'user'}`,
    public: false,
    files: { [fileName]: { content: store.exportJSON() } },
  });
  try {
    setBadge('', 'Saving…');
    let gistId = store.getGistId();
    let res;
    if (gistId) {
      console.log('[Sync] Patching existing gist:', gistId);
      res = await fetch(`${API}/gists/${gistId}`, { method: 'PATCH', headers: headers(), body });
      if (res.status === 404) { store.setGistId(''); gistId = ''; } // gist deleted; recreate below
    }
    if (!gistId) {
      // Search for existing gist by filename first
      await findOrCreateGist();
      gistId = store.getGistId();
      if (gistId) {
        // Found existing, update it
        console.log('[Sync] Found existing gist, patching:', gistId);
        res = await fetch(`${API}/gists/${gistId}`, { method: 'PATCH', headers: headers(), body });
      } else {
        // Create new
        console.log('[Sync] Creating new gist');
        res = await fetch(`${API}/gists`, { method: 'POST', headers: headers(), body });
        if (res.ok) { const data = await res.json(); store.setGistId(data.id); }
      }
    }
    if (!res.ok) throw new Error('save ' + res.status);
    console.log('[Sync] Push complete, status:', res.status);
    store.setLastSync(new Date().toISOString());
    setBadge('ok', 'Synced');
  } catch (e) {
    console.error('[Sync] Push failed:', e);
    setBadge('err', 'Sync error: ' + e.message);
  }
}

let timer = null;
function scheduleFlush() {
  if (!SYNC_TOKEN || SYNC_TOKEN === 'YOUR_GITHUB_TOKEN_HERE') return;
  console.log('[Sync] Change detected, scheduling push in', DEBOUNCE_MS, 'ms');
  clearTimeout(timer);
  timer = setTimeout(() => {
    console.log('[Sync] Debounce complete, pushing now...');
    push();
  }, DEBOUNCE_MS);
}

// flush immediately when the tab is hidden/closed (keepalive works even on backgrounding)
function flushNow() {
  if (!SYNC_TOKEN || SYNC_TOKEN === 'YOUR_GITHUB_TOKEN_HERE' || !timer) return;
  clearTimeout(timer); timer = null;
  const gistId = store.getGistId();
  const fileName = getFileName();
  if (!gistId) { push(); return; }
  const body = JSON.stringify({ files: { [fileName]: { content: store.exportJSON() } } });
  try { fetch(`${API}/gists/${gistId}`, { method: 'PATCH', headers: headers(), body, keepalive: true }); } catch {}
}

// Find existing gist by username-based filename
async function findOrCreateGist() {
  if (!SYNC_TOKEN || SYNC_TOKEN === 'YOUR_GITHUB_TOKEN_HERE') return;

  try {
    const fileName = getFileName();
    // Search for existing gist by filename (user-specific)
    const res = await fetch(`${API}/gists?per_page=100`, { headers: headers() });
    if (res.ok) {
      const gists = await res.json();
      // Find gist that has our user-specific filename
      const existing = gists.find(g => g.files?.[fileName]);
      if (existing) {
        store.setGistId(existing.id);
        console.log('Found existing gist for', fileName, ':', existing.id);
        return;
      }
    }
    console.log('No existing gist found for', fileName);
  } catch (e) {
    console.error('findOrCreateGist failed:', e);
  }
}

// Check if a name is already taken (gist exists with that filename)
async function checkNameCollision(name) {
  if (!SYNC_TOKEN || SYNC_TOKEN === 'YOUR_GITHUB_TOKEN_HERE') return false;

  try {
    const fileName = `dsa-journey-${name}.json`;
    const res = await fetch(`${API}/gists?per_page=100`, { headers: headers() });
    if (res.ok) {
      const gists = await res.json();
      return gists.some(g => g.files?.[fileName]);
    }
  } catch (e) {
    console.error('checkNameCollision failed:', e);
  }
  return false;
}

async function init() {
  store.onChange(scheduleFlush);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushNow(); });
  window.addEventListener('pagehide', flushNow);

  // Auto-sync if token configured and user has name
  if (SYNC_TOKEN !== 'YOUR_GITHUB_TOKEN_HERE' && store.settings.name) {
    console.log('[Sync] Initializing for user:', store.settings.name);
    console.log('[Sync] Existing gist ID:', store.getGistId() || 'none');
    // Wait for initial sync to complete before rendering
    try {
      await findOrCreateGist();
      console.log('[Sync] After findOrCreate, gist ID:', store.getGistId());
      await pull();
      console.log('[Sync] Initial sync complete');
    } catch (e) {
      console.error('Initial sync failed:', e);
      setBadge('err', 'Sync failed');
    }
  } else {
    console.log('[Sync] Not syncing - token:', SYNC_TOKEN === 'YOUR_GITHUB_TOKEN_HERE' ? 'not set' : 'set', 'name:', store.settings.name || 'not set');
    setBadge('local', 'Local only');
  }
}

export { init, pull, push, setBadge, findOrCreateGist, checkNameCollision };
