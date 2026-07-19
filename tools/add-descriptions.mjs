#!/usr/bin/env node
// add-descriptions.mjs — Add problem descriptions from LeetCode GraphQL API

import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

const LEETCODE_GRAPHQL = 'https://leetcode.com/graphql';

async function fetchDescription(titleSlug) {
  const query = `
    query questionContent($titleSlug: String!) {
      question(titleSlug: $titleSlug) {
        content
        topicTags { name }
      }
    }
  `;

  try {
    const response = await fetch(LEETCODE_GRAPHQL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        variables: { titleSlug }
      })
    });

    const data = await response.json();
    if (!data.data?.question?.content) return null;

    // Extract first paragraph (problem description) from HTML
    const html = data.data.question.content;
    const match = html.match(/<p>(.*?)<\/p>/s);
    if (!match) return null;

    // Strip HTML tags and clean up
    const text = match[1]
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/\n+/g, ' ')
      .trim();

    return text;
  } catch (err) {
    console.error(`  ✗ Error fetching ${titleSlug}:`, err.message);
    return null;
  }
}

async function processPatternFile(filePath) {
  console.log(`\nProcessing ${filePath}...`);

  const content = readFileSync(filePath, 'utf-8');
  const pattern = JSON.parse(content);

  let changed = false;

  for (const problem of pattern.problems) {
    if (problem.description) {
      console.log(`  • ${problem.id}: already has description`);
      continue;
    }

    if (!problem.leetcodeSlug) {
      console.log(`  • ${problem.id}: no leetcodeSlug, skipping`);
      continue;
    }

    console.log(`  • ${problem.id}: fetching...`);
    const description = await fetchDescription(problem.leetcodeSlug);

    if (description) {
      problem.description = description;
      console.log(`    ✓ Added: "${description.slice(0, 60)}..."`);
      changed = true;
    } else {
      console.log(`    ✗ Failed to fetch`);
    }

    // Rate limit: wait 500ms between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  if (changed) {
    writeFileSync(filePath, JSON.stringify(pattern, null, 2) + '\n');
    console.log(`  ✓ Saved ${filePath}`);
  } else {
    console.log(`  • No changes needed`);
  }
}

async function main() {
  const files = glob.sync('data/patterns/*.json');

  console.log(`Found ${files.length} pattern files\n`);

  for (const file of files) {
    await processPatternFile(file);
  }

  console.log('\n✓ Done! Run `bun tools/build-data.mjs` to regenerate manifest.');
}

main().catch(console.error);
