import { el, mount } from '../dom.js';
import { getProblemById } from '../data.js';
import { store } from '../store.js';
import { md } from '../lib/markdown.js';

const LC = 'https://leetcode.com/problems/';

export async function problemView(app, { id }) {
  const found = await getProblemById(id);
  if (!found) throw new Error('Problem not found');
  const { problem: p, pattern } = found;

  const nodes = [];
  nodes.push(el('div', { class: 'crumbs' },
    el('a', { href: '#/', text: 'Roadmap' }), ' / ',
    el('a', { href: `#/pattern/${pattern.id}`, text: pattern.name }), ' / ', p.title));

  nodes.push(el('div', { class: 'phase-head' },
    el('h1', { text: p.title, style: 'margin:0' }),
    el('span', { class: 'chip ' + p.difficulty, text: p.difficulty })));

  // Primary CTA: LeetCode + optional video
  const cta = el('div', { class: 'btn-row' });
  if (p.leetcodeSlug && p.leetcodeSlug !== 'unknown')
    cta.append(el('a', { class: 'btn primary', href: LC + p.leetcodeSlug, target: '_blank', rel: 'noopener', text: '🟧 Solve on LeetCode ↗' }));
  if (p.video && p.video.url)
    cta.append(el('a', { class: 'btn', href: p.video.url, target: '_blank', rel: 'noopener', text: '▶ ' + (p.video.title || 'Video walkthrough') }));
  nodes.push(cta);

  // Status controls
  nodes.push(statusControls(p.id));

  // Key ideas (problem-level) — collapsed so it's never forced
  if (p.keyIdeas) {
    nodes.push(reveal('💡 Key ideas', el('div', { class: 'prose', html: md(p.keyIdeas) }), false));
  }

  // Progressive hints — one at a time
  if (p.hints && p.hints.length) {
    const hintsWrap = el('div', {});
    hintsWrap.append(el('h3', { text: 'Hints' }));
    p.hints.forEach((hint, i) => {
      const d = el('details', { class: 'reveal hint' });
      d.append(el('summary', { text: `Hint ${i + 1}` }));
      d.append(el('div', { class: 'body prose', html: md(hint) }));
      hintsWrap.append(d);
    });
    nodes.push(hintsWrap);
  }

  // Tiered solutions — brute -> better -> optimal, each collapsed
  if (p.solutions && p.solutions.length) {
    nodes.push(el('h3', { text: 'Solutions' }));
    p.solutions.forEach((sol, i) => {
      const body = el('div', { class: 'body' });
      if (sol.keyIdea) body.append(el('div', { class: 'callout', text: sol.keyIdea }));
      body.append(el('div', { class: 'sol-meta' },
        el('span', { class: 'complexity', html: `Time: <b>${escapeInline(sol.timeComplexity || '?')}</b>` }),
        el('span', { class: 'complexity', html: `Space: <b>${escapeInline(sol.spaceComplexity || '?')}</b>` })));
      body.append(codeBlock(sol.code || ''));
      nodes.push(reveal(`${sol.label || 'Solution ' + (i + 1)}`, body, i === p.solutions.length - 1 && false));
    });
  }

  mount(app, nodes);
  // highlight after mount
  requestAnimationFrame(() => { if (window.hljs) app.querySelectorAll('pre code').forEach(b => window.hljs.highlightElement(b)); });
}

function reveal(title, bodyNode, open) {
  const d = el('details', { class: 'reveal' });
  if (open) d.open = true;
  d.append(el('summary', { text: title }));
  const wrap = el('div', { class: 'body' });
  wrap.append(bodyNode);
  d.append(wrap);
  return d;
}

function codeBlock(code) {
  const pre = el('pre', {});
  const codeEl = el('code', { class: 'language-python' });
  codeEl.textContent = code;                 // safe: raw text, highlighted later
  const btn = el('button', { class: 'btn sm copy-btn', text: 'Copy' });
  btn.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(code); btn.textContent = 'Copied!'; setTimeout(() => btn.textContent = 'Copy', 1200); }
    catch { btn.textContent = 'Copy failed'; }
  });
  pre.append(btn, codeEl);
  return pre;
}

function statusControls(id) {
  const wrap = el('div', { class: 'card' });
  const cur = store.getProblem(id);
  const isSolved = cur.status === 'solved';
  const needsRevision = !!cur.revision;

  const solvedBtn = el('button', {
    class: 'btn' + (isSolved ? ' primary' : ''),
    text: isSolved ? '✓ Solved' : 'Mark as Solved',
  });
  solvedBtn.addEventListener('click', () => {
    store.setStatus(id, isSolved ? 'not-started' : 'solved');
    rerender();
  });

  const bookmarkBtn = el('button', {
    class: 'btn' + (needsRevision ? ' primary' : ''),
    text: needsRevision ? '⭐ Remove Bookmark' : '⭐ Bookmark',
  });
  bookmarkBtn.addEventListener('click', () => {
    if (needsRevision) {
      store.clearRevision(id);
    } else {
      store.addRevision(id);
    }
    rerender();
  });

  wrap.append(el('div', { class: 'btn-row' }, solvedBtn, bookmarkBtn));

  // Notes — USER INPUT: value goes in via .value (safe), never as html.
  const ta = el('textarea', { placeholder: 'Your notes (gotchas, what tripped you up)…' });
  ta.value = cur.notes || '';
  ta.addEventListener('change', () => store.setNotes(id, ta.value));
  wrap.append(el('label', { text: 'Notes' }), ta);
  return wrap;

  function rerender() { const fresh = statusControls(id); wrap.replaceWith(fresh); }
}

function escapeInline(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
