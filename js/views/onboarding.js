import { el, mount } from '../dom.js';
import { store } from '../store.js';
import * as sync from '../sync.js';

export function onboardingView(app) {
  let name = '';
  let error = '';

  const errorEl = el('p', { style: 'color: var(--red); margin: 16px 0;' });

  const nameInput = el('input', {
    type: 'text',
    placeholder: 'Enter your name',
    style: 'width: 100%; padding: 12px; font-size: 16px; border: 1px solid var(--border); border-radius: 8px; background: var(--bg-elev); color: var(--text);',
    oninput: (e) => {
      name = e.target.value;
      error = '';
      errorEl.textContent = '';
    }
  });

  const submitBtn = el('button', {
    class: 'btn primary',
    text: 'Get Started',
    style: 'padding: 12px 32px; font-size: 16px;',
    onclick: async () => {
      const finalName = name.trim();

      if (!finalName) {
        error = 'Please enter your name to continue.';
        errorEl.textContent = error;
        errorEl.style.color = 'var(--red)';
        return;
      }

      // Check if name exists
      const exists = await sync.checkNameCollision(finalName);
      if (exists) {
        errorEl.textContent = `Welcome back! Loading your existing data...`;
        errorEl.style.color = 'var(--text-dim)';
      } else {
        errorEl.textContent = 'Creating your account...';
        errorEl.style.color = 'var(--text-dim)';
      }

      // Save name and sync (will find existing gist or create new)
      store.setSettings({ name: finalName });
      store.progress.user = finalName;
      store._persist();

      // Find existing gist or create new one
      await sync.findOrCreateGist();
      await sync.pull();

      location.hash = '#/';
    }
  });

  mount(app, el('div', { class: 'onboarding' },
    el('div', { class: 'card', style: 'max-width: 500px; margin: 100px auto; text-align: center;' },
      el('h1', { text: '👋 Welcome!' }),
      el('p', { class: 'muted', text: 'Master DSA patterns one at a time. Learn the concept first, then solve curated problems.' }),

      el('div', { style: 'margin: 30px 0; text-align: left;' },
        el('label', { style: 'display: block; margin-bottom: 10px; font-weight: 600;', text: 'Choose your name' }),
        nameInput,
        el('p', { class: 'muted small', style: 'margin-top: 8px;', text: 'Your progress will automatically sync across all your devices.' })
      ),

      errorEl,
      submitBtn
    )
  ));
}
