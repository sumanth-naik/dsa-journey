import { el, mount } from '../dom.js';
import { getManifest } from '../data.js';
import { store } from '../store.js';

export async function dashboardView(app) {
  const m = await getManifest();
  const counts = store.counts();
  const due = store.dueForRevision();

  const nodes = [el('h1', { text: '📊 Progress' })];

  const total = m.problemIndex.length;
  const currentStreak = store.streak();
  const longestStreak = store.longestStreak();

  nodes.push(el('div', { class: 'stat-row' },
    stat(counts.solved || 0, 'Solved'),
    stat(total - (counts.solved || 0), 'Remaining'),
    stat(currentStreak, 'Day streak 🔥'),
  ));

  // Streak calendar
  nodes.push(el('div', { class: 'card' },
    el('h2', { text: '🔥 Your Streak' }),
    el('div', { class: 'streak-stats' },
      el('div', { class: 'streak-stat' },
        el('div', { class: 'streak-number', text: currentStreak.toString() }),
        el('div', { class: 'streak-label', text: 'Current Streak' })
      ),
      el('div', { class: 'streak-stat' },
        el('div', { class: 'streak-number', text: longestStreak.toString() }),
        el('div', { class: 'streak-label', text: 'Longest Streak' })
      ),
      el('div', { class: 'streak-stat' },
        el('div', { class: 'streak-number', text: getActiveDaysCount().toString() }),
        el('div', { class: 'streak-label', text: 'Active Days' })
      )
    ),
    renderCalendar()
  ));

  // Coverage by pattern (heatmap-ish)
  nodes.push(el('h2', { text: 'Coverage by pattern' }));
  const heat = el('div', { class: 'heat' });
  for (const pat of m.patterns) {
    const ids = m.problemIndex.filter(p => p.patternId === pat.id).map(p => p.id);
    const solved = ids.filter(id => store.getProblem(id).status === 'solved').length;
    const pct = ids.length ? solved / ids.length : 0;
    const bg = 'color-mix(in srgb, var(--green) ' + Math.round(pct * 100) + '%, var(--bg-elev))';
    heat.append(el('a', { class: 'cell', href: '#/pattern/' + pat.id, style: 'background:' + bg },
      el('div', { text: pat.name, style: 'font-weight:600' }),
      el('div', { class: 'muted small', text: solved + '/' + ids.length })));
  }
  nodes.push(heat);

  // Due for revision
  if (due.length > 0) {
    nodes.push(el('h2', { text: 'Due for revision (' + due.length + ')' }));
    const list = el('div', { class: 'card' });
    for (const d of due) {
      const entry = m.problemIndex.find(p => p.id === d.id);
      if (!entry) continue;
      list.append(el('a', { class: 'prob-row', href: '#/problem/' + d.id },
        el('span', { class: 'status-dot solved' }),
        el('span', { class: 'title', text: entry.title }),
        el('span', { class: 'muted small', text: 'due ' + new Date(d.due).toLocaleDateString() })));
    }
    nodes.push(list);
  }

  mount(app, nodes);
}

function stat(n, label) {
  return el('div', { class: 'stat' }, el('div', { class: 'n', text: String(n) }), el('div', { class: 'l', text: label }));
}

function getActiveDaysCount() {
  const days = new Set();
  for (const p of Object.values(store.progress.problems)) {
    for (const t of [p.firstAttemptedAt, p.solvedAt, p.updatedAt]) {
      if (t) {
        const date = new Date(t);
        date.setHours(0, 0, 0, 0);
        days.add(date.toISOString().split('T')[0]);
      }
    }
  }
  return days.size;
}

function renderCalendar() {
  const container = el('div', { class: 'calendar-heatmap' });
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Build activity map
  const activityMap = {};
  for (const p of Object.values(store.progress.problems)) {
    if (p.solvedAt) {
      const date = new Date(p.solvedAt);
      date.setHours(0, 0, 0, 0);
      const key = date.toISOString().split('T')[0];
      activityMap[key] = (activityMap[key] || 0) + 1;
    }
    if (p.updatedAt && p.status !== 'not-started') {
      const date = new Date(p.updatedAt);
      date.setHours(0, 0, 0, 0);
      const key = date.toISOString().split('T')[0];
      if (!activityMap[key]) activityMap[key] = 0;
    }
  }

  // Calculate start date (12 months ago, Sunday)
  const startDate = new Date(today);
  startDate.setMonth(startDate.getMonth() - 12);
  startDate.setDate(startDate.getDate() - startDate.getDay());

  // Month labels
  const monthLabels = el('div', { class: 'calendar-months' });
  let currentMonth = null;
  const weeks = [];
  let currentWeek = [];

  const date = new Date(startDate);
  while (date <= today) {
    const monthName = date.toLocaleDateString('en-US', { month: 'short' });
    if (monthName !== currentMonth) {
      currentMonth = monthName;
      if (currentWeek.length > 0 && date.getDay() === 0) {
        monthLabels.append(el('span', { text: monthName, style: `grid-column: ${weeks.length + 1}` }));
      }
    }

    const key = date.toISOString().split('T')[0];
    const count = activityMap[key] || 0;
    const level = count === 0 ? 0 : count === 1 ? 1 : count <= 3 ? 2 : count <= 5 ? 3 : 4;

    const cell = el('div', {
      class: `calendar-day level-${level}`,
      title: `${key}: ${count} problem${count !== 1 ? 's' : ''}`,
    });

    currentWeek.push(cell);

    if (date.getDay() === 6) {
      weeks.push(currentWeek);
      currentWeek = [];
    }

    date.setDate(date.getDate() + 1);
  }

  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  container.append(monthLabels);

  // Day labels
  const dayLabels = el('div', { class: 'calendar-days' },
    el('span', { text: 'Mon', style: 'grid-row: 2' }),
    el('span', { text: 'Wed', style: 'grid-row: 4' }),
    el('span', { text: 'Fri', style: 'grid-row: 6' })
  );
  container.append(dayLabels);

  // Grid
  const grid = el('div', { class: 'calendar-grid' });
  weeks.forEach(week => {
    const weekCol = el('div', { class: 'calendar-week' });
    week.forEach(day => weekCol.append(day));
    grid.append(weekCol);
  });
  container.append(grid);

  // Legend
  const legend = el('div', { class: 'calendar-legend' },
    el('span', { text: 'Less', class: 'legend-label' }),
    el('div', { class: 'calendar-day level-0' }),
    el('div', { class: 'calendar-day level-1' }),
    el('div', { class: 'calendar-day level-2' }),
    el('div', { class: 'calendar-day level-3' }),
    el('div', { class: 'calendar-day level-4' }),
    el('span', { text: 'More', class: 'legend-label' })
  );
  container.append(legend);

  return container;
}
