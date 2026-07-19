// revision.js — spaced-repetition revision with multi-select approach questions.
import { el, mount } from '../dom.js';
import { getManifest, getAllPatterns } from '../data.js';
import { store } from '../store.js';

const DISTRACTOR_POOL_SIZE = 4; // how many wrong options per question
const SESSION_LENGTHS = [3, 5, 10, 20];

export async function revisionView(app) {
  const manifest = await getManifest();
  const allPatterns = await getAllPatterns();

  // Build problem pool with approaches
  const problemPool = [];
  allPatterns.forEach(pattern => {
    pattern.problems.forEach(problem => {
      const correctApproaches = problem.solutions.map(s => ({
        label: s.label,
        timeComplexity: s.timeComplexity,
        keyIdea: s.keyIdea,
        isCorrect: true,
        problemId: problem.id
      }));
      problemPool.push({
        id: problem.id,
        title: problem.title,
        description: problem.description,
        difficulty: problem.difficulty,
        patternId: problem.patternId,
        leetcodeSlug: problem.leetcodeSlug,
        keyIdeas: problem.keyIdeas,
        hints: problem.hints,
        correctApproaches,
        allSolutions: problem.solutions
      });
    });
  });

  // Setup screen state
  let mode = 'all'; // all | solved | solved-patterns | bookmarked
  let sessionLength = 5;
  let difficultyFilterMode = 'include'; // include | exclude
  let selectedDifficulties = new Set(['Easy', 'Medium', 'Hard']); // Default: all selected
  let patternFilterMode = 'include'; // include | exclude
  let selectedPatterns = new Set(manifest.patterns.map(p => p.id)); // Default: all selected

  function renderSetup() {
    const stats = getRevisionStats();

    function updateView() {
      mount(app, renderSetup());
    }

    return el('div', { class: 'revision-setup' },
      el('div', { class: 'card' },
        el('h1', { text: '🎯 Revision — Flashcards' }),
        el('p', { class: 'muted', text: 'Review problem approaches and key ideas. Test yourself on which approach works for each problem.' })
      ),

      el('div', { class: 'card' },
        el('h3', { text: 'Mode' }),
        el('div', { class: 'revision-mode-grid' },
          modeButton('all', '📚 All Problems', `All ${problemPool.length} problems`),
          modeButton('solved', '✓ Solved Only', 'Only problems you\'ve solved'),
          modeButton('bookmarked', '⭐ Bookmarked', 'Problems you bookmarked'),
          modeButton('solved-patterns', '🎯 Solved Patterns', 'All problems from patterns you\'ve solved at least one in')
        )
      ),

      el('div', { class: 'card' },
        el('h3', { text: 'Session Length' }),
        el('div', { class: 'revision-length-grid' },
          ...SESSION_LENGTHS.map(len =>
            el('button', {
              class: `revision-option-btn ${sessionLength === len ? 'active' : ''}`,
              text: `${len} questions`,
              onclick: () => { sessionLength = len; updateView(); }
            })
          )
        )
      ),

      el('div', { class: 'card' },
        el('div', { class: 'revision-filter-header' },
          el('h3', { text: 'Difficulty Filter' }),
          el('button', {
            class: 'btn-reset',
            text: '↺ Reset',
            onclick: () => {
              selectedDifficulties = new Set(['Easy', 'Medium', 'Hard']);
              difficultyFilterMode = 'include';
              updateView();
            }
          })
        ),
        el('div', { class: 'revision-pattern-mode' },
          el('button', {
            class: `revision-pattern-mode-btn ${difficultyFilterMode === 'include' ? 'active' : ''}`,
            text: '✓ Include These',
            onclick: () => {
              difficultyFilterMode = 'include';
              selectedDifficulties = new Set(['Easy', 'Medium', 'Hard']); // Reset to all for include
              updateView();
            }
          }),
          el('button', {
            class: `revision-pattern-mode-btn ${difficultyFilterMode === 'exclude' ? 'active' : ''}`,
            text: '✗ Exclude These',
            onclick: () => {
              difficultyFilterMode = 'exclude';
              selectedDifficulties = new Set(); // Reset to none for exclude
              updateView();
            }
          })
        ),
        el('div', { class: 'revision-pattern-list' },
          ...['Easy', 'Medium', 'Hard'].map(diff => {
            const isChecked = selectedDifficulties.has(diff);
            return el('label', { class: 'revision-pattern-item' },
              el('input', {
                type: 'checkbox',
                checked: isChecked,
                onchange: e => {
                  if (e.target.checked) selectedDifficulties.add(diff);
                  else selectedDifficulties.delete(diff);
                  updateView();
                }
              }),
              el('span', { class: 'revision-pattern-name', text: diff })
            );
          })
        ),
        selectedDifficulties.size > 0 ? el('div', { class: 'revision-pattern-count' },
          el('span', { class: 'muted', text: `${selectedDifficulties.size} difficult${selectedDifficulties.size > 1 ? 'ies' : 'y'} selected` })
        ) : null
      ),

      el('div', { class: 'card' },
        el('div', { class: 'revision-filter-header' },
          el('h3', { text: 'Pattern Filter' }),
          el('button', {
            class: 'btn-reset',
            text: '↺ Reset',
            onclick: () => {
              selectedPatterns = new Set(manifest.patterns.map(p => p.id));
              patternFilterMode = 'include';
              updateView();
            }
          })
        ),
        el('div', { class: 'revision-pattern-mode' },
          el('button', {
            class: `revision-pattern-mode-btn ${patternFilterMode === 'include' ? 'active' : ''}`,
            text: '✓ Include These',
            onclick: () => {
              patternFilterMode = 'include';
              selectedPatterns = new Set(manifest.patterns.map(p => p.id)); // Reset to all for include
              updateView();
            }
          }),
          el('button', {
            class: `revision-pattern-mode-btn ${patternFilterMode === 'exclude' ? 'active' : ''}`,
            text: '✗ Exclude These',
            onclick: () => {
              patternFilterMode = 'exclude';
              selectedPatterns = new Set(); // Reset to none for exclude
              updateView();
            }
          })
        ),
        el('div', { class: 'revision-pattern-list' },
          ...manifest.patterns.map(p => {
            const isChecked = selectedPatterns.has(p.id);
            return el('label', { class: 'revision-pattern-item' },
              el('input', {
                type: 'checkbox',
                checked: isChecked,
                onchange: e => {
                  if (e.target.checked) selectedPatterns.add(p.id);
                  else selectedPatterns.delete(p.id);
                  updateView();
                }
              }),
              el('span', { class: 'revision-pattern-name', text: p.name })
            );
          })
        ),
        selectedPatterns.size > 0 ? el('div', { class: 'revision-pattern-count' },
          el('span', { class: 'muted', text: `${selectedPatterns.size} pattern${selectedPatterns.size > 1 ? 's' : ''} selected` })
        ) : null
      ),

      el('div', { class: 'card' },
        el('button', {
          class: 'btn btn-primary btn-large',
          text: '▶ Start Revision',
          onclick: () => startRevision()
        })
      )
    );

    function modeButton(modeVal, label, desc) {
      return el('button', {
        class: `revision-mode-btn ${mode === modeVal ? 'active' : ''}`,
        onclick: () => { mode = modeVal; updateView(); }
      },
        el('div', { class: 'revision-mode-label', text: label }),
        el('div', { class: 'revision-mode-desc', text: desc })
      );
    }
  }

  function startRevision() {
    // Filter problem pool by mode
    let pool = problemPool.slice();

    if (mode === 'solved') {
      pool = pool.filter(p => store.getProblem(p.id).status === 'solved');
    } else if (mode === 'bookmarked') {
      pool = pool.filter(p => !!store.getProblem(p.id).revision);
    } else if (mode === 'solved-patterns') {
      const solvedPatterns = new Set();
      pool.forEach(p => {
        if (store.getProblem(p.id).status === 'solved') {
          solvedPatterns.add(p.patternId);
        }
      });
      pool = pool.filter(p => solvedPatterns.has(p.patternId));
    }

    // Apply filters
    // Difficulty filter
    if (difficultyFilterMode === 'include') {
      // Include mode: only show selected difficulties (empty = show nothing)
      if (selectedDifficulties.size === 0) {
        pool = []; // No difficulties selected in include mode = no problems
      } else {
        pool = pool.filter(p => selectedDifficulties.has(p.difficulty));
      }
    } else {
      // Exclude mode: show everything except selected
      // If ALL difficulties are selected to exclude, result is empty
      const allDifficulties = new Set(['Easy', 'Medium', 'Hard']);
      if (selectedDifficulties.size === allDifficulties.size &&
          [...allDifficulties].every(d => selectedDifficulties.has(d))) {
        pool = []; // Excluding everything = no problems
      } else {
        pool = pool.filter(p => !selectedDifficulties.has(p.difficulty));
      }
    }

    // Pattern filter
    if (patternFilterMode === 'include') {
      // Include mode: only show selected patterns (empty = show nothing)
      if (selectedPatterns.size === 0) {
        pool = []; // No patterns selected in include mode = no problems
      } else {
        pool = pool.filter(p => selectedPatterns.has(p.patternId));
      }
    } else {
      // Exclude mode: show everything except selected
      // If ALL patterns are selected to exclude, result is empty
      const allPatternIds = new Set(manifest.patterns.map(p => p.id));
      if (selectedPatterns.size === allPatternIds.size &&
          [...allPatternIds].every(id => selectedPatterns.has(id))) {
        pool = []; // Excluding everything = no problems
      } else {
        pool = pool.filter(p => !selectedPatterns.has(p.patternId));
      }
    }

    if (pool.length === 0) {
      mount(app, el('div', { class: 'card' },
        el('h2', { text: 'No problems match your filters' }),
        el('p', { class: 'muted', text: 'Try adjusting your mode or filters.' }),
        el('button', { class: 'btn', text: '← Back to Setup', onclick: () => mount(app, renderSetup()) })
      ));
      return;
    }

    // Weight by spaced repetition + recent misses
    const weighted = pool.map(p => {
      const revision = store.getRevisionData(p.id);
      let weight = 1;

      // Boost if due for review
      if (revision.lastAnswered && revision.correct > 0) {
        const daysSince = (Date.now() - new Date(revision.lastAnswered)) / 86400000;
        const interval = getReviewInterval(revision.correct);
        if (daysSince >= interval) weight += 5; // strongly boost due items
      }

      // Boost if recently incorrect
      if (revision.incorrect > 0 && revision.lastAnswered) {
        const daysSince = (Date.now() - new Date(revision.lastAnswered)) / 86400000;
        if (daysSince < 3) weight += 3; // boost recent misses
      }

      // Slightly boost never-attempted
      if (!revision.lastAnswered) weight += 1;

      return { problem: p, weight };
    });

    // Sample questions
    const questions = weightedSample(weighted, Math.min(sessionLength, pool.length));

    // Start revision session
    runRevision(questions);
  }

  function runRevision(questions, resumeIndex = 0) {
    let currentIndex = resumeIndex;
    let reviewed = parseInt(sessionStorage.getItem('revision:reviewed') || '0');
    let needsPractice = parseInt(sessionStorage.getItem('revision:needsPractice') || '0');

    // Save session state
    sessionStorage.setItem('revision:session', JSON.stringify(questions));
    sessionStorage.setItem('revision:currentIndex', currentIndex.toString());

    // Keyboard shortcuts handler (defined at scope level for cleanup)
    let handleKeydown = null;

    function renderQuestion() {
      const problem = questions[currentIndex];

      // Update session state
      sessionStorage.setItem('revision:currentIndex', currentIndex.toString());

      function markConfidence(gotIt) {
        // Clean up keyboard listener before navigation
        if (handleKeydown) {
          document.removeEventListener('keydown', handleKeydown);
        }

        // Update spaced repetition
        if (gotIt) {
          // Advance interval
          const revision = store.getRevisionData(problem.id);
          store.recordRevisionAnswer(problem.id, true);
          reviewed++;
          sessionStorage.setItem('revision:reviewed', reviewed.toString());
        } else {
          // Reset interval, needs practice
          store.recordRevisionAnswer(problem.id, false);
          needsPractice++;
          sessionStorage.setItem('revision:needsPractice', needsPractice.toString());
        }

        // Next problem or finish
        if (currentIndex < questions.length - 1) {
          currentIndex++;
          sessionStorage.setItem('revision:currentIndex', currentIndex.toString());
          renderQuestion();
        } else {
          showSummary();
        }
      }

      // Setup keyboard shortcuts
      handleKeydown = function(e) {
        // Don't trigger if user is typing in an input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        switch(e.key) {
          case 'ArrowLeft':
            e.preventDefault();
            if (currentIndex > 0) {
              document.removeEventListener('keydown', handleKeydown);
              currentIndex--;
              sessionStorage.setItem('revision:currentIndex', currentIndex.toString());
              renderQuestion();
            }
            break;
          case 'ArrowRight':
            e.preventDefault();
            if (currentIndex < questions.length - 1) {
              document.removeEventListener('keydown', handleKeydown);
              currentIndex++;
              sessionStorage.setItem('revision:currentIndex', currentIndex.toString());
              renderQuestion();
            }
            break;
          case 'Enter':
          case ' ':
            e.preventDefault();
            markConfidence(true);
            break;
          case 'b':
          case 'B':
            e.preventDefault();
            markConfidence(false);
            break;
        }
      };

      document.addEventListener('keydown', handleKeydown);

      const view = el('div', { class: 'revision-question-view' },
        el('div', { class: 'revision-progress-bar' },
          el('div', { class: 'revision-progress-fill', style: `width: ${(currentIndex / questions.length) * 100}%` })
        ),

        el('div', { class: 'revision-header' },
          el('div', { class: 'revision-nav-buttons' },
            el('button', {
              class: 'btn btn-sm',
              text: '← Previous',
              disabled: currentIndex === 0,
              onclick: () => {
                if (currentIndex > 0) {
                  currentIndex--;
                  sessionStorage.setItem('revision:currentIndex', currentIndex.toString());
                  renderQuestion();
                }
              }
            }),
            el('div', { class: 'revision-progress-text', text: `Problem ${currentIndex + 1} of ${questions.length}` }),
            el('button', {
              class: 'btn btn-sm',
              text: 'Next →',
              disabled: currentIndex === questions.length - 1,
              onclick: () => {
                if (currentIndex < questions.length - 1) {
                  currentIndex++;
                  sessionStorage.setItem('revision:currentIndex', currentIndex.toString());
                  renderQuestion();
                }
              }
            })
          )
        ),

        el('div', { class: 'card revision-question-card' },
          el('h2', { class: 'revision-question-title', text: problem.title }),
          el('div', { class: 'revision-question-meta' },
            el('span', { class: `badge badge-${problem.difficulty.toLowerCase()}`, text: problem.difficulty }),
            el('a', {
              class: 'revision-leetcode-link',
              href: `#/problem/${problem.id}`,
              text: '📖 View Full Problem'
            })
          ),
          problem.description ? el('div', { class: 'revision-problem-statement' },
            el('p', { text: problem.description })
          ) : null,

          el('div', { class: 'revision-approaches' },
            el('h3', { class: 'revision-approaches-title', text: 'Solutions' }),
            ...problem.allSolutions.map((s, idx) => {
              const detailsId = `solution-${currentIndex}-${idx}`;
              const isExpanded = false;

              return el('div', { class: 'revision-approach' },
                el('div', { class: 'revision-approach-header' },
                  el('span', { class: 'revision-approach-label', text: s.label === 'Solution from repo' ? `Solution ${idx + 1}` : s.label }),
                  el('span', { class: 'revision-approach-complexity', text: s.timeComplexity })
                ),
                el('div', { class: 'revision-approach-keyidea', text: s.keyIdea }),
                s.code ? el('details', { id: detailsId, class: 'revision-code-details' },
                  el('summary', { class: 'revision-code-toggle', text: '▶ View Code' }),
                  el('pre', { class: 'revision-code' },
                    el('code', { text: s.code })
                  )
                ) : null
              );
            })
          ),

          el('div', { class: 'revision-actions' },
            el('button', {
              class: 'btn btn-secondary revision-btn-practice',
              text: '🔄 Need Practice',
              onclick: () => markConfidence(false)
            }),
            el('button', {
              class: 'btn btn-primary revision-btn-gotit',
              text: '✓ Got It',
              onclick: () => markConfidence(true)
            })
          ),
          el('div', { class: 'muted', style: 'text-align: center; font-size: 0.82rem; margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border);' },
            el('span', { text: '⌨️ Keyboard shortcuts: ' }),
            el('span', { text: '← Prev | → Next | Enter/Space = Got It | B = Need Practice' })
          )
        )
      );

      mount(app, view);
      window.scrollTo(0, 0);
    }

    function showSummary() {
      // Clean up keyboard listener
      if (handleKeydown) {
        document.removeEventListener('keydown', handleKeydown);
      }

      const total = questions.length;

      // Get revision data to show which were marked as needing practice
      const problemsNeedingPractice = [];
      const problemsGotIt = [];

      questions.forEach(q => {
        const revData = store.getRevisionData(q.id);
        // Check the most recent answer based on lastAnswered timestamp
        if (revData.lastAnswered) {
          // If incorrect count increased more recently than correct, it needs practice
          if (revData.incorrect > 0 && revData.correct === 0) {
            problemsNeedingPractice.push(q);
          } else {
            problemsGotIt.push(q);
          }
        }
      });

      // Mark session as complete but don't clear yet (so we can return to summary)
      sessionStorage.setItem('revision:complete', 'true');

      mount(app, el('div', { class: 'revision-summary' },
        el('div', { class: 'card' },
          el('h1', { text: '✓ Revision Complete!' }),

          el('div', { class: 'revision-summary-stats' },
            el('div', { class: 'stat-item' },
              el('div', { class: 'stat-value', text: reviewed }),
              el('div', { class: 'stat-label', text: 'Got It' })
            ),
            el('div', { class: 'stat-item' },
              el('div', { class: 'stat-value', text: needsPractice }),
              el('div', { class: 'stat-label', text: 'Need Practice' })
            ),
            el('div', { class: 'stat-item' },
              el('div', { class: 'stat-value', text: total }),
              el('div', { class: 'stat-label', text: 'Total Reviewed' })
            )
          )
        ),

        el('div', { class: 'card' },
          el('h2', { text: 'All Problems' }),
          el('div', { class: 'revision-summary-list' },
            ...questions.map((q, idx) => {
              const revData = store.getRevisionData(q.id);
              const needsPractice = revData.incorrect > 0 && revData.correct === 0;
              const gotIt = !needsPractice && revData.lastAnswered;

              return el('a', {
                class: 'revision-summary-item',
                href: `#/problem/${q.id}`
              },
                el('div', { class: 'revision-summary-item-number', text: (idx + 1).toString() }),
                el('div', { class: 'revision-summary-item-content' },
                  el('div', { class: 'revision-summary-item-title', text: q.title }),
                  el('div', { class: 'revision-summary-item-meta' },
                    el('span', { class: `chip ${q.difficulty}`, text: q.difficulty }),
                    gotIt ? el('span', { class: 'revision-summary-badge got-it', text: '✓ Got It' }) : null,
                    needsPractice ? el('span', { class: 'revision-summary-badge needs-practice', text: '🔄 Need Practice' }) : null
                  )
                )
              );
            })
          )
        ),

        el('div', { class: 'card revision-summary-actions' },
          el('button', { class: 'btn', text: '← Continue Reviewing', onclick: () => {
            // Go back to last question
            sessionStorage.removeItem('revision:complete');
            currentIndex = questions.length - 1;
            sessionStorage.setItem('revision:currentIndex', currentIndex.toString());
            renderQuestion();
          }}),
          el('button', { class: 'btn btn-primary', text: '🔄 New Revision Session', onclick: () => {
            sessionStorage.removeItem('revision:session');
            sessionStorage.removeItem('revision:currentIndex');
            sessionStorage.removeItem('revision:reviewed');
            sessionStorage.removeItem('revision:needsPractice');
            sessionStorage.removeItem('revision:complete');
            mount(app, renderSetup());
          }}),
          el('a', { class: 'btn btn-secondary', href: '#/', text: '← Back to Roadmap' })
        )
      ));
    }

    renderQuestion();
  }

  // Utility functions
  function generateDistractors(problem, pool, count) {
    // Get approaches from other problems (prefer same pattern, then similar difficulty)
    const candidates = [];
    pool.forEach(p => {
      if (p.id === problem.id) return;
      p.correctApproaches.forEach(a => {
        let score = 0;
        if (p.patternId === problem.patternId) score += 2; // same pattern
        if (p.difficulty === problem.difficulty) score += 1; // same difficulty
        candidates.push({
          label: a.label,
          timeComplexity: a.timeComplexity,
          keyIdea: a.keyIdea,
          score,
          isCorrect: false
        });
      });
    });

    // Sort by score desc, take top candidates, shuffle, take count
    candidates.sort((a, b) => b.score - a.score);
    const topCandidates = candidates.slice(0, Math.min(30, candidates.length));
    return shuffle(topCandidates).slice(0, count);
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function weightedSample(weighted, count) {
    const arr = [];
    weighted.forEach(w => {
      for (let i = 0; i < w.weight; i++) arr.push(w.problem);
    });
    return shuffle(arr).slice(0, count);
  }

  function setsEqual(a, b) {
    if (a.size !== b.size) return false;
    for (let v of a) if (!b.has(v)) return false;
    return true;
  }

  function getReviewInterval(correctCount) {
    // Spaced repetition: 1, 3, 7, 14, 30 days
    const intervals = [1, 3, 7, 14, 30];
    return intervals[Math.min(correctCount - 1, intervals.length - 1)];
  }

  function getRevisionStats() {
    return store.getRevisionStats();
  }

  function getDueForReviewCount() {
    const now = Date.now();
    const allProblems = problemPool;
    let count = 0;
    allProblems.forEach(p => {
      const revision = store.getRevisionData(p.id);
      if (revision.lastAnswered && revision.correct > 0) {
        const daysSince = (now - new Date(revision.lastAnswered)) / 86400000;
        const interval = getReviewInterval(revision.correct);
        if (daysSince >= interval) count++;
      }
    });
    return count;
  }

  // Check for existing session to resume
  const savedSession = sessionStorage.getItem('revision:session');
  const sessionComplete = sessionStorage.getItem('revision:complete');

  console.log('[Revision] Checking session state:', {
    hasSavedSession: !!savedSession,
    sessionComplete,
    reviewed: sessionStorage.getItem('revision:reviewed'),
    needsPractice: sessionStorage.getItem('revision:needsPractice')
  });

  if (savedSession && sessionComplete === 'true') {
    // Session is complete, just need to show summary
    console.log('[Revision] Restoring completed session summary');
    try {
      const questions = JSON.parse(savedSession);
      const reviewed = parseInt(sessionStorage.getItem('revision:reviewed') || '0');
      const needsPractice = parseInt(sessionStorage.getItem('revision:needsPractice') || '0');

      // Directly call the showSummary logic without going through runRevision
      showStandaloneSummary(questions, reviewed, needsPractice);
      return;
    } catch (e) {
      // Invalid data, clear and continue
      sessionStorage.removeItem('revision:session');
      sessionStorage.removeItem('revision:currentIndex');
      sessionStorage.removeItem('revision:reviewed');
      sessionStorage.removeItem('revision:needsPractice');
      sessionStorage.removeItem('revision:complete');
    }
  } else if (savedSession) {
    try {
      const questions = JSON.parse(savedSession);
      const currentIndex = parseInt(sessionStorage.getItem('revision:currentIndex') || '0');
      if (questions && questions.length > 0 && currentIndex < questions.length) {
        // Resume the session in progress
        runRevision(questions, currentIndex);
        return;
      }
    } catch (e) {
      // Invalid session data, clear and continue
      sessionStorage.removeItem('revision:session');
      sessionStorage.removeItem('revision:currentIndex');
      sessionStorage.removeItem('revision:reviewed');
      sessionStorage.removeItem('revision:needsPractice');
      sessionStorage.removeItem('revision:complete');
    }
  }

  function showStandaloneSummary(questions, reviewed, needsPractice) {
    const total = questions.length;

    mount(app, el('div', { class: 'revision-summary' },
      el('div', { class: 'card' },
        el('h1', { text: '✓ Revision Complete!' }),

        el('div', { class: 'revision-summary-stats' },
          el('div', { class: 'stat-item' },
            el('div', { class: 'stat-value', text: reviewed }),
            el('div', { class: 'stat-label', text: 'Got It' })
          ),
          el('div', { class: 'stat-item' },
            el('div', { class: 'stat-value', text: needsPractice }),
            el('div', { class: 'stat-label', text: 'Need Practice' })
          ),
          el('div', { class: 'stat-item' },
            el('div', { class: 'stat-value', text: total }),
            el('div', { class: 'stat-label', text: 'Total Reviewed' })
          )
        )
      ),

      el('div', { class: 'card' },
        el('h2', { text: 'All Problems' }),
        el('div', { class: 'revision-summary-list' },
          ...questions.map((q, idx) => {
            const revData = store.getRevisionData(q.id);
            const needsPrac = revData.incorrect > 0 && revData.correct === 0;
            const gotIt = !needsPrac && revData.lastAnswered;

            return el('a', {
              class: 'revision-summary-item',
              href: `#/problem/${q.id}`
            },
              el('div', { class: 'revision-summary-item-number', text: (idx + 1).toString() }),
              el('div', { class: 'revision-summary-item-content' },
                el('div', { class: 'revision-summary-item-title', text: q.title }),
                el('div', { class: 'revision-summary-item-meta' },
                  el('span', { class: `chip ${q.difficulty}`, text: q.difficulty }),
                  gotIt ? el('span', { class: 'revision-summary-badge got-it', text: '✓ Got It' }) : null,
                  needsPrac ? el('span', { class: 'revision-summary-badge needs-practice', text: '🔄 Need Practice' }) : null
                )
              )
            );
          })
        )
      ),

      el('div', { class: 'card revision-summary-actions' },
        el('button', { class: 'btn', text: '← Continue Reviewing', onclick: () => {
          // Go back to last question and resume
          sessionStorage.removeItem('revision:complete');
          sessionStorage.setItem('revision:currentIndex', (questions.length - 1).toString());
          // Reload the page to trigger runRevision
          location.hash = '#/revision';
          location.reload();
        }}),
        el('button', { class: 'btn btn-primary', text: '🔄 New Revision Session', onclick: () => {
          sessionStorage.removeItem('revision:session');
          sessionStorage.removeItem('revision:currentIndex');
          sessionStorage.removeItem('revision:reviewed');
          sessionStorage.removeItem('revision:needsPractice');
          sessionStorage.removeItem('revision:complete');
          mount(app, renderSetup());
        }}),
        el('a', { class: 'btn btn-secondary', href: '#/', text: '← Back to Roadmap' })
      )
    ));
  }

  // Start with setup screen
  mount(app, renderSetup());
}
