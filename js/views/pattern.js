import { el, mount } from '../dom.js';
import { getPattern } from '../data.js';
import { store } from '../store.js';
import { md } from '../lib/markdown.js';

// Concept-first: the concept is shown BEFORE the problem list.
export async function patternView(app, { id }) {
  const pat = await getPattern(id);
  let showImportantOnly = true;

  function render() {
    const nodes = [
      el('div', { class: 'crumbs' }, el('a', { href: '#/', text: 'Roadmap' }), ' / ', pat.name),
      el('h1', { text: pat.name }),
    ];

    // Concept (authored markdown -> trusted html)
    const concept = el('div', { class: 'card prose' });
    concept.append(el('div', { html: md(pat.concept || '') }));
    if (pat.whenToUse && pat.whenToUse.length) {
      concept.append(el('h3', { text: 'Recognize it when…' }));
      concept.append(el('ul', {}, ...pat.whenToUse.map(w => el('li', { text: w }))));
    }
    nodes.push(concept);

    // Filter toggle
    const importantCount = pat.problems.filter(p => p.important).length;
    if (importantCount > 0) {
      const filterCard = el('div', { class: 'card' },
        el('div', { class: 'revision-pattern-mode' },
          el('button', {
            class: `revision-pattern-mode-btn ${!showImportantOnly ? 'active' : ''}`,
            text: `Show All (${pat.problems.length})`,
            onclick: () => { showImportantOnly = false; render(); }
          }),
          el('button', {
            class: `revision-pattern-mode-btn ${showImportantOnly ? 'active' : ''}`,
            text: `Show Important (${importantCount})`,
            onclick: () => { showImportantOnly = true; render(); }
          })
        )
      );
      nodes.push(filterCard);
    }

    // Filter problems
    const filteredProblems = showImportantOnly
      ? pat.problems.filter(p => p.important)
      : pat.problems;

    // Group by subcategory
    const bySubcategory = {};
    for (const p of filteredProblems) {
      const sub = p.subcategory || 'uncategorized';
      if (!bySubcategory[sub]) bySubcategory[sub] = [];
      bySubcategory[sub].push(p);
    }

    const subcategories = Object.keys(bySubcategory).sort();

    // Always show subcategory grouping
    nodes.push(el('h2', { text: 'Problems' }));

    for (const sub of subcategories) {
      const problems = bySubcategory[sub];
      const subLabel = sub.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

      nodes.push(el('h3', { text: `${subLabel} (${problems.length})` }));
      const list = el('div', { class: 'card' });

      for (const p of problems) {
        const prob = store.getProblem(p.id);
        const st = prob.status;
        const isSolved = st === 'solved';
        const needsRevision = !!prob.revision;

        const row = el('div', { class: 'prob-row', style: 'display: flex; align-items: center; gap: 8px; padding: 12px 4px; border-bottom: 1px solid var(--border);' });

        // Status dot
        const dot = el('span', { class: 'status-dot ' + st });

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
