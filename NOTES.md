# DSA Learning Site for Shirisha — Plan & Continuity Doc

> **This file is both the PLAN and the SESSION-RESUME doc.** If the session dies, start a
> new Claude Code session in `/Users/sumanth.naik/Documents` and say:
> _"Read `/Users/sumanth.naik/.claude/plans/dreamy-wondering-minsky.md` and continue."_
> Everything needed to resume is captured below.

---

## 0. RESUME QUICK-START (read this first)

- **What we're building:** A static, GitHub-Pages-hosted, concept-first DSA learning site for
  the user's wife (**Shirisha**), driven by JSON content, with tiered Python solutions and
  cross-device progress tracking via a private GitHub Gist.
- **Where we are:** **Phase 2 COMPLETE with the FULL NeetCode-150 curriculum authored + fully
  verified — awaiting the user's local review.** The entire site is built in
  `/Users/sumanth.naik/Documents/dsa-journey/`. Nothing pushed public yet.
- **Curriculum shipped (the "add rest of them" expansion — DONE):** 8 phases · **18 patterns** ·
  **151 problems** · **311 tiered solution snippets** (was 217; +94 from the "all ways to solve"
  enrichment pass — see below). Full NeetCode 150 backbone. Per-phase spread:
  P1 Arrays/Hashing/Two-Pointers (3 pat, 21 q) · P2 Stack/Binary-Search (2, 14) · P3 Linked-List/
  Trees (2, 26) · P4 Backtracking/Heap (2, 16) · P5 Graphs/Advanced-Graphs (2, 19) · P6 DP 1D+2D
  (2, 23) · P7 Greedy/Intervals (2, 14) · P8 Tries/Math/Bit (3, 18). Every problem has all 6
  required fields (LeetCode slug, video, keyIdeas, hints, tiered solutions, per-tier complexity).
- **ENRICHMENT PASS — "add every instructive way to solve" (DONE + fully verified):** Per the user's
  principle #4, every problem now shows every genuinely distinct paradigm (heap vs sort vs quickselect;
  DFS vs BFS vs union-find; greedy vs DP; Kadane vs divide-&-conquer; XOR vs Gauss-sum; DP vs math
  closed-form), each with its own `keyIdea` that states the insight AND *when to reach for it over the
  alternatives* (the trade-off). 217 → **311 tiers (+94)**. Coverage: **multi-solution problems 40% →
  72%** (109/151); avg **2.06 solutions/problem** (was 1.44). Distribution: 42 one-tier, 65 two, 38
  three, 5 four, 1 five (climbing-stairs). Highlights added: quickselect (kth-largest, k-closest),
  union-find (number-of-islands, graph-valid-tree, longest-consecutive), BFS (coin-change, word-break),
  divide-&-conquer (maximum-subarray), Fibonacci closed-form (climbing-stairs), Kruskal-vs-Prim
  (min-cost-connect-points), sweep-line (meeting-rooms-ii), greedy-vs-DP (jump-game/-ii/gas-station),
  Bellman-Ford (network-delay), bitmask/cascading subsets. Genuinely single-approach problems (min-stack,
  find-median-from-data-stream, most trie ops) deliberately LEFT at one tier — no padding.
  - **How the enrichment ran:** one subagent per pattern file (append-only, no write conflicts) against
    `tools/ENRICHMENT_SPEC.md` (HARD rule: never modify/delete existing tiers — only append + reorder
    into brute→better→optimal→alternatives teaching arc). Preservation guardrail = full backup
    (`.agents/artifacts/patterns_pre_enrich/`) + central diff. The guardrail EARNED ITS KEEP: the
    sliding-window agent silently rewrote two of Sumanth's OWN reused solutions
    ("Sliding window with a set" + "Grow-then-shrink window") — caught by the diff and surgically
    restored byte-for-byte from backup while keeping the agent's good new brute-force motivators.
- **What's verified (all green, full 311-tier curriculum):**
  - All 14 browser JS modules syntax-OK (`bun build --target=browser`); `tools/build-data.mjs`
    OK as a Node script (`--target=node`). The earlier "node:url" FAIL was a wrong-target false positive.
  - **All JSON valid** (`jq empty` across all 18 pattern files); `manifest.problemIndex` ⇄
    `pattern.problems` match exactly (no orphans, no missing); **0 duplicate pattern/problem IDs**.
    Manifest regenerated post-enrichment (`bun tools/build-data.mjs` → 18 patterns, 151 problems).
  - Local server `python3 -m http.server 8123` serves all assets HTTP 200 (verified live).
  - **All 311 Python snippets compile** (`compile(..., 'exec')`), 0 content issues.
  - **PRESERVATION PROVEN:** all **217 original tier code bodies present verbatim** in current data
    (diff vs `patterns_pre_enrich/` backup → 0 missing, 0 code mutations, 0 metadata changes). The only
    accepted soft drift: label prefixes (`Optimal —`/`Alternative —`, the teaching-arc the spec asked
    for) + keyIdea trade-off annotations (the whole point) + 1 complexity suffix
    (`O(n log n)` → `O(n log n) — sorting dominates`).
  - **FUNCTIONAL correctness — every one of the 311 tiers EXECUTED, not just compiled:**
    - **Cross-tier equivalence** (`.agents/artifacts/xtier_verify.py`): for all **109 multi-tier
      problems**, ran EVERY tier against a known-correct input and asserted all paradigms agree —
      **269 tiers, 109/109 problems, 0 failures.** Deep-copy asserted for clone-graph/copy-list;
      topo-order validity checked for course-schedule-ii; n-queens boards validated as legal.
    - **Single-tier sweep** (`.agents/artifacts/single_verify.py`): all **42 single-tier problems**
      executed against known answers — **42/42, 0 failures.**
    - **1 REAL BUG caught + fixed by this sweep:** `word-break` "Alternative — Trie + DP" (a NEW
      enrichment tier) walked the trie BACKWARD (`range(i-1,-1,-1)`) so it never matched → returned
      `False` for `"leetcode"`. Rewrote to scan forward from each DP-reachable index; re-verified
      against a brute oracle on 10 cases. label/keyIdea/complexity preserved. (This is exactly why
      "compile-only" is insufficient and the functional sweep was necessary.)
  - **All 151 LeetCode slugs resolve** via GraphQL (7 correctly flagged LeetCode-Premium:
    encode-and-decode-strings #271, walls-and-gates #286, graph-valid-tree #261,
    number-of-connected-components #323, alien-dictionary #269, meeting-rooms #252, meeting-rooms-ii #253).
  - **All 151 videos well-formed** (9 upgraded to direct NeetCode links + 142 search URLs that can't 404).
  - Ordering verified consistent across all 3 sources (`phase.patternIds` == `patterns[]` order ==
    `problemIndex` grouping). `build-data.mjs` sorts by `(phaseId, order, name)`; `getManifest()`
    re-sorts defensively. Fixed a real ordering bug during this work (was phaseId-only → alpha drift).
- **How the curriculum was built:** one subagent per NEW pattern file (15 files, no write conflicts) +
  append-only fragments for the 3 pre-existing gold-standard files (two-pointers/hashing/sliding-window),
  spliced centrally so gold content was never overwritten. All agents read their roster from
  `.agents/artifacts/neetcode150_roster.json` (source of truth) to avoid transcription errors.
- **Immediate next action:** Present the completed local preview to the user for Phase 2 sign-off.
  Server running on **:8123** (`open http://localhost:8123`). If dead, restart with
  `cd /Users/sumanth.naik/Documents/dsa-journey && python3 -m http.server 8123`.
- **Do NOT** push anything public or write progress tokens until the user has reviewed a LOCAL
  preview first (explicit user sequencing). Before public deploy: add SRI hashes to the 2 CDN
  `<script>` tags in `index.html` (slugs + videos already verified).

---

## 1. Context (why we're doing this)

The user spent 1+ year building a personal DSA repo and wants to turn that knowledge into a
**structured, gentle, concept-first learning path** for his wife **Shirisha** — a Goldman Sachs
engineer with 5 years of experience who **knows data structures well but is new to Python**.

Her learning style (explicit): **concept first, then apply.** She dislikes being handed a cold
problem to brute-force. So every pattern gets a **concept page BEFORE its problems**, and Python
is **baked into the process** (no separate "learn Python first" step).

The user's own system (to preserve) rests on 4 principles:
1. Map questions → **patterns**.
2. Each question has terse **key ideas** (revise key ideas alone to refresh a whole problem).
3. A **data-structures implementations** section so any seen problem can be fully coded.
4. **Multiple implementations** of the same problem.

User's own 4-phase framing for THIS project:
- Phase 1: decide scope ✅ (done — see decisions below)
- Phase 2: implement in a local folder → give a locally-openable page to check
- Phase 3: push as a hosted website she can access
- Phase 4: store metrics so she can track progress

---

## 2. Source repo (already explored — DO NOT re-explore from scratch)

- **Repo:** `github.com/sumanth-naik/Striver-191`, branch **`master`** (default). Public.
  Languages: Python (923KB) + Jupyter. Not cloned locally; access via `gh api` (authenticated
  to github.com as `sumanth-naik`; the salesforce git host times out — ignore it).
- **Scale:** ~**150 pattern-named top-level folders**, **524 `.py` files**, one problem per file.
- **Conventions learned (must preserve):**
  - Folders are named by PATTERN, e.g. `Two Pointer`, `Sliding Window`, `DP on Grids`,
    `Monotonic Stacks`, `Graphs - Djikstras`, `Union Find`, etc.
  - **Key ideas = terse top-of-file comments** (e.g. `# Trie for anything to do with word -> value mapping`).
  - Some files hold **multiple implementations** of one problem (e.g. `trie.py` has several
    `Trie` variants; `3Sum.py` factors out a `twoPointerSum` helper).
  - **Data-structure implementation folders** exist: `Trie - Implementations`,
    `Union Find - Implementations`, `New Data Structures Implementation`,
    `Design new Data Structures`, `Doubly Linked List`.
  - `DSA_Patterns_Notebook.ipynb` already has a **17-pattern concept→exercise→solution** flow
    (Two Pointers, Sliding Window, Binary Search, Backtracking, DP, BFS, DFS, Topo Sort,
    HashMap/Set, Stack, Heap, Trie, Union Find, Kadane, Greedy, Monotonic Stack, Bit Manip) —
    a good seed for concept pages.
  - Code style is clean/idiomatic Python, camelCase filenames (filename = problem name).
- **Useful `gh` commands (for the authoring phase):**
  - All folders: `gh api 'repos/sumanth-naik/Striver-191/git/trees/HEAD?recursive=1' --jq '.tree[] | select(.type=="tree") | .path'`
  - Files in a folder: `gh api "repos/sumanth-naik/Striver-191/contents/<URL-ENCODED PATH>" --jq '.[].name'` (spaces → `%20`)
  - Read a file: `gh api "repos/sumanth-naik/Striver-191/contents/<ENCODED>/<file>.py" --jq '.content' | base64 -d`

---

## 3. LOCKED decisions (from user Q&A — do not re-litigate)

| Topic | Decision |
|---|---|
| **Curriculum scope** | Breadth-first **spiral**. Not a fixed set. **First ~150 problems must cover MOST patterns** (≈80% interview-ready) so she's **never stuck on one pattern**; then **next ~150, next ~150** increments. Add new patterns freely beyond the repo's 150. Final goal = **interview ready**. |
| **Content source** | **Hybrid:** curate the path, **reuse the user's existing Python solutions + key-idea comments** where they exist, **author fresh** key ideas/hints/complexity/video for gaps. |
| **Solutions depth** | **Tiered: brute → better → optimal** (2–3 per problem where meaningful), each with its **own key idea + complexity**. Matches the user's multi-implementation style. |
| **Progress storage** | **Private GitHub Gist** (a gist is a git repo — file-based, no DB). Cross-device incl. **phone**. **Setup MUST be simple** (user: "if setup is not complicated, GIST"). localStorage fallback with no token. |
| **Practice links** | **LeetCode** primary (ideally only). Optional **video** per problem, prefer Python. |
| **Hosting** | **New PUBLIC repo `dsa-journey`** → `https://sumanth-naik.github.io/dsa-journey`. |
| **Personalization** | Yes — greet **"Shirisha"** (e.g. "Shirisha's DSA Path"). *(Name inferred from `Shirisha.jpg` seen in `~/Documents` during repo search — user was surprised; keep unless told otherwise.)* |
| **Rollout order** | Build **LOCAL preview first**, user reviews, **only then push public**. Public repo + wife involved → user eyes on it before it goes live. |

---

## 4. Per-problem content model (required fields)

Each problem must support ALL of:
- **LeetCode link** (primary practice link; store canonical slug).
- **Optional video** link (prefer Python walkthrough).
- **Key Ideas** section — must be **reviewable on its own** (a "Key Ideas only" view across problems).
- **Progressive hints** — revealed one at a time.
- **Tiered solutions** — array of `{ label, keyIdea, code, timeComplexity, spaceComplexity }`
  (brute → better → optimal). Syntax-highlighted, one-click copy.
- **Complexity** — Big-O time & space per solution.
- Pattern tag + phase + difficulty.

Concept-first structure: **Phase → Pattern (with a CONCEPT page shown before problems) → Problems.**

---

## 5. Progress / metrics model (client-side, gist-synced)

- Per-problem status: `not-started | attempted | solved | needs-revision`, with **timestamps**,
  **attempt count**, optional **notes**, and a **spaced-repetition** review flag (review after
  ~1/3/7/21 days).
- Derived metrics: total solved, **coverage by pattern** (grid/heatmap), **current streak**,
  **problems due for revision**, time-in-phase.
- **Sync:** private Gist holds a JSON state file. Token = fine-grained, **gist scope only**,
  pasted **once per device**, stored in that browser's `localStorage`, **never committed**.
  First save auto-creates the gist and remembers its id. **Merge = last-write-wins per problem
  by timestamp**; never lose local progress. Fully works offline/local without a token.
- Honest security note for the user: token lives only in localStorage on her device(s), is
  gist-scoped and revocable; the site repo is public but contains no secrets.

---

## 6. Site architecture — FINALIZED (agent `ae8438ea410f2f8ab`, completed)

**Stack:** Vanilla ES modules + hash routing + 2 pinned CDN libs (`marked` for markdown,
`highlight.js` for Python). **Zero build step.** Reasons: state is tiny (flat map of statuses),
views are direct data→DOM; a framework buys nothing. Pin exact versions + SRI hashes; optional
later vendoring of the two libs into `js/lib/`.

**Data layout — per-pattern JSON + generated manifest:**
```
data/
  manifest.json          # GENERATED: phases + pattern metadata + lightweight problem index
  patterns/
    two-pointer.json     # full concept + full problems for that pattern
    sliding-window.json
    ...
```
- `manifest.json` (source of truth = the pattern files) holds only `id,title,patternId,phaseId,
  difficulty,leetcodeSlug` → Home/Dashboard stay fast with one small fetch.
- Pattern file lazily fetched on first open. All fetches RELATIVE (resolve under `/dsa-journey/`).

**Schemas:**
- *Phase:* `{ id, title, subtitle, goal, patternIds[] }`
- *Pattern (concept-first):* `{ id, name, phaseId, order, concept(markdown), whenToUse[], problems[] }`
- *Problem:* `{ id, title, leetcodeSlug, difficulty, patternId, tags[], video{title,url,lang},
  keyIdeas(markdown, PROBLEM-LEVEL — this is what the "Key Ideas only" view aggregates),
  hints[] (progressive), solutions[] }`
- *Solution (tier):* `{ label, keyIdea (PER-TIER), code (string with \n), timeComplexity,
  spaceComplexity }` — ordered brute→better→optimal; rendered as collapsed accordion; code in
  `<pre><code class="language-python">`, highlighted, with a Copy button (`navigator.clipboard`).
- **Two levels of key idea by design:** problem-level `keyIdeas` (pattern connection / big picture,
  feeds the review view) + per-tier `solutions[].keyIdea` (insight for that specific tier).

**Progress state** (mirrored in localStorage `dsa:progress` AND gist file `dsa-journey-progress.json`):
```
{ version, user:"Shirisha", updatedAt, phaseStartedAt{phaseId:iso},
  problems: { <problemId>: { status, attempts, firstAttemptedAt, solvedAt, updatedAt, notes,
                             revision:{ interval, due, lastReviewedAt } } } }
```
- `status ∈ not-started|attempted|solved|needs-revision`. Per-problem `updatedAt` = merge key.
- Streaks / coverage / due-list / time-in-phase are DERIVED at render, never stored.

**Views & hash routes** (hash, not History API — GitHub Pages has no server rewrites, so deep-link
refresh never 404s): `#/` Home/roadmap · `#/phase/:id` · `#/pattern/:patternId` (CONCEPT shown
first, then problems) · `#/problem/:problemId` (LeetCode = primary CTA; video; key ideas + hints +
tiered solutions all COLLAPSED by default = concept-first, never a forced cold problem; status
buttons, attempt counter, notes, add-to-revision) · `#/review` (aggregates problem-level keyIdeas,
filterable) · `#/dashboard` · `#/settings` (name, token paste, gist link, Sync now, Export/Import
JSON, theme, sign-out). Mobile: single column, sticky bottom nav, tap-to-expand, iPhone-Safari tested.

**Gist sync (`js/sync.js`):** localStorage keys `dsa:token` (fine-grained PAT, Gists R/W ONLY;
never committed), `dsa:gistId`, `dsa:progress` (offline source of truth), `dsa:lastSync`,
`dsa:settings`. REST (base api.github.com, headers `Authorization: Bearer`, `Accept:
application/vnd.github+json`, `X-GitHub-Api-Version: 2022-11-28`): first save → `POST /gists`
(private, file `dsa-journey-progress.json`) store id; load → `GET /gists/{id}` → merge; save →
`PATCH /gists/{id}`. **Debounce:** write localStorage immediately on every change; PATCH 2.5s after
last change; flush on `visibilitychange`→hidden & `pagehide` via `fetch(...,{keepalive:true})`.
**Merge = last-write-wins per problem by `updatedAt` over the UNION of keys** (no problem dropped;
different-problem edits on 2 devices never conflict). Token setup (desktop + iPhone Safari identical):
github.com → Settings → Developer settings → Fine-grained tokens → repo access None → Account
permissions → **Gists: Read and write** → set expiry → paste into site Settings once. Fallback:
classic token with single `gist` scope. Honest security: token only in that browser's localStorage,
gist-scoped, revocable; repo public so token pasted at runtime only; secret gist is URL-accessible
(fine — only statuses/notes, no secrets); minimal XSS surface (no 3rd-party scripts beyond 2 SRI CDNs).

**Dashboard metrics (all client-side):** totals (solved/attempted/needs-revision/not-started + donut);
coverage-by-pattern heatmap; current & longest streak (consecutive days with ≥1 status advance);
**due-for-revision** queue (spaced repetition 1→3→7→21 days; needs-revision resets to 1d); time-in-phase.

**Authoring workflow:** pattern JSON files are hand-authored (pedagogy is editorial). Optional
LOCAL-ONLY `tools/build-data.mjs` (Node): a solution may use `"codeFile":"<path in local
Striver-191 checkout>"` → script inlines the file into `code`, and regenerates `manifest.json`.
Hosted site loads only static JSON (no toolchain to host). Ship `data/patterns/_template.json` +
`tools/README.md`.

**Repo layout:** `index.html` (+`.nojekyll`), `css/styles.css`, `js/{app,router,store,sync}.js`,
`js/lib/markdown.js`, `js/views/{home,phase,pattern,problem,review,dashboard,settings}.js`,
`data/{manifest.json,patterns/*.json}`, `tools/{build-data.mjs,README.md}`, `README.md`. **Pages:**
deploy from `main` → `/(root)`; `.nojekyll` present; relative asset/data refs.

**Risks/tradeoffs:** iOS Safari may evict localStorage after ~7 days idle → gist is durable backup
(re-paste token if evicted) + Export/Import JSON; no gist compare-and-swap (same-problem-2-device-
offline edit is the only lossy window; near-zero for one user); secret gist ≠ private; CDN dep
(mitigate SRI + optional vendoring); fine-grained Gists permission may need classic-token fallback.

---

## 7. Curriculum (first ~150 spiral) — FINALIZED (inventory done inline; agent hit network error)

Full repo tree cached at `.agents/artifacts/striver191_tree.tsv` (683 entries). Per-folder counts
and foundational-folder filenames were pulled directly via `gh api` (see conversation).

### KEY FINDING (shapes the whole plan)
**The repo is skewed to HARD / interesting problems, not beginner foundations.** Evidence:
`Heap`→Skyline Problem; `Back Tracking`→N-Queens, Sudoku Solver; `Binary Search in Two Arrays`→
median of two sorted arrays; `Monotonic Stacks`→Largest Rectangle, Trap Rain Water; top-level
`HashMaps`=1 file, `Binary Search`=0 direct files, `Stacks - Parantheses`=only longestValidParens.
No plain Two Sum / reverse-linked-list / valid-parentheses / basic-binary-search exist.
Biggest folders: DP(53), Graphs(37), "Easy OR Repeated Patterns - ignore"(30, SKIP per its name),
Trie(22), Trees(18), Linked List(18), Two Pointer(17), Union Find(15).

### Division of labor (hybrid, consequence of the finding)
- **Phases 1–2 (easy foundations): AUTHOR FRESH.** Canonical LeetCode easy/med starters with Python
  baked into key ideas. The repo has almost none of these, so they're written from scratch.
- **Phases 3+: REUSE the repo heavily.** Sumanth's files become the *optimal-tier* solution and the
  depth problems (e.g. `Two Pointer/containerWithMostWater.py`, `Monotonic Stacks/*`,
  `Graphs - BFS In Grid/rottingOranges.py`, `Trees/*`, `Union Find/*`). Pull code via `gh api`.
- Skip the `Easy OR Repeated Patterns - ignore`, `incomplete`, `They dont want to hire you`,
  `Resume` folders. Custom/non-LeetCode problems (e.g. `CandyCrush`, some `Puzzling Ideas`) → set
  `leetcodeSlug:"unknown"` or substitute a canonical equivalent.

### Tiering
- **Tier A (found. — mostly authored):** Two Pointer (basic), Sliding Window (basic), Binary Search
  (basic), Hashing/HashMap, Stacks, Prefix Sum, Linked List (basic ops), Kadane, Boyer-Moore,
  Cyclic Sort, Sorting/Merge/Count Sort, Intervals-basic, Trees BFS/DFS (basic), Heap (basic).
- **Tier B (mid — mix):** Backtracking, Graphs BFS/DFS/grid, Union Find, Topo (Kahn), Dijkstra,
  Trie, DP 1D (take/not-take, coin change), DP grids, Monotonic Stack/Queue, comparator sort,
  binary-search-on-answer.
- **Tier C (adv — reuse repo):** hard DP (bitmask/digits/trees/partitions), KMP/Manacher/Rolling
  Hash, Fenwick, Convex Hull, Matrix expo, Game theory, Meet-in-the-middle, PIE, Euler path, Skyline.

### Phase structure (breadth-first spiral, ~150 across phases 1–8, then increments)
Each phase = several patterns × a few problems, so she touches many patterns fast and is never
stuck on one. Concept page precedes each pattern. Rough shape (final list built per-phase at build):
- **P1 Arrays & Two Pointers & Hashing (easy):** two-sum, valid-anagram, contains-duplicate,
  best-time-buy-sell-stock, two-sum-II, valid-palindrome, move-zeroes, container-with-most-water*(reuse).
- **P2 Sliding Window & Stacks & Binary Search (easy→med):** max-average-subarray, longest-substring-
  without-repeating*(reuse), valid-parentheses, min-stack*(reuse), binary-search, search-rotated*(reuse).
- **P3 Linked List & Prefix Sum & Intervals:** reverse-linked-list, merge-two-lists, linked-list-cycle,
  subarray-sum-equals-k, merge-intervals(author), insert-interval, product-except-self.
- **P4 Trees (BFS/DFS) & Heap:** level-order*(reuse zigzag), max-depth, invert-tree, validate-bst,
  kth-largest, top-k-frequent*(reuse topKFrequentWords).
- **P5 Backtracking & Greedy:** subsets, permutations*(reuse), combination-sum, jump-game, jump-game-2*(reuse), n-queens*(reuse).
- **P6 Graphs (BFS/DFS/grid/Union Find/Topo):** number-of-islands, rotting-oranges*(reuse), course-
  schedule, clone-graph, number-of-components, redundant-connection*(reuse Union Find).
- **P7 DP I (1D & grids):** climbing-stairs, house-robber, coin-change*(reuse DP - Coin Change),
  longest-increasing-subsequence, unique-paths, min-path-sum.
- **P8 Trie & Monotonic Stack & Bit:** implement-trie*(reuse Trie), word-search-II, daily-temperatures*(reuse),
  largest-rectangle*(reuse), single-number, sum-of-two-integers.
- **Beyond 150 (increments):** advanced DP, KMP/Manacher, Fenwick, Dijkstra/Bellman-Ford, Meet-in-middle,
  design (LRU/LFU — reuse `Linked List/LFU.py`), math/number-theory — pull from repo's Tier-C depth.
(*(reuse)* = pull existing code from Striver-191 as the optimal tier; others authored fresh.)

### Gaps to author fresh (missing from repo, needed for interview readiness)
LRU cache (repo has LFU only), merge-intervals/insert-interval, spiral-matrix/rotate-image,
basic binary search + first/last-position, most easy-tier warmups, subarray-sum-equals-k (hashmap),
clone-graph, course-schedule basics, climbing-stairs/house-robber DP intros.

> Full per-problem list (path/slug/difficulty) is finalized **per phase during the build** — the site
> works with partial data, so ship P1 first and grow `data/patterns/*.json`. Verify each guessed
> LeetCode slug resolves before baking the link.

---

## 8. If agents were lost (re-run prompts, condensed)

- **Inventory (Explore agent):** Using `gh api` (no clone, no file writes), catalog all ~150
  folders + files in `sumanth-naik/Striver-191@master`; tier patterns A/B/C for a Python-new but
  DSA-strong beginner; propose ~150 breadth-first problems (repo path + title + LeetCode slug +
  difficulty + pattern); note missing foundational patterns + non-LeetCode problems.
- **Architecture (Plan agent):** Design a zero-build, CDN-only, GitHub-Pages static site meeting
  sections 4–5; deliver stack + JSON schema (worked example) + routes/views + gist-sync module
  (REST calls, localStorage keys, merge, iPhone setup) + dashboard metrics + authoring workflow +
  repo layout.

---

## 9. Implementation phases (the actual build, after plan approval)

- **Phase 2 — Local build (review gate):**
  1. Scaffold `dsa-journey/` locally (index.html, css, JS modules, `data/`, `.nojekyll`).
  2. Implement views + hash routing + rendering (highlight.js/marked via CDN as designed).
  3. Author `data/` JSON: concept pages per pattern + first phase(s) of problems (hybrid content:
     pull user's solutions from `Striver-191`, author gaps, tiered solutions + hints + complexity).
  4. Implement progress module: localStorage first, then gist-sync layer.
  5. Deliver a **locally openable page** (e.g. `open index.html` or a `python3 -m http.server`)
     for the user to check. **STOP here for review.**
- **Phase 3 — Publish (only after approval):** create public repo `dsa-journey`, push, enable
  GitHub Pages, verify `https://sumanth-naik.github.io/dsa-journey` on desktop + phone.
- **Phase 4 — Metrics:** finalize dashboard + spaced-repetition; document the one-time token setup
  for Shirisha (desktop + iPhone Safari).

Content is large (~150+ problems, tiered). Plan to author in batches by phase/pattern; the site
works with partial data, so ship early phases first and grow `data/`.

---

## 10. Verification (how to check it works)

- **Local:** open the site via a static server; click through Home → a Phase → a Pattern concept
  → a Problem; verify LeetCode link, video, key ideas, progressive hints, tiered solutions +
  copy-to-clipboard + highlighting, complexity. Toggle a problem's status and confirm it persists
  across reload (localStorage) and, with a test token, round-trips through the gist. Check the
  "Key Ideas only" view and the dashboard metrics. Test responsive layout at phone width.
- **Public:** after Pages deploy, repeat the smoke test on the live URL on desktop and a phone.

---

## 11. Open items / watch-outs

- Fold both agent results into sections 6 & 7, then `ExitPlanMode` for approval.
- Verify guessed LeetCode slugs resolve to real problems before baking links; substitute any
  non-LeetCode/custom problems.
- Confirm gist onboarding is genuinely simple on **iPhone Safari** (the user's simplicity bar).
- Public repo — no secrets in it; token only ever in localStorage.
- Keep the user's voice in reused key ideas; keep authored gaps consistent and beginner-friendly.
- Once building starts, copy this doc into the repo (e.g. `dsa-journey/NOTES.md` or
  `.agents/artifacts/`) so continuity travels with the project.
