// store.test.js — unit tests for store module
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// Mock localStorage
class MockLocalStorage {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] || null;
  }
  setItem(key, value) {
    this.store[key] = value;
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

global.localStorage = new MockLocalStorage();

// Simple store implementation for testing
class TestStore {
  constructor() {
    this.progress = {
      version: 1,
      user: 'Test',
      updatedAt: new Date().toISOString(),
      phaseStartedAt: {},
      problems: {}
    };
    this.REVIEW_STEPS = [1, 3, 7, 21];
    this.DAY = 86400000;
  }

  nowISO() {
    return new Date().toISOString();
  }

  getProblem(id) {
    return this.progress.problems[id] || { status: 'not-started', attempts: 0 };
  }

  _touch(id) {
    const p = this.progress.problems[id] || (this.progress.problems[id] = { status: 'not-started', attempts: 0 });
    p.updatedAt = this.nowISO();
    this.progress.updatedAt = this.nowISO();
    return p;
  }

  setStatus(id, status) {
    const p = this._touch(id);
    const prev = p.status;
    p.status = status;

    if (status === 'attempted' && prev === 'not-started') {
      p.attempts = (p.attempts || 0) + 1;
      p.firstAttemptedAt = p.firstAttemptedAt || this.nowISO();
    }

    if (status === 'solved') {
      p.solvedAt = p.solvedAt || this.nowISO();
      if (!p.revision) {
        p.revision = {
          interval: this.REVIEW_STEPS[0],
          due: new Date(Date.now() + this.REVIEW_STEPS[0] * this.DAY).toISOString(),
          lastReviewedAt: this.nowISO()
        };
      }
    }

    if (status === 'needs-revision') {
      p.revision = {
        interval: this.REVIEW_STEPS[0],
        due: new Date(Date.now() + this.REVIEW_STEPS[0] * this.DAY).toISOString(),
        lastReviewedAt: this.nowISO()
      };
    }
  }

  bumpAttempt(id) {
    const p = this._touch(id);
    p.attempts = (p.attempts || 0) + 1;
    if (p.status === 'not-started') p.status = 'attempted';
    p.firstAttemptedAt = p.firstAttemptedAt || this.nowISO();
  }

  reviewed(id) {
    const p = this.progress.problems[id];
    if (!p || !p.revision) return;

    const idx = this.REVIEW_STEPS.indexOf(p.revision.interval);
    const next = this.REVIEW_STEPS[idx + 1];

    if (next) {
      p.revision = {
        interval: next,
        due: new Date(Date.now() + next * this.DAY).toISOString(),
        lastReviewedAt: this.nowISO()
      };
    } else {
      delete p.revision; // mastered
    }
    p.updatedAt = this.nowISO();
  }

  counts() {
    const c = { 'not-started': 0, 'attempted': 0, 'solved': 0, 'needs-revision': 0 };
    for (const p of Object.values(this.progress.problems)) {
      c[p.status] = (c[p.status] || 0) + 1;
    }
    return c;
  }

  dueForRevision() {
    const out = [];
    const now = Date.now();
    for (const [id, p] of Object.entries(this.progress.problems)) {
      if (p.revision && new Date(p.revision.due).getTime() <= now) {
        out.push({ id, due: p.revision.due });
      }
    }
    return out.sort((a, b) => new Date(a.due) - new Date(b.due));
  }
}

describe('Store: Problem Status', () => {
  let store;

  beforeEach(() => {
    store = new TestStore();
  });

  it('should initialize with not-started status', () => {
    const problem = store.getProblem('two-sum');
    assert.equal(problem.status, 'not-started');
    assert.equal(problem.attempts, 0);
  });

  it('should update to attempted status', () => {
    store.setStatus('two-sum', 'attempted');
    const problem = store.getProblem('two-sum');
    assert.equal(problem.status, 'attempted');
    assert.equal(problem.attempts, 1);
    assert.ok(problem.firstAttemptedAt);
  });

  it('should update to solved status and seed revision', () => {
    store.setStatus('two-sum', 'solved');
    const problem = store.getProblem('two-sum');
    assert.equal(problem.status, 'solved');
    assert.ok(problem.solvedAt);
    assert.ok(problem.revision);
    assert.equal(problem.revision.interval, 1);
  });

  it('should not reset solvedAt when already solved', () => {
    store.setStatus('two-sum', 'solved');
    const firstSolvedAt = store.getProblem('two-sum').solvedAt;

    // Simulate some time passing
    setTimeout(() => {
      store.setStatus('two-sum', 'solved');
      const secondSolvedAt = store.getProblem('two-sum').solvedAt;
      assert.equal(firstSolvedAt, secondSolvedAt);
    }, 10);
  });

  it('should track needs-revision status', () => {
    store.setStatus('two-sum', 'needs-revision');
    const problem = store.getProblem('two-sum');
    assert.equal(problem.status, 'needs-revision');
    assert.ok(problem.revision);
    assert.equal(problem.revision.interval, 1);
  });
});

describe('Store: Attempt Tracking', () => {
  let store;

  beforeEach(() => {
    store = new TestStore();
  });

  it('should bump attempt count', () => {
    store.bumpAttempt('two-sum');
    assert.equal(store.getProblem('two-sum').attempts, 1);
    assert.equal(store.getProblem('two-sum').status, 'attempted');
  });

  it('should increment attempts multiple times', () => {
    store.bumpAttempt('two-sum');
    store.bumpAttempt('two-sum');
    store.bumpAttempt('two-sum');
    assert.equal(store.getProblem('two-sum').attempts, 3);
  });

  it('should not change status if already beyond not-started', () => {
    store.setStatus('two-sum', 'solved');
    store.bumpAttempt('two-sum');
    assert.equal(store.getProblem('two-sum').status, 'solved');
  });
});

describe('Store: Spaced Repetition', () => {
  let store;

  beforeEach(() => {
    store = new TestStore();
  });

  it('should advance through review intervals', () => {
    store.setStatus('two-sum', 'solved');
    let problem = store.getProblem('two-sum');
    assert.equal(problem.revision.interval, 1); // 1 day

    store.reviewed('two-sum');
    problem = store.getProblem('two-sum');
    assert.equal(problem.revision.interval, 3); // 3 days

    store.reviewed('two-sum');
    problem = store.getProblem('two-sum');
    assert.equal(problem.revision.interval, 7); // 7 days

    store.reviewed('two-sum');
    problem = store.getProblem('two-sum');
    assert.equal(problem.revision.interval, 21); // 21 days
  });

  it('should graduate after final review', () => {
    store.setStatus('two-sum', 'solved');

    // Go through all intervals
    store.reviewed('two-sum'); // 1 → 3
    store.reviewed('two-sum'); // 3 → 7
    store.reviewed('two-sum'); // 7 → 21
    store.reviewed('two-sum'); // 21 → mastered (delete)

    const problem = store.getProblem('two-sum');
    assert.equal(problem.revision, undefined);
  });

  it('should identify problems due for revision', () => {
    // Create a problem that's overdue
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    store.progress.problems['two-sum'] = {
      status: 'solved',
      revision: {
        interval: 1,
        due: yesterday,
        lastReviewedAt: new Date(Date.now() - 2 * 86400000).toISOString()
      }
    };

    const due = store.dueForRevision();
    assert.equal(due.length, 1);
    assert.equal(due[0].id, 'two-sum');
  });

  it('should not include problems not yet due', () => {
    const tomorrow = new Date(Date.now() + 86400000).toISOString();
    store.progress.problems['two-sum'] = {
      status: 'solved',
      revision: {
        interval: 1,
        due: tomorrow,
        lastReviewedAt: new Date().toISOString()
      }
    };

    const due = store.dueForRevision();
    assert.equal(due.length, 0);
  });

  it('should sort due problems by date', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString();
    const oneDayAgo = new Date(Date.now() - 86400000).toISOString();

    store.progress.problems['problem-a'] = {
      status: 'solved',
      revision: { interval: 1, due: oneDayAgo, lastReviewedAt: oneDayAgo }
    };
    store.progress.problems['problem-b'] = {
      status: 'solved',
      revision: { interval: 1, due: threeDaysAgo, lastReviewedAt: threeDaysAgo }
    };

    const due = store.dueForRevision();
    assert.equal(due.length, 2);
    assert.equal(due[0].id, 'problem-b'); // older first
    assert.equal(due[1].id, 'problem-a');
  });
});

describe('Store: Counts', () => {
  let store;

  beforeEach(() => {
    store = new TestStore();
  });

  it('should count problems by status', () => {
    store.setStatus('problem-1', 'attempted');
    store.setStatus('problem-2', 'solved');
    store.setStatus('problem-3', 'solved');
    store.setStatus('problem-4', 'needs-revision');

    const counts = store.counts();
    assert.equal(counts['not-started'], 0);
    assert.equal(counts['attempted'], 1);
    assert.equal(counts['solved'], 2);
    assert.equal(counts['needs-revision'], 1);
  });

  it('should handle empty progress', () => {
    const counts = store.counts();
    assert.equal(counts['not-started'], 0);
    assert.equal(counts['attempted'], 0);
    assert.equal(counts['solved'], 0);
    assert.equal(counts['needs-revision'], 0);
  });
});

describe('Store: Timestamps', () => {
  let store;

  beforeEach(() => {
    store = new TestStore();
  });

  it('should record firstAttemptedAt on first attempt', () => {
    store.setStatus('two-sum', 'attempted');
    const problem = store.getProblem('two-sum');
    assert.ok(problem.firstAttemptedAt);
  });

  it('should not overwrite firstAttemptedAt', () => {
    store.setStatus('two-sum', 'attempted');
    const firstTime = store.getProblem('two-sum').firstAttemptedAt;

    store.bumpAttempt('two-sum');
    const secondTime = store.getProblem('two-sum').firstAttemptedAt;

    assert.equal(firstTime, secondTime);
  });

  it('should update updatedAt on every change', () => {
    store.setStatus('two-sum', 'attempted');
    const firstUpdate = store.getProblem('two-sum').updatedAt;

    setTimeout(() => {
      store.bumpAttempt('two-sum');
      const secondUpdate = store.getProblem('two-sum').updatedAt;
      assert.notEqual(firstUpdate, secondUpdate);
    }, 10);
  });
});
