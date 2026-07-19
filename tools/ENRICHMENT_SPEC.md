# Enrichment pass — add every instructive way to solve

**Audience (unchanged): Shirisha — a Goldman Sachs engineer, 5 years, knows data structures cold but
is NEW TO PYTHON. Concept-first, warm peer tone, Python idioms baked in — never condescending.**

## Your job
You are enriching ONE existing `data/patterns/<id>.json`. The site already has correct, verified
solutions. Your ONLY task this pass: for every problem, make sure **every genuinely distinct,
instructive way to solve it** is present as its own solution tier — because understanding *all* the
ways, and *when to pick each*, is the entire point of this pass. **You ADD tiers. You never rewrite
or remove what is already there.**

## HARD preservation rules (verified centrally — any violation is rejected and your file is redone)
1. Do NOT modify or delete any EXISTING solution tier. Keep its `label`, `keyIdea`, `code`,
   `timeComplexity`, `spaceComplexity` **byte-for-byte identical**. Copy them across verbatim.
2. Do NOT change anything outside `solutions[]`. The file's `concept` and `whenToUse`, and every
   problem's `id`, `title`, `leetcodeSlug`, `difficulty`, `patternId`, `tags`, `video`, `keyIdeas`,
   and `hints` must stay EXACTLY as-is.
3. The ONLY edit you make: **append NEW solution tiers** to `solutions[]` and **reorder** that array
   into teaching order (below). Every existing tier must still be present afterward.

## What to add
For each problem, add every approach that is a **genuinely distinct paradigm or materially different
technique/complexity**. "Distinct" means:
- **Different paradigm:** brute force · greedy · DP (top-down memo AND bottom-up tabulation may both
  appear when both teach something) · BFS vs DFS · union-find · binary-search-on-answer · heap ·
  two-pointers · monotonic stack · math/closed-form · bit trick · divide & conquer.
- **Different data structure that changes the story or complexity:** heap vs sort vs quickselect;
  hashset vs sort; stack vs two-pointer.
- **Materially different complexity:** O(n²) DP vs O(n log n) patience + binary search.
- **Recursive vs iterative** ONLY when the iterative version is non-trivial and interview-relevant
  (iterative inorder with an explicit stack, iterative DFS with a stack). Skip trivial rewrites.

**Include a brute-force tier wherever it MOTIVATES the optimization** — seeing the O(n²) first makes
the O(n) land for her. But if a problem genuinely has only ONE sensible approach (e.g.
`find-median-from-data-stream` = two heaps; most trie operations; `min-stack`), **leave it at one.**
Do NOT pad with pointless variants, cosmetic rewrites, or strictly-dominated noise.

### Concrete targets you SHOULD cover if these problems are in your file (NOT exhaustive — use judgment on every problem)
- `top-k-frequent-elements` → heap + bucket sort (+ sort); `kth-largest-element-in-an-array` /
  `k-closest-points-to-origin` → sort + heap + **quickselect**
- `number-of-islands` → DFS + BFS + **union-find**; `longest-consecutive-sequence` → hashset +
  union-find (+ sort)
- `coin-change` → DP + **BFS**; `word-break` → DP + BFS (+ trie); `jump-game-ii` → greedy + DP
- `maximum-subarray` → Kadane + **divide & conquer** (+ DP); `climbing-stairs` → DP + math (Fibonacci)
- `course-schedule` → DFS cycle-detection + BFS (Kahn); `clone-graph` / `pacific-atlantic-water-flow`
  → DFS + BFS
- `task-scheduler` → heap + greedy-math; `gas-station` → brute + greedy
- `single-number` → XOR + hashset (+ math); `missing-number` → XOR + Gauss sum + sort
- `pow-x-n` → fast-power recursive + iterative; `reverse-linked-list` → iterative + recursive
- `validate-binary-search-tree` → bounds-recursion + inorder; `kth-smallest-element-in-a-bst` →
  recursive inorder + iterative stack

## Teaching value — this is the whole point
Each NEW tier's `keyIdea` (1–3 sentences) must do TWO things:
  (a) the core insight of THIS approach, and
  (b) **WHEN you'd reach for it over the alternatives** — the trade-off. E.g.:
  _"Quickselect partitions around a pivot to find the k-th order statistic in average O(n). Reach for
  it over a heap when you can mutate the array and want the best average time; use the heap instead
  when k is small or the data arrives as a stream, and plain sort when you also need everything in
  order."_
That "when to pick which" is exactly what she needs. Put it in the `keyIdea`, not only in comments.

## Tier shape & quality (same contract as the original authoring)
- Shape: `{ label, keyIdea, code, timeComplexity, spaceComplexity }`. **Complexity REQUIRED on every
  tier** (time AND space).
- `label` names the approach: `"Brute force"`, `"Better — <technique>"`, `"Optimal — <technique>"`,
  `"Alternative — quickselect"`, `"Alternative — union-find"`, `"Alternative — BFS"`, etc.
- `code`: **correct, idiomatic, LeetCode-runnable Python 3.** Use the SAME `class Solution` method
  name/signature the existing tiers use (so all tiers are drop-in interchangeable). Add short
  `# comments` on non-obvious lines — she is learning Python from this code. NO pseudocode, NO
  `...`, NO placeholders. Every snippet must compile AND actually produce correct answers.
- Order `solutions[]` as a teaching arc: **brute → better → optimal → other distinct paradigms.**
  Keep the existing optimal as the optimal; equal-standing alternatives come after it.

## Before you finish — self-validate (from repo root `/Users/sumanth.naik/Documents/dsa-journey`)
```
jq empty data/patterns/<id>.json && echo "JSON OK"
python3 - <<'PY'
import json
d=json.load(open("data/patterns/<id>.json"))
for p in d["problems"]:
    for s in p["solutions"]:
        assert all(k in s for k in ("label","keyIdea","code","timeComplexity","spaceComplexity")), p["id"]
        compile(s["code"], p["id"]+"::"+s["label"], "exec")
print("OK", d["id"], sum(len(p["solutions"]) for p in d["problems"]), "snippets across", len(d["problems"]), "problems")
PY
```
Fix anything that fails. Your final message must report: pattern id; #problems; snippet count
before → after; per problem, which approaches you added; and any problem you deliberately left at a
single tier (with the one-line reason). Do NOT touch any file other than your one pattern JSON.
