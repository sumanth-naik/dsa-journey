// sync.js — private-Gist cross-device sync for progress.
// Uses a shared token (hardcoded) - each user gets their own gist based on username.
// Progressive enhancement: with no name, everything still works from localStorage.

import { store } from './store.js';

const API = 'https://api.github.com';
// TODO: Replace with your actual GitHub token (Gists: Read and Write)
const SYNC_TOKEN = 'YOUR_GITHUB_TOKEN_HERE';
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
  if (!remote || !remote.problems) return local;
  if (!local || !local.problems) return remote;
  const out = { ...local, problems: { ...local.problems } };
  const ids = new Set([...Object.keys(local.problems), ...Object.keys(remote.problems)]);
  for (const id of ids) {
    const l = local.problems[id], r = remote.problems[id];
    if (l && r) out.problems[id] = (new Date(r.updatedAt || 0) > new Date(l.updatedAt || 0)) ? r : l;
    else out.problems[id] = l || r;
  }
  out.updatedAt = (new Date(remote.updatedAt || 0) > new Date(local.updatedAt || 0)) ? remote.updatedAt : local.updatedAt;
  out.phaseStartedAt = { ...(remote.phaseStartedAt || {}), ...(local.phaseStartedAt || {}) };
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
    const content = data.files?.[FILE]?.content;
    if (content) {
      const remote = JSON.parse(content);
      store.replaceProgress(merge(store.progress, remote));
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
      res = await fetch(`${API}/gists/${gistId}`, { method: 'PATCH', headers: headers(), body });
      if (res.status === 404) { store.setGistId(''); gistId = ''; } // gist deleted; recreate below
    }
    if (!gistId) {
      // Search for existing gist by filename first
      await findOrCreateGist();
      gistId = store.getGistId();
      if (gistId) {
        // Found existing, update it
        res = await fetch(`${API}/gists/${gistId}`, { method: 'PATCH', headers: headers(), body });
      } else {
        // Create new
        res = await fetch(`${API}/gists`, { method: 'POST', headers: headers(), body });
        if (res.ok) { const data = await res.json(); store.setGistId(data.id); }
      }
    }
    if (!res.ok) throw new Error('save ' + res.status);
    store.setLastSync(new Date().toISOString());
    setBadge('ok', 'Synced');
  } catch (e) { setBadge('err', 'Sync error: ' + e.message); }
}

let timer = null;
function scheduleFlush() {
  if (!SYNC_TOKEN || SYNC_TOKEN === 'YOUR_GITHUB_TOKEN_HERE') return;
  clearTimeout(timer);
  timer = setTimeout(push, DEBOUNCE_MS);
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

function init() {
  store.onChange(scheduleFlush);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushNow(); });
  window.addEventListener('pagehide', flushNow);

  // Auto-sync if token configured and user has name
  if (SYNC_TOKEN !== 'YOUR_GITHUB_TOKEN_HERE' && store.settings.name) {
    // Pull in background, don't block app startup
    findOrCreateGist().then(() => pull()).catch(e => {
      console.error('Initial sync failed:', e);
      setBadge('err', 'Sync failed');
    });
  } else {
    setBadge('local', 'Local only');
  }
}

export { init, pull, push, setBadge, findOrCreateGist, checkNameCollision };
