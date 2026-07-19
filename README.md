# Shirisha's DSA Path 🧭

A concept-first, phased path to DSA interview readiness. Learn the **pattern** first, then apply
it — hints and solutions are always one tap away but never forced on you.

**Live site:** https://sumanth-naik.github.io/dsa-journey  *(after Pages is enabled)*

## What's inside

- **Phases → Patterns → Problems.** A breadth-first spiral: the early phases touch the
  highest-frequency interview patterns so you're never stuck grinding one topic.
- **Concept page before every pattern**, with Python idioms baked in (no separate "learn Python").
- Each problem has: a **LeetCode** link, an optional **video**, a **Key Ideas** section,
  **progressive hints**, **tiered solutions** (brute → better → optimal) each with its own idea and
  **Big-O** complexity, and copy-to-clipboard code.
- **Key Ideas review view** — skim the core idea of every problem to revise fast.
- **Progress dashboard** — solved counts, per-pattern coverage, streak, and a spaced-repetition
  "due for revision" queue (1 → 3 → 7 → 21 days).
- **Cross-device sync** via a private GitHub Gist (optional; works fully offline without it).

## Run locally

No build step. Serve the folder with any static server:

```bash
cd dsa-journey
python3 -m http.server 8000
# open http://localhost:8000
```

(Opening `index.html` directly won't work because it fetches JSON via `fetch()`, which browsers
block on `file://`. Use a local server.)

## Add content

See [`tools/README.md`](tools/README.md). Content is plain JSON in `data/`; run
`node tools/build-data.mjs` to rebuild the manifest.

## Tech

Vanilla ES modules + hash routing. Two CDN libraries: `marked` (markdown) and `highlight.js`
(Python highlighting). Hosted as static files on GitHub Pages.
