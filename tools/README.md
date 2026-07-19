# Authoring guide

All learning content lives in `data/` as plain JSON. The hosted site loads only these
static files — there is **no build step required to deploy**.

## Add or edit a problem

1. Open the relevant `data/patterns/<pattern>.json` (copy `_template.json` for a new pattern).
2. Add a problem object to `problems[]`. Required-ish fields:
   - `id` (kebab-case, unique), `title`, `leetcodeSlug` (or `"unknown"`), `difficulty`.
   - `keyIdeas` — the problem-level idea shown in the **Key Ideas** review view (markdown).
   - `hints[]` — progressive, revealed one at a time.
   - `solutions[]` — ordered brute → better → optimal, each `{ label, keyIdea, code, timeComplexity, spaceComplexity }`.
3. Regenerate the manifest index:
   ```bash
   node tools/build-data.mjs
   ```

## Reuse code from the Striver-191 repo

Instead of pasting code inline, a solution may reference a file in a **local checkout** of the
solutions repo:

```json
{ "label": "Optimal", "keyIdea": "…", "codeFile": "Two Pointer/containerWithMostWater.py",
  "timeComplexity": "O(n)", "spaceComplexity": "O(1)" }
```

Then run:

```bash
node tools/build-data.mjs --repo /path/to/Striver-191
```

The script inlines the file contents into `code`. (Without `--repo`, `codeFile` refs are left
as-is and only the manifest is rebuilt.)

## New pattern / phase

- Create `data/patterns/<new>.json` from `_template.json`.
- Add the pattern's `tagline` and phase membership in `data/manifest.json` under `patterns` (or
  let the script fill `patterns`/`problemIndex` — you still add the phase entry + tagline by hand).
- Add/adjust the phase in `manifest.json` `phases[]`.

The site renders whatever data is present, so you can ship one phase at a time.
