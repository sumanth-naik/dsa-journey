import { el, mount } from '../dom.js';
import { getManifest } from '../data.js';
import { store } from '../store.js';

export async function dashboardView(app) {
  const m = await getManifest();
  const counts = store.counts();
  const due = store.dueForRevision();

  const nodes = [el('h1', { text: '📊 Progress' })];

  nodes.push(el('div', { class: 'stat-row' },
    stat(counts.solved || 0, 'Solved'),
    stat(counts.attempted || 0, 'Attempted'),
    stat(counts['needs-revision'] || 0, 'Needs revision'),
    stat(store.streak(), 'Day streak 🔥'),
  ));

  // Coverage by pattern (heatmap-ish)
  nodes.push(el('h2', { text: 'Coverage by pattern' }));
  const heat = el('div', { class: 'heat' });
  for (const pat of m.patterns) {
    const ids = m.problemIndex.filter(p => p.patternId === pat.id).map(p => p.id);
    const solved = ids.filter(id => store.getProblem(id).status === 'solved').length;
    const pct = ids.length ? solved / ids.length : 0;
    const bg = `color-mix(in srgb, var(--green) ${Math.round(pct * 100)}%, var(--bg-elev))`;
    heat.append(el('a', { class: 'cell', href: `#/pattern/${pat.id}`, style: `background:${bg}` },
      el('div', { text: pat.name, style: 'font-weight:600' }),
      el('div', { class: 'muted small', text: `${solved}/${ids.length}` })));
  }
  nodes.push(heat);

  // Due for revision
  nodes.push(el('h2', { text: `Due for revision (${due.length})` }));
  if (!due.length) {
    nodes.push(el('p', { class: 'muted', text: 'Nothing due. Solve problems and mark tricky ones "Needs revision" — they’ll resurface on a 1 → 3 → 7 → 21 day schedule.' }));
  } else {
    const list = el('div', { class: 'card' });
    for (const d of due) {
      const entry = m.problemIndex.find(p => p.id === d.id);
      if (!entry) continue;
      list.append(el('a', { class: 'prob-row', href: `#/problem/${d.id}` },
        el('span', { class: 'status-dot needs-revision' }),
        el('span', { class: 'title', text: entry.title }),
        el('span', { class: 'muted small', text: 'due ' + new Date(d.due).toLocaleDateString() })));
    }
    nodes.push(list);
  }

  mount(app, nodes);
}

function stat(n, label) {
  return el('div', { class: 'stat' }, el('div', { class: 'n', text: String(n) }), el('div', { class: 'l', text: label }));
}
