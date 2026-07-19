# Quiz Tests

Comprehensive unit test suite for the quiz feature.

## Running Tests

```bash
# Run all tests
bun test

# Watch mode (re-run on file changes)
bun test --watch
```

## Test Coverage

### Quiz Logic Tests (`quiz.test.js`)

**Store Methods:**
- Quiz data initialization
- Recording correct/incorrect answers
- Quiz statistics calculation
- Best streak tracking

**Filtering:**
- Difficulty filter (include/exclude modes)
- Pattern filter (include/exclude modes)
- Mode filter (all/solved/solved-patterns)
- Empty selection handling (strict include mode)
- Full filter chain integration

**Spaced Repetition:**
- Review interval progression (1→3→7→14→30 days)
- Weight calculation for due problems
- Boosting recent mistakes
- Never-attempted problem weighting

**Answer Checking:**
- Correct answer detection (set equality)
- Missing selections
- Extra selections
- Empty sets

**Distractor Generation:**
- Same-problem exclusion
- Pattern preference scoring
- Difficulty preference scoring
- Combined scoring

### Store Tests (`store.test.js`)

**Problem Status:**
- Status initialization (not-started)
- Status transitions (attempted, solved, needs-revision)
- Revision seeding on first solve
- SolvedAt timestamp preservation

**Attempt Tracking:**
- Attempt count increments
- Status updates on first attempt
- FirstAttemptedAt preservation

**Spaced Repetition:**
- Interval progression (1→3→7→21)
- Graduation after final review
- Due-for-revision detection
- Due problem sorting

**Counts:**
- Problem counting by status
- Empty progress handling

**Timestamps:**
- FirstAttemptedAt recording
- FirstAttemptedAt preservation
- UpdatedAt changes

## Test Stats

- **Total tests:** 46
- **Test files:** 2
- **Pass rate:** 100%

## Design Principles

1. **Pure functions:** Quiz logic extracted from DOM code for testability
2. **Mock dependencies:** LocalStorage and Store mocked for isolation
3. **Edge cases:** Empty sets, boundary conditions, state transitions
4. **Integration tests:** Full filter chain validates real-world usage
5. **Behavioral testing:** Tests verify outcomes, not implementation details
