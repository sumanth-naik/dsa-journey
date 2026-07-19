import { el, mount } from '../dom.js';
import { store } from '../store.js';

export function streakView(app) {
  const currentStreak = store.streak();
  const longestStreak = store.longestStreak();

  // Get activity data for the last 12 months
  const activityMap = {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Build activity map from problem history
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

  const nodes = [
    el('h1', { text: '🔥 Your Streak' }),
    el('div', { class: 'card' },
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
          el('div', { class: 'streak-number', text: Object.keys(activityMap).length.toString() }),
          el('div', { class: 'streak-label', text: 'Active Days' })
        )
      )
    )
  ];

  // Calendar heatmap (last 12 months)
  nodes.push(el('div', { class: 'card' },
    el('h2', { text: 'Activity' }),
    renderCalendar(activityMap, today)
  ));

  mount(app, nodes);
}

function renderCalendar(activityMap, today) {
  const container = el('div', { class: 'calendar-heatmap' });

  // Calculate start date (12 months ago, Sunday)
  const startDate = new Date(today);
  startDate.setMonth(startDate.getMonth() - 12);
  startDate.setDate(startDate.getDate() - startDate.getDay()); // Move to Sunday

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
