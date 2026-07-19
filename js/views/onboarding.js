import { el, mount } from '../dom.js';
import { store } from '../store.js';
import * as sync from '../sync.js';

export function onboardingView(app) {
  let name = '';
  let token = '';

  function render() {
    mount(app, el('div', { class: 'onboarding' },
      el('div', { class: 'card', style: 'max-width: 500px; margin: 100px auto; text-align: center;' },
        el('h1', { text: '👋 Welcome!' }),
        el('p', { class: 'muted', text: 'Master DSA patterns one at a time. Learn the concept first, then solve curated problems.' }),

        el('div', { style: 'margin: 30px 0; text-align: left;' },
          el('label', { style: 'display: block; margin-bottom: 10px; font-weight: 600;', text: 'What should we call you?' }),
          el('input', {
            type: 'text',
            placeholder: 'Your name',
            value: name,
            style: 'width: 100%; padding: 12px; font-size: 16px; border: 1px solid var(--border); border-radius: 8px; background: var(--bg-elev); color: var(--text);',
            oninput: (e) => { name = e.target.value; }
          })
        ),

        el('div', { style: 'margin: 30px 0; text-align: left;' },
          el('label', { style: 'display: block; margin-bottom: 10px; font-weight: 600;', text: 'GitHub token (optional - for cross-device sync)' }),
          el('input', {
            type: 'password',
            placeholder: 'github_pat_… (leave empty to skip)',
            value: token,
            style: 'width: 100%; padding: 12px; font-size: 16px; border: 1px solid var(--border); border-radius: 8px; background: var(--bg-elev); color: var(--text);',
            oninput: (e) => { token = e.target.value; }
          }),
          el('p', { class: 'muted small', style: 'margin-top: 8px;', text: 'If you have a token from another device, paste it here to sync your progress. Otherwise, you can add it later in Settings.' })
        ),

        el('button', {
          class: 'btn primary',
          text: "Let's Start",
          style: 'padding: 12px 32px; font-size: 16px;',
          onclick: async () => {
            const finalName = name.trim() || 'there';
            const finalToken = token.trim();

            store.setSettings({ name: finalName });
            store.progress.user = finalName;

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
