import { el, mount } from '../dom.js';
import { getManifest } from '../data.js';
import { store } from '../store.js';

export async function phaseView(app, { id }) {
  const m = await getManifest();
  const phase = m.phases.find(p => String(p.id) === String(id));
  if (!phase) throw new Error('Phase not found');
  store.markPhaseStarted(phase.id);

  const patterns = m.patterns.filter(p => p.phaseId === phase.id);
  const nodes = [
    el('div', { class: 'crumbs' }, el('a', { href: '#/', text: 'Roadmap' }), ' / ', `Phase ${phase.id}`),
    el('h1', { text: phase.title }),
    phase.goal && el('p', { class: 'muted', text: phase.goal }),
  ];

  for (const pat of patterns) {
    const patternIds = m.problemIndex.filter(p => p.patternId === pat.id);
    const solved = patternIds.filter(p => store.getProblem(p.id).status === 'solved').length;
    const card = el('a', { class: 'card link', href: `#/pattern/${pat.id}` },
      el('div', { class: 'phase-head' },
        el('h2', { text: pat.name, style: 'margin:0;font-size:1.1rem' }),
        el('span', { class: 'muted small', text: `${solved}/${patternIds.length}` }),
      ),
      pat.tagline && el('p', { class: 'muted small', text: pat.tagline, style: 'margin:6px 0 0' }),
    );
    nodes.push(card);
  }
  mount(app, nodes.filter(Boolean));
}
