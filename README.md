# DSA Learning Path

> **Learn DSA patterns one at a time.** Concept-first learning with 133 curated problems across 18 patterns.

🔗 **[Live Site](https://sumanth-naik.github.io/dsa-journey/)**

## Features

✨ **Concept-First Learning** - Understand the pattern before solving problems  
🎯 **Curated Quality** - 133 important problems (max 5 per subcategory)  
📊 **Progress Tracking** - Spaced repetition & cross-device sync via GitHub Gist  
🚫 **No Paywalls** - All important problems are LeetCode free tier  
📱 **Mobile Friendly** - Works on phone, tablet, desktop  
👥 **Multi-User** - Each person gets their own progress  

## Quick Start

1. Visit [sumanth-naik.github.io/dsa-journey](https://sumanth-naik.github.io/dsa-journey/)
2. Enter your name
3. Start with any pattern
4. (Optional) Add GitHub token in Settings for cross-device sync

## Structure

```
18 Patterns
├─ Two Pointers
├─ Hashing
├─ Sliding Window
├─ Stack
├─ Binary Search
├─ Linked List
├─ Trees
├─ Backtracking
├─ Heap
├─ Graphs
├─ Advanced Graphs
├─ 1-D DP
├─ 2-D DP
├─ Greedy
├─ Intervals
├─ Tries
├─ Math & Geometry
└─ Bit Manipulation

339 Total Problems
├─ 133 Important (curated, free)
├─ 186 Extras (for depth)
└─ 0 Behind paywall (for important)
```

## Quality Standards

- ✅ Max 5 problems per subcategory (enforced)
- ✅ All JavaScript syntax validated
- ✅ All LeetCode links tested
- ✅ No premium problems in important set
- ✅ 48 test cases passing

## Development

```bash
# Install dependencies
bun install

# Run local server
python3 -m http.server 8123

# Validate everything
bun tools/validate-js.mjs              # JS syntax
bun tools/validate-subcategories.mjs   # Max 5 rule
bun tools/check-premium-problems.mjs   # No premium in important
bun tools/build-data.mjs               # Rebuild manifest

# Run tests
bun test
```

## Data Structure

All data is in `data/` folder:
- `manifest.json` - Patterns metadata + problem index
- `patterns/*.json` - Full content (concepts + problems)

Each pattern has:
- **Concept** - Markdown explanation with "when to use"
- **Problems** - Organized by subcategory (≤5 each)
- **Solutions** - Multiple approaches with complexity

## Cross-Device Sync

Optional GitHub Gist sync for progress tracking:

1. Go to Settings
2. Create fine-grained GitHub token (Gists: Read and write)
3. Paste token
4. Your progress syncs across all devices

Data stays in your browser + your private gist. No server involved.

## Philosophy

**Quality > Quantity**: If you can't explain why problem #6 is different from problems #1-5, you don't need problem #6.

**Concept-First**: Learn the pattern, then apply it. Never a cold problem.

**Multi-Solution**: Every problem shows brute → better → optimal, teaching the thought process.

## Credits

Built with:
- Vanilla JavaScript (ES modules)
- No framework, no build step
- [marked](https://marked.js.org/) for markdown
- [highlight.js](https://highlightjs.org/) for syntax highlighting

Problems curated from:
- [NeetCode 150](https://neetcode.io/)
- [Striver's SDE Sheet](https://takeuforward.org/interviews/strivers-sde-sheet-top-coding-interview-problems/)
- Personal practice repository

---

Made with ❤️ for interview prep
