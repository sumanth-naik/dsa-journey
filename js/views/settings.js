import { el, mount } from '../dom.js';
import { store } from '../store.js';
import * as sync from '../sync.js';

export async function settingsView(app) {
  const nodes = [el('h1', { text: '⚙️ Settings' })];

  // Name
  const nameInput = el('input', { type: 'text', value: store.settings.name || '' });
  nameInput.addEventListener('change', () => store.setSettings({ name: nameInput.value.trim() }));
  nodes.push(el('label', { text: 'Your name (shown on the home screen)' }), nameInput);

  // ---- Cross-device sync ----
  const syncCard = el('div', { class: 'card' });
  syncCard.append(el('h2', { text: 'Cross-device sync (optional)', style: 'margin-top:0' }));
  syncCard.append(el('p', { class: 'muted small', text: 'Your progress is always saved on this device. To sync between your laptop and phone, paste a GitHub token below. It’s stored only on this device and never leaves it except to talk to GitHub.' }));

  const steps = el('ol', { class: 'prose small muted' },
    el('li', { html: 'Open <a href="https://github.com/settings/tokens?type=beta" target="_blank" rel="noopener">github.com → Fine-grained tokens</a> and click <b>Generate new token</b>.' }),
    el('li', { text: 'Repository access: None. Then under Account permissions, set “Gists” → Read and write.' }),
    el('li', { text: 'Pick an expiry (e.g. 1 year), generate, and copy the token.' }),
    el('li', { text: 'Paste it below and tap Save. Do the same once on your phone. Done!' }),
  );
  syncCard.append(steps);

  const tokenInput = el('input', { type: 'password', placeholder: 'github_pat_… (paste here)', value: store.getToken() });
  const status = el('div', { class: 'muted small', style: 'margin-top:8px' });
  const gid = store.getGistId();
  if (gid) status.append(el('span', {}, 'Synced gist: ', el('a', { href: 'https://gist.github.com/' + gid, target: '_blank', rel: 'noopener', text: gid })));

  const saveBtn = el('button', { class: 'btn primary', text: 'Save & test' });
  saveBtn.addEventListener('click', async () => {
    const t = tokenInput.value.trim();
    store.setToken(t);
    if (!t) { sync.setBadge('local', 'Local only'); mount(status, el('span', { text: 'Token cleared — local-only mode.' })); return; }
    mount(status, el('span', { text: 'Testing token…' }));
    const ok = await sync.testToken(t);
    if (!ok) { mount(status, el('span', { style: 'color:var(--red)', text: 'Token rejected. Check the Gists permission and try again.' })); return; }

    // If no gist ID yet, search for existing gist first
    if (!store.getGistId()) {
      mount(status, el('span', { text: 'Looking for existing gist…' }));
      await sync.findOrCreateGist();
    }

    await sync.pull();  // pull first to get remote data
    await sync.push();  // then push local changes
    mount(status, el('span', { style: 'color:var(--green)', text: '✓ Connected and synced.' }));
    location.reload(); // reload to show synced data
  });
  const syncNow = el('button', { class: 'btn', text: 'Sync now' });
  syncNow.addEventListener('click', async () => { await sync.push(); await sync.pull(); mount(status, el('span', { text: 'Synced ' + new Date().toLocaleTimeString() })); });

  syncCard.append(el('label', { text: 'GitHub token (Gists: read & write)' }), tokenInput, el('div', { class: 'btn-row' }, saveBtn, syncNow), status);
  nodes.push(syncCard);

  // ---- Backup ----
  const backup = el('div', { class: 'card' });
  backup.append(el('h2', { text: 'Backup', style: 'margin-top:0' }));
  const exportBtn = el('button', { class: 'btn', text: '⬇ Export progress (JSON)' });
  exportBtn.addEventListener('click', () => {
    const blob = new Blob([store.exportJSON()], { type: 'application/json' });
    const a = el('a', { href: URL.createObjectURL(blob), download: 'dsa-progress.json' });
    document.body.append(a); a.click(); a.remove();
  });
  const importInput = el('input', { type: 'file', accept: 'application/json', style: 'margin-top:10px' });
  importInput.addEventListener('change', async () => {
    const f = importInput.files[0]; if (!f) return;
    try { store.importJSON(await f.text()); alert('Progress imported.'); } catch (e) { alert('Import failed: ' + e.message); }
  });
  backup.append(el('div', { class: 'btn-row' }, exportBtn), el('label', { text: 'Import from a JSON backup' }), importInput);
  nodes.push(backup);

  // Security note
  nodes.push(el('div', { class: 'card' },
    el('h3', { text: 'Is this safe?', style: 'margin-top:0' }),
    el('p', { class: 'muted small', text: 'The token is stored only in this browser (localStorage) — never committed to the site and never written into the gist. It can only read/write your gists (not your repos or account) and you can revoke it anytime from GitHub settings. The progress gist is “secret” (not indexed) but anyone with its link could view it, so it holds only problem statuses and your notes — no secrets.' })));

  mount(app, nodes);
}
