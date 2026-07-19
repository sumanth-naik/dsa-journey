import { el, mount } from '../dom.js';
import { store } from '../store.js';
import * as sync from '../sync.js';

export async function settingsView(app) {
  const nodes = [el('h1', { text: '⚙️ Settings' })];

  // Name
  const nameInput = el('input', { type: 'text', value: store.settings.name || '' });
  const nameStatus = el('div', { class: 'muted small', style: 'margin-top: 8px; margin-bottom: 20px;' });

  nameInput.addEventListener('change', async () => {
    const oldName = store.settings.name;
    const newName = nameInput.value.trim();

    if (!newName) {
      mount(nameStatus, el('span', { style: 'color: var(--red)', text: 'Name cannot be empty' }));
      nameInput.value = oldName;
      return;
    }

    if (newName === oldName) return;

    // Check for collision
    mount(nameStatus, el('span', { text: 'Checking availability...' }));
    const collision = await sync.checkNameCollision(newName);

    if (collision) {
      mount(nameStatus, el('span', { style: 'color: var(--red)', text: `Name "${newName}" is already taken. Choose another.` }));
      nameInput.value = oldName;
      return;
    }

    // Update name
    store.setSettings({ name: newName });
    store.progress.user = newName;
    store.setGistId(''); // Clear old gist ID to search for new one
    store._persist();

    mount(nameStatus, el('span', { style: 'color: var(--green)', text: '✓ Name updated. Syncing...' }));

    // Find/create gist with new name
    await sync.findOrCreateGist();
    await sync.push();

    mount(nameStatus, el('span', { style: 'color: var(--green)', text: '✓ Name updated and synced!' }));
  });

  nodes.push(
    el('label', { text: 'Your name' }),
    nameInput,
    nameStatus
  );

  // ---- Sync status ----
  const syncCard = el(‘div’, { class: ‘card’ });
  syncCard.append(el(‘h2’, { text: ‘Sync’, style: ‘margin-top:0’ }));
  syncCard.append(el(‘p’, { class: ‘muted small’, text: ‘Your progress automatically syncs across all your devices using your name.’ }));

  const status = el(‘div’, { class: ‘muted small’, style: ‘margin-top:12px’ });
  const gid = store.getGistId();
  if (gid) {
    status.append(el(‘span’, { style: ‘color: var(--green)’ }, ‘✓ Synced’));
  } else {
    status.append(el(‘span’, {}, ‘Not synced yet’));
  }

  const syncNow = el(‘button’, { class: ‘btn’, text: ‘Sync now’ });
  syncNow.addEventListener(‘click’, async () => {
    mount(status, el(‘span’, { text: ‘Syncing...’ }));
    await sync.findOrCreateGist();
    await sync.push();
    await sync.pull();
    mount(status, el(‘span’, { style: ‘color: var(--green)’ }, ‘✓ Synced ‘ + new Date().toLocaleTimeString()));
  });

  syncCard.append(el(‘div’, { class: ‘btn-row’ }, syncNow), status);
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
