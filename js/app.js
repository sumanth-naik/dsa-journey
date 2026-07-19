// app.js — bootstrap: wire routes, start sync, start router.
import { route, startRouter } from './router.js';
import * as sync from './sync.js';
import { store } from './store.js';
import { homeView } from './views/home.js';
import { phaseView } from './views/phase.js';
import { patternView } from './views/pattern.js';
import { problemView } from './views/problem.js';
import { reviewView } from './views/review.js';
import { dashboardView } from './views/dashboard.js';
import { settingsView } from './views/settings.js';
import { searchView } from './views/search.js';
import { revisionView } from './views/revision.js';
import { onboardingView } from './views/onboarding.js';

route('#/', homeView);
route('#/onboarding', onboardingView);
route('#/phase/:id', phaseView);
route('#/pattern/:id', patternView);
route('#/problem/:id', problemView);
route('#/review', reviewView);
route('#/search', searchView);
route('#/revision', revisionView);
route('#/dashboard', dashboardView);
route('#/settings', settingsView);

sync.init();

// Check if first-time user
if (!store.settings.name || store.settings.name === 'Shirisha') {
  const isNew = !localStorage.getItem('dsa:progress');
  if (isNew) {
    location.hash = '#/onboarding';
  }
}

startRouter();
