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
        const st = store.getProblem(p.id).status;
        list.append(el('a', { class: 'prob-row', href: `#/problem/${p.id}` },
          el('span', { class: 'status-dot ' + st }),
          el('span', { class: 'title', text: p.title }),
          el('span', { class: 'chip ' + p.difficulty, text: p.difficulty }),
        ));
      }
      nodes.push(list);
    }

    mount(app, nodes);
  }

  render();
}
