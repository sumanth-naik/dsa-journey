// search.js — global problem search (title, pattern, difficulty, tags).
import { el, mount } from '../dom.js';
import { getManifest } from '../data.js';
import { store } from '../store.js';

export async function searchView(app) {
  const manifest = await getManifest();
  const allProblems = manifest.problemIndex || [];

  // Build a search index with pattern names
  const patternMap = {};
  manifest.patterns.forEach(p => patternMap[p.id] = p.name);

  const searchIndex = allProblems.map(p => ({
    ...p,
    patternName: patternMap[p.patternId] || '',
    searchText: [
      p.title,
      patternMap[p.patternId],
      p.difficulty,
      ...(p.tags || [])
    ].join(' ').toLowerCase()
  }));

  let filtered = searchIndex;

  function render(results) {
    const grouped = {};
    results.forEach(p => {
      const key = p.patternName;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(p);
    });

    return el('div', { class: 'search-view' },
      el('div', { class: 'card' },
        el('h1', { text: '🔍 Search Problems' }),
        el('input', {
          type: 'text',
          class: 'search-input',
          placeholder: 'Search by title, pattern, difficulty, or tag...',
          oninput: e => {
            const q = e.target.value.trim().toLowerCase();
            if (!q) {
              filtered = searchIndex;
            } else {
              filtered = searchIndex.filter(p => p.searchText.includes(q));
            }
            mount(resultsContainer, renderResults(filtered));
          }
        })
      ),
      (resultsContainer = el('div', { class: 'search-results' }))
    );
  }

  function renderResults(results) {
    if (results.length === 0) {
      return el('div', { class: 'card' },
        el('p', { class: 'muted', text: 'No problems found. Try a different search term.' })
      );
    }

    const grouped = {};
    results.forEach(p => {
      const key = p.patternName;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(p);
    });

    const groups = Object.keys(grouped).sort().map(patternName => {
      const problems = grouped[patternName];
      return el('div', { class: 'card search-group' },
        el('h3', { class: 'search-group-title', text: `${patternName} (${problems.length})` }),
        el('div', { class: 'search-items' },
          ...problems.map(p => {
            const status = store.getProblem(p.id);
            const statusClass = status?.status || 'not-started';
            return el('a', {
              class: `search-item status-${statusClass}`,
              href: `#/problem/${p.id}`
            },
              el('div', { class: 'search-item-title' },
                el('span', { class: 'problem-title', text: p.title }),
                el('span', { class: `badge badge-${p.difficulty?.toLowerCase()}`, text: p.difficulty })
              ),
              status?.status && status.status !== 'not-started'
                ? el('div', { class: 'search-item-meta' },
                    el('span', { class: `status-tag status-${statusClass}`, text: statusLabel(status.status) })
                  )
                : null
            );
          })
        )
      );
    });

    return el('div', {},
      el('div', { class: 'search-count' },
        el('p', { class: 'muted', text: `${results.length} problem${results.length === 1 ? '' : 's'} found` })
      ),
      ...groups
    );
  }

  function statusLabel(s) {
    const map = {
      'solved': '✓ Solved'
    };
    return map[s] || s;
  }

  let resultsContainer;
  const view = render(filtered);
  mount(app, view);

  // Initial results
  mount(resultsContainer, renderResults(filtered));

  // Focus the search input
  setTimeout(() => {
    const input = view.querySelector('.search-input');
    if (input) input.focus();
  }, 100);
}
