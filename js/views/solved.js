import { el, mount } from '../dom.js';
import { getManifest } from '../data.js';
import { store } from '../store.js';

export async function solvedView(app) {
  const m = await getManifest();

  function render() {
    const nodes = [el('h1', { text: 'Solved Problems' })];

    // Get all solved problems
    const solvedProblems = m.problemIndex.filter(p => store.getProblem(p.id).status === 'solved');

    if (solvedProblems.length === 0) {
      nodes.push(el('div', { class: 'card', style: 'text-align: center; padding: 40px 20px;' },
        el('p', { class: 'muted', text: 'No problems solved yet. Start solving from the patterns!' }),
        el('div', { class: 'btn-row', style: 'justify-content: center; margin-top: 20px;' },
          el('a', { class: 'btn primary', href: '#/', text: '📚 Browse Patterns' }),
          el('a', { class: 'btn', href: '#/search', text: '🔍 Search Problems' })
        )
      ));
      mount(app, nodes);
      return;
    }

    nodes.push(el('p', { class: 'muted', text: `You've solved ${solvedProblems.length} problems. Keep it up! 🎉` }));

    // Group by pattern
    const byPattern = {};
    for (const p of solvedProblems) {
      if (!byPattern[p.patternId]) byPattern[p.patternId] = [];
      byPattern[p.patternId].push(p);
    }

    for (const patternId of Object.keys(byPattern)) {
      const pattern = m.patterns.find(pt => pt.id === patternId);
      const problems = byPattern[patternId];

      nodes.push(el('h2', { text: `${pattern.name} (${problems.length})` }));
      const list = el('div', { class: 'card' });

      for (const p of problems) {
        const prob = store.getProblem(p.id);
        const isSolved = prob.status === 'solved';
        const needsRevision = !!prob.revision;

        const row = el('div', { class: 'prob-row', style: 'display: flex; align-items: center; gap: 8px; padding: 12px 4px; border-bottom: 1px solid var(--border);' });

        // Status dot
        const dot = el('span', { class: 'status-dot ' + prob.status });

        // Title (clickable link)
        const title = el('a', {
          href: `#/problem/${p.id}`,
          style: 'flex: 1; color: var(--text); text-decoration: none;',
          text: p.title
        });

        // Difficulty chip
        const diff = el('span', { class: 'chip ' + p.difficulty, text: p.difficulty });

        // Solved button
        const solvedBtn = el('button', {
          class: 'btn btn-sm' + (isSolved ? ' primary' : ''),
          text: isSolved ? '✓ Solved' : 'Solved',
          style: 'min-width: 80px;',
          onclick: (e) => {
            e.stopPropagation();
            e.preventDefault();
            store.setStatus(p.id, isSolved ? 'not-started' : 'solved');
            render();
          }
        });

        // Bookmark button
        const bookmarkBtn = el('button', {
          class: 'btn btn-sm' + (needsRevision ? ' primary' : ''),
          text: needsRevision ? '⭐ Bookmarked' : 'Bookmark',
          style: 'min-width: 100px;',
          onclick: (e) => {
            e.stopPropagation();
            e.preventDefault();
            if (needsRevision) {
              store.clearRevision(p.id);
            } else {
              store.addRevision(p.id);
            }
            render();
          }
        });

        row.append(dot, title, diff, solvedBtn, bookmarkBtn);
        list.append(row);
      }
      nodes.push(list);
    }

    mount(app, nodes);
  }

  render();
}
