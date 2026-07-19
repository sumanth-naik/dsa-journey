import { el, mount } from '../dom.js';
import { store } from '../store.js';
import * as sync from '../sync.js';

export function onboardingView(app) {
  let name = '';
  let error = '';

  function render() {
    mount(app, el('div', { class: 'onboarding' },
      el('div', { class: 'card', style: 'max-width: 500px; margin: 100px auto; text-align: center;' },
        el('h1', { text: '👋 Welcome!' }),
        el('p', { class: 'muted', text: 'Master DSA patterns one at a time. Learn the concept first, then solve curated problems.' }),

        el('div', { style: 'margin: 30px 0; text-align: left;' },
          el('label', { style: 'display: block; margin-bottom: 10px; font-weight: 600;', text: 'Choose your name' }),
          el('input', {
            type: 'text',
            placeholder: 'Enter your name',
            value: name,
            style: 'width: 100%; padding: 12px; font-size: 16px; border: 1px solid var(--border); border-radius: 8px; background: var(--bg-elev); color: var(--text);',
            oninput: (e) => { name = e.target.value; error = ''; render(); }
          }),
          el('p', { class: 'muted small', style: 'margin-top: 8px;', text: 'Your progress will automatically sync across all your devices.' })
        ),

        error ? el('p', { style: 'color: var(--red); margin: 16px 0;', text: error }) : null,

        el('button', {
          class: 'btn primary',
          text: 'Get Started',
          style: 'padding: 12px 32px; font-size: 16px;',
          onclick: async () => {
            const finalName = name.trim();

            if (!finalName) {
              error = 'Please enter your name to continue.';
              render();
              return;
            }

            // Check if name is taken
            const taken = await sync.checkNameCollision(finalName);
            if (taken) {
              error = `Name "${finalName}" is already taken. Choose another.`;
              render();
              return;
            }

            store.setSettings({ name: finalName });
            store.progress.user = finalName;
            store._persist();

            // Auto-sync
            await sync.findOrCreateGist();
            await sync.pull();

            location.hash = '#/';
          }
        })
      )
    ));
  }

  render();
}
