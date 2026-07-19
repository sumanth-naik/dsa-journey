# Authoring contract — one pattern file

You are authoring ONE `data/patterns/<id>.json` file for a concept-first DSA learning site.
**Audience: Shirisha — a Goldman Sachs engineer, 5 years experience. She knows data structures
cold but is NEW TO PYTHON. She learns concept-first and dislikes being handed a cold problem.**
So: teach the pattern's idea first, bake Python idioms into the explanations (never a separate
"learn Python" aside), and keep a warm, concise, peer-to-peer tone (no condescension, no fluff).

## Read these first
- The gold-standard exemplar: `data/patterns/two-pointers.json`. **Match its depth and voice.**
- The JSON schema below. Your file MUST validate and every Python snippet MUST compile.

## Exact file shape
```json
{
  "id": "<pattern-id>",            // kebab-case, given to you
  "name": "<Human Name>",          // given to you
  "phaseId": <int>,                // given to you
  "order": <int>,                  // given to you (position within the phase)
  "tagline": "<one line>",         // given to you (or write a crisp one)
  "concept": "## The idea\n\n...markdown...\n\n## Python you'll pick up here\n\n- ...",
  "whenToUse": ["cue 1", "cue 2", "cue 3", "cue 4"],
  "problems": [ <problem>, ... ]   // in LEARNING ORDER (easiest/most-foundational first)
}
```

### `concept` (markdown string, `\n` for newlines)
- Start with `## The idea` — explain the PATTERN conceptually, assuming strong DS knowledge.
- End with a `## Python you'll pick up here` bullet list of the specific Python idioms/syntax the
  problems below use (e.g. `collections.deque`, `heapq`, `dict.get(k, 0)`, slicing, `enumerate`).
- Keep it tight — think 150–300 words. This is shown BEFORE any problem.

### each `<problem>`
```json
{
  "id": "<kebab-case-unique>",           // usually the LeetCode slug
  "title": "<Problem Title>",
  "leetcodeSlug": "<canonical-leetcode-slug>",   // MUST be the real slug (see rules)
  "difficulty": "Easy | Medium | Hard",  // MUST match LeetCode's label
  "patternId": "<this pattern id>",
  "tags": ["array", "..."],
  "video": { "title": "NeetCode — <Title> (Python)", "url": "<SEARCH URL, see rules>", "lang": "python" },
  "keyIdeas": "PROBLEM-LEVEL insight (markdown). This feeds the fast-revision view — it must let
               her recall the whole approach on its own. Connect it to the pattern. 2–4 sentences.",
  "hints": [ "nudge, don't reveal", "more concrete", "essentially the approach" ],
  "solutions": [ <tier>, ... ]           // ordered brute -> better -> optimal
}
```

### each `<tier>` in `solutions`
```json
{
  "label": "Brute force" | "Better" | "Optimal" | "Optimal — <technique>",
  "keyIdea": "the insight for THIS specific tier (1–2 sentences)",
  "code": "class Solution:\n    def method(self, ...):\n        ...",   // valid Python, \n newlines
  "timeComplexity": "O(...)",
  "spaceComplexity": "O(...)"
}
```
- Give **2 tiers** when a meaningful brute→optimal story exists (most problems). A single clean
  optimal tier is fine when there's no instructive brute force.
- Code must be **correct, idiomatic, LeetCode-runnable Python 3** using the standard `class Solution`
  signature LeetCode expects. Prefer the approach shown in the NeetCode video (the videos are the
  companion). Add short `# comments` on non-obvious lines — she's learning Python from this code.
- **Complexity is REQUIRED on every tier** (time AND space).

## Rules (hard requirements)
1. **LeetCode slug** must be the real canonical slug (e.g. `product-of-array-except-self`,
   `binary-tree-level-order-traversal`, `lowest-common-ancestor-of-a-binary-search-tree`). If a
   problem is LeetCode-Premium/locked (e.g. Meeting Rooms, Alien Dictionary, Graph Valid Tree,
   Encode and Decode Strings, Walls and Gates, Number of Connected Components), STILL use its
   canonical slug — do not invent one. If truly not on LeetCode, set `"unknown"`.
2. **Video URL**: use a YouTube SEARCH url so it can never 404:
   `https://www.youtube.com/results?search_query=NeetCode+<Title+With+Plus+Signs>`
   e.g. `https://www.youtube.com/results?search_query=NeetCode+Valid+Parentheses`.
   (Central post-processing may upgrade these to direct links later — you just build the search URL.)
3. **Difficulty** must match LeetCode exactly.
4. Problems in `problems[]` must be in the exact roster and order you are given.
5. Output ONLY the JSON file (write it to disk). No prose inside the JSON except content fields.

## Optional: reuse Sumanth's own solutions (best-effort, NEVER block on it)
The site owner has a solutions repo `sumanth-naik/Striver-191`. If — and only if — a quick fetch
works, you may add his implementation as an extra tier labeled `"Optimal — <technique> (Sumanth's
solution)"`. Try at most once; if it errors or the file isn't there, just author a canonical
solution instead and move on. Example fetch (bash):
```
gh api "repos/sumanth-naik/Striver-191/contents/<URL-ENCODED PATH>/<file>.py" --jq '.content' | base64 -d
```
Do NOT spend more than a moment on this. Correct authored solutions are the priority.

## Before you finish — self-validate
Write your file, then run (from the repo root `/Users/sumanth.naik/Documents/dsa-journey`):
```
jq empty data/patterns/<id>.json && echo "JSON OK"
python3 - <<'PY'
import json
d=json.load(open("data/patterns/<id>.json"))
for p in d["problems"]:
    for s in p["solutions"]:
        compile(s["code"], p["id"]+"::"+s["label"], "exec")   # raises on bad Python
print("compiled", sum(len(p["solutions"]) for p in d["problems"]), "snippets across", len(d["problems"]), "problems")
PY
```
Fix anything that fails. Your final message back must report: pattern id, #problems, #snippets,
whether JSON+compile passed, and any problem you could not complete.
```
```
