import { el, mount } from '../dom.js';
import { store } from '../store.js';

export function onboardingView(app) {
  let name = '';

  function render() {
    mount(app, el('div', { class: 'onboarding' },
      el('div', { class: 'card', style: 'max-width: 500px; margin: 100px auto; text-align: center;' },
        el('h1', { text: '👋 Welcome!' }),
        el('p', { class: 'muted', text: 'Master DSA patterns one at a time. Learn the concept first, then solve curated problems.' }),
        el('div', { style: 'margin: 30px 0;' },
          el('label', { style: 'display: block; margin-bottom: 10px; font-weight: 600;', text: 'What should we call you?' }),
          el('input', {
            type: 'text',
            placeholder: 'Your name',
            value: name,
            style: 'width: 100%; padding: 12px; font-size: 16px; border: 1px solid #ddd; border-radius: 8px;',
            oninput: (e) => { name = e.target.value; }
          })
        ),
        el('button', {
          class: 'btn primary',
          text: "Let's Start",
          style: 'padding: 12px 32px; font-size: 16px;',
          onclick: () => {
            const finalName = name.trim() || 'there';
            store.setSettings({ name: finalName });
            store.progress.user = finalName;
            store._persist();
            location.hash = '#/';
          }
        })
      )
    ));
  }

  render();
}
