import { el, mount } from '../dom.js';
import { getManifest } from '../data.js';
import { store } from '../store.js';

export async function homeView(app) {
  const m = await getManifest();
  const counts = store.counts();
  const totalProblems = m.problemIndex.length;
  const solved = counts.solved || 0;

  const nodes = [];
  nodes.push(el('h1', { text: `Hi ${store.settings.name || 'there'} 👋` }));
  nodes.push(el('p', { class: 'muted', text: 'Learn the pattern first, then apply it. Reveal hints and solutions only when you want them — never a cold problem.' }));

  // stat strip
  const bookmarked = m.problemIndex.filter(p => !!store.getProblem(p.id).revision).length;
  nodes.push(el('div', { class: 'stat-row' },
    el('a', { href: '#/solved', style: 'text-decoration: none; color: inherit;' }, stat(solved, 'Solved')),
    el('a', { href: '#/search', style: 'text-decoration: none; color: inherit;' }, stat(totalProblems, 'Total')),
    el('a', { href: '#/bookmarked', style: 'text-decoration: none; color: inherit;' }, stat(bookmarked, 'Bookmarked')),
    el('a', { href: '#/streak', style: 'text-decoration: none; color: inherit;' }, stat(store.streak(), 'Day streak 🔥')),
  ));

  // patterns grid
  const card = el('div', { class: 'card' });
  card.append(el('h2', { text: '📚 Patterns' }));
  card.append(el('p', { class: 'muted small', text: 'Master one pattern at a time. Each pattern has curated problems organized by specific techniques.' }));

  const grid = el('div', { class: 'pattern-grid' });
  for (const pat of m.patterns) {
    const allProblems = m.problemIndex.filter(p => p.patternId === pat.id);
    const importantProblems = allProblems.filter(p => p.important);
    const solved = allProblems.filter(p => store.getProblem(p.id).status === 'solved').length;

    grid.append(el('a', { class: 'pattern-cell', href: `#/pattern/${pat.id}` },
      el('span', { class: 'ring', text: `${solved}/${allProblems.length}` }),
      el('div', { text: pat.name, style: 'font-weight:600' }),
      el('div', { class: 'muted small', text: importantProblems.length ? `${importantProblems.length} curated` : pat.tagline || '' }),
    ));
  }
  card.append(grid);
  nodes.push(card);

  mount(app, nodes);
}

function stat(n, label) {
  return el('div', { class: 'stat' }, el('div', { class: 'n', text: String(n) }), el('div', { class: 'l', text: label }));
}
