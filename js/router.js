// router.js — tiny hash-based router (GitHub Pages friendly; deep-link refresh never 404s).
import { el, mount } from './dom.js';

const routes = [];

export function route(pattern, handler) {
  // pattern like '#/pattern/:id' -> regex with named groups
  const names = [];
  const rx = new RegExp('^' + pattern.replace(/:[^/]+/g, m => { names.push(m.slice(1)); return '([^/]+)'; }) + '$');
  routes.push({ rx, names, handler });
}

function parse(hash) {
  const h = hash || '#/';
  for (const r of routes) {
    const m = h.match(r.rx);
    if (m) { const params = {}; r.names.forEach((n, i) => params[n] = decodeURIComponent(m[i + 1])); return { handler: r.handler, params }; }
  }
  return null;
}

async function render() {
  const app = document.getElementById('app');
  const matched = parse(location.hash);
  const top = (location.hash.split('/')[1] || '').replace(/[^a-z]/gi, '') || 'home';
  document.querySelectorAll('.bottomnav a').forEach(a => a.classList.toggle('active', a.dataset.nav === top || (top === '' && a.dataset.nav === 'home')));

  if (!matched) { location.hash = '#/'; return; }
  mount(app, el('div', { class: 'loading', text: 'Loading…' }));

  // Timeout to prevent infinite loading
  const timeout = setTimeout(() => {
    mount(app, el('div', { class: 'card' },
      el('h2', { text: 'Loading timeout' }),
      el('p', { class: 'muted', text: 'The page took too long to load. Check your connection or try reloading.' }),
      el('p', {},
        el('button', { class: 'btn primary', onclick: () => location.reload(), text: 'Reload' }),
        ' ',
        el('a', { class: 'btn', href: '#/', text: 'Back to roadmap' })
      )
    ));
  }, 5000); // 5s timeout

  try {
    await matched.handler(app, matched.params);
    clearTimeout(timeout);
    window.scrollTo(0, 0);
  } catch (e) {
    clearTimeout(timeout);
    console.error('Route error:', e);
    mount(app, el('div', { class: 'card' },
      el('h2', { text: 'Something went wrong' }),
      el('p', { class: 'muted', text: e.message }),
      el('pre', { style: 'font-size: 0.8em; color: var(--red); overflow: auto;', text: e.stack || '' }),
      el('p', {}, el('a', { class: 'btn', href: '#/', text: '← Back to roadmap' }))
    ));
  }
}

export function startRouter() {
  window.addEventListener('hashchange', render);
  render();
}
