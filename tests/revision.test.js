// revision.test.js — unit tests for revision logic
import { describe, it, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// Mock store
class MockStore {
  constructor() {
    this.progress = {
      version: 1,
      user: 'Test',
      updatedAt: new Date().toISOString(),
      problems: {},
      revisionBestStreak: 0
    };
  }

  getProblem(id) {
    return this.progress.problems[id] || { status: 'not-started', attempts: 0 };
  }

  getRevisionData(id) {
    const p = this.progress.problems[id] || (this.progress.problems[id] = { status: 'not-started', attempts: 0 });
    if (!p.revision) p.revision = { correct: 0, incorrect: 0, lastAnswered: null };
    return p.revision;
  }

  recordRevisionAnswer(id, isCorrect) {
    const p = this.getProblem(id);
    if (!this.progress.problems[id]) this.progress.problems[id] = p;
    if (!p.revision) p.revision = { correct: 0, incorrect: 0, lastAnswered: null };
    if (isCorrect) p.revision.correct++;
    else p.revision.incorrect++;
    p.revision.lastAnswered = new Date().toISOString();
  }

  getRevisionStats() {
    let totalCorrect = 0, totalIncorrect = 0;
    for (const p of Object.values(this.progress.problems)) {
      if (p.revision) {
        totalCorrect += p.revision.correct;
        totalIncorrect += p.revision.incorrect;
      }
    }
    const total = totalCorrect + totalIncorrect;
    const accuracy = total > 0 ? Math.round((totalCorrect / total) * 100) : 0;
    const bestStreak = this.progress.revisionBestStreak || 0;
    return { totalAttempted: total, accuracy, bestStreak };
  }

  updateRevisionBestStreak(streak) {
    if (!this.progress.revisionBestStreak || streak > this.progress.revisionBestStreak) {
      this.progress.revisionBestStreak = streak;
    }
  }
}

// Revision logic functions (extracted from revision.js for testing)
function applyDifficultyFilter(pool, mode, selectedDifficulties) {
  if (mode === 'include') {
    if (selectedDifficulties.size === 0) return [];
    return pool.filter(p => selectedDifficulties.has(p.difficulty));
  } else {
    // Exclude mode: check if ALL difficulties are excluded
    const allDifficulties = new Set(['Easy', 'Medium', 'Hard']);
    if (selectedDifficulties.size === allDifficulties.size &&
        [...allDifficulties].every(d => selectedDifficulties.has(d))) {
      return []; // Excluding everything = no problems
    }
    return pool.filter(p => !selectedDifficulties.has(p.difficulty));
  }
}

function applyPatternFilter(pool, mode, selectedPatterns, allPatternIds) {
  if (mode === 'include') {
    if (selectedPatterns.size === 0) return [];
    return pool.filter(p => selectedPatterns.has(p.patternId));
  } else {
    // Exclude mode: check if ALL patterns are excluded
    if (allPatternIds && selectedPatterns.size === allPatternIds.size &&
        [...allPatternIds].every(id => selectedPatterns.has(id))) {
      return []; // Excluding everything = no problems
    }
    return pool.filter(p => !selectedPatterns.has(p.patternId));
  }
}

function applyModeFilter(pool, mode, store) {
  if (mode === 'solved') {
    return pool.filter(p => store.getProblem(p.id).status === 'solved');
  } else if (mode === 'solved-patterns') {
    const solvedPatterns = new Set();
    pool.forEach(p => {
      if (store.getProblem(p.id).status === 'solved') {
        solvedPatterns.add(p.patternId);
      }
    });
    return pool.filter(p => solvedPatterns.has(p.patternId));
  }
  return pool;
}

function getReviewInterval(correctCount) {
  const intervals = [1, 3, 7, 14, 30];
  return intervals[Math.min(correctCount, intervals.length - 1)];
}

function calculateWeight(problem, store) {
  const revision = store.getRevisionData(problem.id);
  let weight = 1;

  // Boost if due for review
  if (revision.lastAnswered && revision.correct > 0) {
    const daysSince = (Date.now() - new Date(revision.lastAnswered)) / 86400000;
    const interval = getReviewInterval(revision.correct);
    if (daysSince >= interval) weight += 5;
  }

  // Boost if recently incorrect
  if (revision.incorrect > 0 && revision.lastAnswered) {
    const daysSince = (Date.now() - new Date(revision.lastAnswered)) / 86400000;
    if (daysSince < 3) weight += 3;
  }

  // Slightly boost never-attempted
  if (!revision.lastAnswered) weight += 1;

  return weight;
}

function setsEqual(a, b) {
  if (a.size !== b.size) return false;
  for (const item of a) if (!b.has(item)) return false;
  return true;
}

function scoreDistractor(distractor, problem) {
  let score = 0;
  if (distractor.problemId === problem.id) return -1000; // never use from same problem
  if (distractor.patternId === problem.patternId) score += 2;
  if (distractor.difficulty === problem.difficulty) score += 1;
  return score;
}

// Test data
const mockProblems = [
  {
    id: 'two-sum',
    title: 'Two Sum',
    difficulty: 'Easy',
    patternId: 'hashing',
    leetcodeSlug: 'two-sum',
    solutions: [
      { label: 'Brute force', timeComplexity: 'O(n²)', keyIdea: 'Nested loops' },
      { label: 'Optimal — HashMap', timeComplexity: 'O(n)', keyIdea: 'Store complements' }
    ]
  },
  {
    id: 'valid-anagram',
    title: 'Valid Anagram',
    difficulty: 'Easy',
    patternId: 'hashing',
    leetcodeSlug: 'valid-anagram',
    solutions: [
      { label: 'Counter', timeComplexity: 'O(n)', keyIdea: 'Frequency maps' },
      { label: 'Sort', timeComplexity: 'O(n log n)', keyIdea: 'Sorted forms match' }
    ]
  },
  {
    id: 'reverse-linked-list',
    title: 'Reverse Linked List',
    difficulty: 'Easy',
    patternId: 'linked-list',
    leetcodeSlug: 'reverse-linked-list',
    solutions: [
      { label: 'Iterative', timeComplexity: 'O(n)', keyIdea: 'Three pointers' }
    ]
  },
  {
    id: 'coin-change',
    title: 'Coin Change',
    difficulty: 'Medium',
    patternId: 'dp-1d',
    leetcodeSlug: 'coin-change',
    solutions: [
      { label: 'DP bottom-up', timeComplexity: 'O(n·m)', keyIdea: 'Min coins for each amount' }
    ]
  },
  {
    id: 'longest-increasing-subsequence',
    title: 'Longest Increasing Subsequence',
    difficulty: 'Medium',
    patternId: 'dp-1d',
    leetcodeSlug: 'longest-increasing-subsequence',
    solutions: [
      { label: 'DP', timeComplexity: 'O(n²)', keyIdea: 'LIS ending at i' },
      { label: 'Binary search', timeComplexity: 'O(n log n)', keyIdea: 'Patience sorting' }
    ]
  }
];

describe('Revision Store Methods', () => {
  let store;

  beforeEach(() => {
    store = new MockStore();
  });

  it('should initialize revision data for new problem', () => {
    const revision = store.getRevisionData('two-sum');
    assert.equal(revision.correct, 0);
    assert.equal(revision.incorrect, 0);
    assert.equal(revision.lastAnswered, null);
  });

  it('should record correct answer', () => {
    store.recordRevisionAnswer('two-sum', true);
    const revision = store.getRevisionData('two-sum');
    assert.equal(revision.correct, 1);
    assert.equal(revision.incorrect, 0);
    assert.ok(revision.lastAnswered);
  });

  it('should record incorrect answer', () => {
    store.recordRevisionAnswer('two-sum', false);
    const revision = store.getRevisionData('two-sum');
    assert.equal(revision.correct, 0);
    assert.equal(revision.incorrect, 1);
    assert.ok(revision.lastAnswered);
  });

  it('should calculate revision stats correctly', () => {
    store.recordRevisionAnswer('two-sum', true);
    store.recordRevisionAnswer('valid-anagram', false);
    store.recordRevisionAnswer('coin-change', true);

    const stats = store.getRevisionStats();
    assert.equal(stats.totalAttempted, 3);
    assert.equal(stats.accuracy, 67); // 2/3 = 66.666... → 67
  });

  it('should update best streak', () => {
    store.updateRevisionBestStreak(5);
    assert.equal(store.progress.revisionBestStreak, 5);

    store.updateRevisionBestStreak(3); // should not decrease
    assert.equal(store.progress.revisionBestStreak, 5);

    store.updateRevisionBestStreak(8); // should increase
    assert.equal(store.progress.revisionBestStreak, 8);
  });
});

describe('Difficulty Filter', () => {
  it('should include selected difficulties', () => {
    const selected = new Set(['Easy', 'Medium']);
    const result = applyDifficultyFilter(mockProblems, 'include', selected);
    assert.equal(result.length, 5); // all 5 are Easy or Medium
    assert.ok(result.every(p => selected.has(p.difficulty)));
  });

  it('should exclude selected difficulties', () => {
    const selected = new Set(['Easy']);
    const result = applyDifficultyFilter(mockProblems, 'exclude', selected);
    assert.equal(result.length, 2); // 2 Medium problems
    assert.ok(result.every(p => p.difficulty === 'Medium'));
  });

  it('should return empty array when include mode has no selection', () => {
    const selected = new Set();
    const result = applyDifficultyFilter(mockProblems, 'include', selected);
    assert.equal(result.length, 0);
  });

  it('should return all when exclude mode has no selection', () => {
    const selected = new Set();
    const result = applyDifficultyFilter(mockProblems, 'exclude', selected);
    assert.equal(result.length, mockProblems.length);
  });

  it('should return empty when exclude mode has ALL difficulties selected', () => {
    const selected = new Set(['Easy', 'Medium', 'Hard']);
    const result = applyDifficultyFilter(mockProblems, 'exclude', selected);
    assert.equal(result.length, 0);
  });
});

describe('Pattern Filter', () => {
  it('should include selected patterns', () => {
    const selected = new Set(['hashing']);
    const result = applyPatternFilter(mockProblems, 'include', selected);
    assert.equal(result.length, 2); // two-sum, valid-anagram
    assert.ok(result.every(p => p.patternId === 'hashing'));
  });

  it('should exclude selected patterns', () => {
    const selected = new Set(['hashing']);
    const result = applyPatternFilter(mockProblems, 'exclude', selected);
    assert.equal(result.length, 3); // everything except hashing
    assert.ok(result.every(p => p.patternId !== 'hashing'));
  });

  it('should return empty array when include mode has no selection', () => {
    const selected = new Set();
    const result = applyPatternFilter(mockProblems, 'include', selected);
    assert.equal(result.length, 0);
  });

  it('should return empty when exclude mode has ALL patterns selected', () => {
    const allPatternIds = new Set(['hashing', 'linked-list', 'dp-1d']);
    const result = applyPatternFilter(mockProblems, 'exclude', allPatternIds, allPatternIds);
    assert.equal(result.length, 0);
  });
});

describe('Mode Filter', () => {
  let store;

  beforeEach(() => {
    store = new MockStore();
    store.progress.problems['two-sum'] = { status: 'solved', attempts: 2 };
    store.progress.problems['valid-anagram'] = { status: 'solved', attempts: 1 };
    store.progress.problems['coin-change'] = { status: 'attempted', attempts: 1 };
  });

  it('should return all problems in "all" mode', () => {
    const result = applyModeFilter(mockProblems, 'all', store);
    assert.equal(result.length, mockProblems.length);
  });

  it('should return only solved problems in "solved" mode', () => {
    const result = applyModeFilter(mockProblems, 'solved', store);
    assert.equal(result.length, 2);
    assert.ok(result.every(p => ['two-sum', 'valid-anagram'].includes(p.id)));
  });

  it('should return all problems from solved patterns in "solved-patterns" mode', () => {
    const result = applyModeFilter(mockProblems, 'solved-patterns', store);
    // hashing pattern has 2 solved, so both hashing problems included
    assert.ok(result.some(p => p.id === 'two-sum'));
    assert.ok(result.some(p => p.id === 'valid-anagram'));
    // linked-list and dp-1d have no solved, so excluded
    assert.ok(!result.some(p => p.patternId === 'linked-list'));
  });
});

describe('Spaced Repetition', () => {
  it('should return correct review intervals', () => {
    assert.equal(getReviewInterval(0), 1);  // 1 day
    assert.equal(getReviewInterval(1), 3);  // 3 days
    assert.equal(getReviewInterval(2), 7);  // 1 week
    assert.equal(getReviewInterval(3), 14); // 2 weeks
    assert.equal(getReviewInterval(4), 30); // 1 month
    assert.equal(getReviewInterval(5), 30); // cap at 30
  });

  it('should boost weight for due problems', () => {
    const store = new MockStore();
    const problem = mockProblems[0];

    // Never attempted
    let weight = calculateWeight(problem, store);
    assert.equal(weight, 2); // base 1 + never-attempted 1

    // Correct 1 time, 3 days ago (interval=1, so due)
    const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString();
    store.progress.problems[problem.id] = {
      revision: { correct: 1, incorrect: 0, lastAnswered: threeDaysAgo }
    };
    weight = calculateWeight(problem, store);
    assert.ok(weight >= 6); // base 1 + due boost 5
  });

  it('should boost weight for recent mistakes', () => {
    const store = new MockStore();
    const problem = mockProblems[0];

    const yesterday = new Date(Date.now() - 86400000).toISOString();
    store.progress.problems[problem.id] = {
      revision: { correct: 0, incorrect: 1, lastAnswered: yesterday }
    };

    const weight = calculateWeight(problem, store);
    assert.ok(weight >= 4); // base 1 + recent mistake 3
  });
});

describe('Answer Checking', () => {
  it('should detect correct answers', () => {
    const correctIndices = new Set([0, 2, 4]);
    const selected = new Set([4, 0, 2]); // different order
    assert.ok(setsEqual(selected, correctIndices));
  });

  it('should detect incorrect answers with missing selections', () => {
    const correctIndices = new Set([0, 2, 4]);
    const selected = new Set([0, 2]); // missing 4
    assert.ok(!setsEqual(selected, correctIndices));
  });

  it('should detect incorrect answers with extra selections', () => {
    const correctIndices = new Set([0, 2]);
    const selected = new Set([0, 2, 4]); // extra 4
    assert.ok(!setsEqual(selected, correctIndices));
  });

  it('should handle empty sets', () => {
    assert.ok(setsEqual(new Set(), new Set()));
    assert.ok(!setsEqual(new Set([1]), new Set()));
  });
});

describe('Distractor Scoring', () => {
  const problem = {
    id: 'two-sum',
    patternId: 'hashing',
    difficulty: 'Easy'
  };

  it('should never use approaches from same problem', () => {
    const distractor = {
      problemId: 'two-sum',
      patternId: 'hashing',
      difficulty: 'Easy',
      label: 'Some approach'
    };
    const score = scoreDistractor(distractor, problem);
    assert.equal(score, -1000);
  });

  it('should prefer same pattern', () => {
    const samePattern = {
      problemId: 'valid-anagram',
      patternId: 'hashing',
      difficulty: 'Medium',
      label: 'Counter'
    };
    const diffPattern = {
      problemId: 'coin-change',
      patternId: 'dp-1d',
      difficulty: 'Medium',
      label: 'DP'
    };

    assert.ok(scoreDistractor(samePattern, problem) > scoreDistractor(diffPattern, problem));
  });

  it('should prefer same difficulty', () => {
    const sameDifficulty = {
      problemId: 'reverse-linked-list',
      patternId: 'linked-list',
      difficulty: 'Easy',
      label: 'Iterative'
    };
    const diffDifficulty = {
      problemId: 'coin-change',
      patternId: 'linked-list',
      difficulty: 'Medium',
      label: 'DP'
    };

    assert.ok(scoreDistractor(sameDifficulty, problem) > scoreDistractor(diffDifficulty, problem));
  });

  it('should prefer same pattern AND difficulty', () => {
    const both = {
      problemId: 'valid-anagram',
      patternId: 'hashing',
      difficulty: 'Easy',
      label: 'Counter'
    };
    const onlyPattern = {
      problemId: 'valid-anagram',
      patternId: 'hashing',
      difficulty: 'Medium',
      label: 'Counter'
    };
    const onlyDifficulty = {
      problemId: 'reverse-linked-list',
      patternId: 'linked-list',
      difficulty: 'Easy',
      label: 'Iterative'
    };

    assert.ok(scoreDistractor(both, problem) > scoreDistractor(onlyPattern, problem));
    assert.ok(scoreDistractor(both, problem) > scoreDistractor(onlyDifficulty, problem));
  });
});

describe('Integration: Full Filter Chain', () => {
  let store;

  beforeEach(() => {
    store = new MockStore();
    store.progress.problems['two-sum'] = { status: 'solved', attempts: 2 };
    store.progress.problems['valid-anagram'] = { status: 'solved', attempts: 1 };
  });

  it('should apply all filters correctly', () => {
    let pool = mockProblems.slice();

    // Mode: solved
    pool = applyModeFilter(pool, 'solved', store);
    assert.equal(pool.length, 2);

    // Difficulty: include Easy only
    pool = applyDifficultyFilter(pool, 'include', new Set(['Easy']));
    assert.equal(pool.length, 2); // both are Easy

    // Pattern: include hashing only
    pool = applyPatternFilter(pool, 'include', new Set(['hashing']));
    assert.equal(pool.length, 2); // both are hashing
  });

  it('should handle empty result at any filter stage', () => {
    let pool = mockProblems.slice();

    // Start with all problems
    assert.equal(pool.length, 5);

    // Mode: solved (2 problems)
    pool = applyModeFilter(pool, 'solved', store);
    assert.equal(pool.length, 2);

    // Difficulty: include Medium only → empty (all solved are Easy)
    pool = applyDifficultyFilter(pool, 'include', new Set(['Medium']));
    assert.equal(pool.length, 0);

    // Further filters should preserve empty
    pool = applyPatternFilter(pool, 'include', new Set(['hashing']));
    assert.equal(pool.length, 0);
  });
});
