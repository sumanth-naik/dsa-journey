// sync.js — private-Gist cross-device sync for progress.
// The token lives ONLY in this browser's localStorage (never committed, never in the gist).
// Progressive enhancement: with no token, everything still works from localStorage.

import { store } from './store.js';

const API = 'https://api.github.com';
const FILE = 'dsa-journey-progress.json';
const DEBOUNCE_MS = 2500;

function headers() {
  return {
    'Authorization': `Bearer ${store.getToken()}`,
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
  const token = store.getToken(), gistId = store.getGistId();
  if (!token || !gistId) return;
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
      // Sync name from progress.user to settings.name if not set
      if (remote.user && !store.settings.name) {
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
  const token = store.getToken();
  if (!token) { setBadge('local', 'Local only (no token)'); return; }
  const body = JSON.stringify({
    description: `dsa-journey progress (${store.settings.name || 'user'})`,
    public: false,
    files: { [FILE]: { content: store.exportJSON() } },
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
      res = await fetch(`${API}/gists`, { method: 'POST', headers: headers(), body });
      if (res.ok) { const data = await res.json(); store.setGistId(data.id); }
    }
    if (!res.ok) throw new Error('save ' + res.status);
    store.setLastSync(new Date().toISOString());
    setBadge('ok', 'Synced');
  } catch (e) { setBadge('err', 'Sync error: ' + e.message); }
}

let timer = null;
function scheduleFlush() {
  if (!store.getToken()) { setBadge('local', 'Local only (no token)'); return; }
  clearTimeout(timer);
  timer = setTimeout(push, DEBOUNCE_MS);
}

// flush immediately when the tab is hidden/closed (keepalive works even on backgrounding)
function flushNow() {
  if (!store.getToken() || !timer) return;
  clearTimeout(timer); timer = null;
  const gistId = store.getGistId();
  if (!gistId) { push(); return; }
  const body = JSON.stringify({ files: { [FILE]: { content: store.exportJSON() } } });
  try { fetch(`${API}/gists/${gistId}`, { method: 'PATCH', headers: headers(), body, keepalive: true }); } catch {}
}

// Validate a token by hitting /gists (used by Settings "Test token").
async function testToken(token) {
  const res = await fetch(`${API}/gists?per_page=1`, {
    headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
  });
  return res.ok;
}

// Find existing dsa-journey gist or create new one
async function findOrCreateGist() {
  const token = store.getToken();
  if (!token) return;

  try {
    // Search for existing gist by description
    const res = await fetch(`${API}/gists`, { headers: headers() });
    if (res.ok) {
      const gists = await res.json();
      const existing = gists.find(g => g.description?.includes('dsa-journey progress'));
      if (existing && existing.files?.[FILE]) {
        store.setGistId(existing.id);
        return;
      }
    }

    // No existing gist found, create new one
    const body = JSON.stringify({
      description: `dsa-journey progress (${store.settings.name || 'user'})`,
      public: false,
      files: { [FILE]: { content: store.exportJSON() } },
    });
    const createRes = await fetch(`${API}/gists`, { method: 'POST', headers: headers(), body });
    if (createRes.ok) {
      const data = await createRes.json();
      store.setGistId(data.id);
    }
  } catch (e) {
    console.error('findOrCreateGist failed:', e);
  }
}

function init() {
  store.onChange(scheduleFlush);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushNow(); });
  window.addEventListener('pagehide', flushNow);
  if (store.getToken()) {
    // Pull in background, don't block app startup
    pull().catch(e => {
      console.error('Initial sync failed:', e);
      setBadge('err', 'Sync failed');
    });
  } else {
    setBadge('local', 'Local only (no token)');
  }
}

export { init, pull, push, testToken, setBadge, findOrCreateGist };
