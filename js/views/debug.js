import { el, mount } from '../dom.js';
import { store } from '../store.js';

export function debugView(app) {
  const nodes = [el('h1', { text: '🔧 Debug Info' })];

  nodes.push(el('div', { class: 'card' },
    el('h2', { text: 'Store State' }),
    el('pre', { style: 'font-size: 0.8em; overflow: auto; max-height: 300px;', text: JSON.stringify({
      settings: store.settings,
      progressUser: store.progress.user,
      progressVersion: store.progress.version,
      problemCount: Object.keys(store.progress.problems).length,
      hasToken: !!store.getToken(),
      hasGistId: !!store.getGistId(),
      lastSync: store.getLastSync(),
    }, null, 2) })
  ));

  nodes.push(el('div', { class: 'card' },
    el('h2', { text: 'localStorage Keys' }),
    el('pre', { style: 'font-size: 0.8em; overflow: auto;', text: JSON.stringify({
      'dsa:progress': !!localStorage.getItem('dsa:progress'),
      'dsa:settings': !!localStorage.getItem('dsa:settings'),
      'dsa:token': !!localStorage.getItem('dsa:token'),
      'dsa:gistId': localStorage.getItem('dsa:gistId'),
      'dsa:lastSync': localStorage.getItem('dsa:lastSync'),
    }, null, 2) })
  ));

  nodes.push(el('div', { class: 'card' },
    el('h2', { text: 'Actions' }),
    el('button', { class: 'btn', text: 'Clear all data & reload', onclick: () => {
      if (confirm('Clear all localStorage and reload?')) {
        localStorage.clear();
        location.reload();
      }
    }}),
    ' ',
    el('a', { class: 'btn', href: '#/', text: '← Back' })
  ));

  mount(app, nodes);
}
