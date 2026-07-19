import { el, mount } from '../dom.js';
import { getAllPatterns, getManifest } from '../data.js';
import { store } from '../store.js';
import { md } from '../lib/markdown.js';

// "Key Ideas only" — aggregates problem-level keyIdeas across everything, filterable.
// This is the revise-fast surface: skim ideas, click through only if needed.
export async function reviewView(app) {
  const [manifest, patterns] = await Promise.all([getManifest(), getAllPatterns()]);

  // Filter state
  let difficultyFilterMode = 'include';
  let selectedDifficulties = new Set(['Easy', 'Medium', 'Hard']);
  let patternFilterMode = 'include';
  let selectedPatterns = new Set(manifest.patterns.map(p => p.id));
  let statusFilter = 'all'; // all | solved | not-started

  function updateView() {
    mount(app, renderView());
  }

  function renderView() {
    return el('div', { class: 'review-view' },
      el('div', { class: 'card' },
        el('h1', { text: '💡 Key Ideas' }),
        el('p', { class: 'muted', text: 'Skim the core idea of every problem. Read the idea, and only open the problem if it doesn\'t click.' })
      ),

      el('div', { class: 'card' },
        el('div', { class: 'revision-filter-header' },
          el('h3', { text: 'Difficulty Filter' }),
          el('button', {
            class: 'btn-reset',
            text: '↺ Reset',
            onclick: () => {
              selectedDifficulties = new Set(['Easy', 'Medium', 'Hard']);
              difficultyFilterMode = 'include';
              updateView();
            }
          })
        ),
        el('div', { class: 'revision-pattern-mode' },
          el('button', {
            class: `revision-pattern-mode-btn ${difficultyFilterMode === 'include' ? 'active' : ''}`,
            text: '✓ Include These',
            onclick: () => {
              difficultyFilterMode = 'include';
              selectedDifficulties = new Set(['Easy', 'Medium', 'Hard']);
              updateView();
            }
          }),
          el('button', {
            class: `revision-pattern-mode-btn ${difficultyFilterMode === 'exclude' ? 'active' : ''}`,
            text: '✗ Exclude These',
            onclick: () => {
              difficultyFilterMode = 'exclude';
              selectedDifficulties = new Set();
              updateView();
            }
          })
        ),
        el('div', { class: 'revision-pattern-list' },
          ...['Easy', 'Medium', 'Hard'].map(diff => {
            const isChecked = selectedDifficulties.has(diff);
            return el('label', { class: 'revision-pattern-item' },
              el('input', {
                type: 'checkbox',
                checked: isChecked,
                onchange: e => {
                  if (e.target.checked) selectedDifficulties.add(diff);
                  else selectedDifficulties.delete(diff);
                  updateView();
                }
              }),
              el('span', { class: 'revision-pattern-name', text: diff })
            );
          })
        )
      ),

      el('div', { class: 'card' },
        el('div', { class: 'revision-filter-header' },
          el('h3', { text: 'Pattern Filter' }),
          el('button', {
            class: 'btn-reset',
            text: '↺ Reset',
            onclick: () => {
              selectedPatterns = new Set(manifest.patterns.map(p => p.id));
              patternFilterMode = 'include';
              updateView();
            }
          })
        ),
        el('div', { class: 'revision-pattern-mode' },
          el('button', {
            class: `revision-pattern-mode-btn ${patternFilterMode === 'include' ? 'active' : ''}`,
            text: '✓ Include These',
            onclick: () => {
              patternFilterMode = 'include';
              selectedPatterns = new Set(manifest.patterns.map(p => p.id));
              updateView();
            }
          }),
          el('button', {
            class: `revision-pattern-mode-btn ${patternFilterMode === 'exclude' ? 'active' : ''}`,
            text: '✗ Exclude These',
            onclick: () => {
              patternFilterMode = 'exclude';
              selectedPatterns = new Set();
              updateView();
            }
          })
        ),
        el('div', { class: 'revision-pattern-list' },
          ...manifest.patterns.map(p => {
            const isChecked = selectedPatterns.has(p.id);
            return el('label', { class: 'revision-pattern-item' },
              el('input', {
                type: 'checkbox',
                checked: isChecked,
                onchange: e => {
                  if (e.target.checked) selectedPatterns.add(p.id);
                  else selectedPatterns.delete(p.id);
                  updateView();
                }
              }),
              el('span', { class: 'revision-pattern-name', text: p.name })
            );
          })
        )
      ),

      el('div', { class: 'card' },
        el('h3', { text: 'Status Filter' }),
        el('div', { class: 'revision-pattern-list' },
          ...[
            ['all', 'All'],
            ['solved', 'Solved'],
            ['not-started', 'Not Started']
          ].map(([value, label]) => {
            return el('label', { class: 'revision-pattern-item' },
              el('input', {
                type: 'radio',
                name: 'status',
                checked: statusFilter === value,
                onchange: () => {
                  statusFilter = value;
                  updateView();
                }
              }),
              el('span', { class: 'revision-pattern-name', text: label })
            );
          })
        )
      ),

      renderList()
    );
  }

  function renderList() {
    // Build filtered list
    const items = [];

    for (const pat of patterns) {
      // Apply pattern filter
      if (patternFilterMode === 'include') {
        if (selectedPatterns.size === 0) continue; // Empty include = nothing
        if (!selectedPatterns.has(pat.id)) continue;
      } else {
        // Exclude mode
        const allPatternIds = new Set(manifest.patterns.map(p => p.id));
        if (selectedPatterns.size === allPatternIds.size &&
            [...allPatternIds].every(id => selectedPatterns.has(id))) {
          continue; // Excluding everything = show nothing
        }
        if (selectedPatterns.has(pat.id)) continue;
      }

      for (const p of pat.problems) {
        if (!p.keyIdeas) continue;

        // Apply difficulty filter
        if (difficultyFilterMode === 'include') {
          if (selectedDifficulties.size === 0) continue; // Empty include = nothing
          if (!selectedDifficulties.has(p.difficulty)) continue;
        } else {
          // Exclude mode
          const allDifficulties = new Set(['Easy', 'Medium', 'Hard']);
          if (selectedDifficulties.size === allDifficulties.size &&
              [...allDifficulties].every(d => selectedDifficulties.has(d))) {
            continue; // Excluding everything = show nothing
          }
          if (selectedDifficulties.has(p.difficulty)) continue;
        }

        // Apply status filter
        const st = store.getProblem(p.id).status;
        if (statusFilter !== 'all' && st !== statusFilter) continue;

        const item = el('div', { class: 'ki-item' },
          el('h4', {},
            el('span', { class: 'status-dot ' + st }),
            ' ',
            el('a', { href: `#/problem/${p.id}`, text: ' ' + p.title }),
            ' ',
            el('span', { class: 'chip ' + p.difficulty, text: p.difficulty })
          ),
          el('div', { class: 'prose small', html: md(p.keyIdeas) })
        );
        items.push(item);
      }
    }

    return el('div', { class: 'card' },
      items.length ? items : [el('p', { class: 'muted', text: 'No matching problems.' })]
    );
  }

  mount(app, renderView());
}
