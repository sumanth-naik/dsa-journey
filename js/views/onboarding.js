import { el, mount } from '../dom.js';
import { store } from '../store.js';
import * as sync from '../sync.js';

export function onboardingView(app) {
  let name = '';
  let token = '';
  let error = '';

  function render() {
    mount(app, el('div', { class: 'onboarding' },
      el('div', { class: 'card', style: 'max-width: 500px; margin: 100px auto; text-align: center;' },
        el('h1', { text: '👋 Welcome!' }),
        el('p', { class: 'muted', text: 'Master DSA patterns one at a time. Learn the concept first, then solve curated problems.' }),

        el('div', { style: 'margin: 30px 0; text-align: left;' },
          el('label', { style: 'display: block; margin-bottom: 10px; font-weight: 600;', text: 'Name' }),
          el('input', {
            type: 'text',
            placeholder: 'Your name (optional)',
            value: name,
            style: 'width: 100%; padding: 12px; font-size: 16px; border: 1px solid var(--border); border-radius: 8px; background: var(--bg-elev); color: var(--text);',
            oninput: (e) => { name = e.target.value; }
          })
        ),

        el('div', { style: 'margin: 30px 0; text-align: left;' },
          el('label', { style: 'display: block; margin-bottom: 10px; font-weight: 600;', text: 'Or GitHub token' }),
          el('input', {
            type: 'password',
            placeholder: 'github_pat_… (leave empty to skip)',
            value: token,
            style: 'width: 100%; padding: 12px; font-size: 16px; border: 1px solid var(--border); border-radius: 8px; background: var(--bg-elev); color: var(--text);',
            oninput: (e) => { token = e.target.value; }
          }),
          el('p', { class: 'muted small', style: 'margin-top: 8px;', text: 'Paste your token to sync progress across devices, or skip and add later in Settings.' })
        ),

        error ? el('p', { style: 'color: var(--red); margin: 16px 0;', text: error }) : null,

        el('button', {
          class: 'btn primary',
          text: 'Get Started',
          style: 'padding: 12px 32px; font-size: 16px;',
          onclick: async () => {
            const finalName = name.trim();
            const finalToken = token.trim();

            // Require at least one
            if (!finalName && !finalToken) {
              error = 'Please enter your name or paste a token to continue.';
              render();
              return;
            }

            store.setSettings({ name: finalName || 'there' });
            store.progress.user = finalName || 'there';

            if (finalToken) {
              store.setToken(finalToken);
              // Try to sync with the token
              await sync.findOrCreateGist();
              await sync.pull();
            }

            store._persist();
            location.hash = '#/';
          }
        })
      )
    ));
  }

  render();
}
