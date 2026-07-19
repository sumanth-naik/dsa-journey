#!/usr/bin/env node
// validate-leetcode-links.mjs — Check all LeetCode links are valid and not premium

import { readFileSync } from 'fs';
import { execFileSync } from 'child_process';

const LEETCODE_GRAPHQL = 'https://leetcode.com/graphql';
const DELAY_MS = 500; // Rate limiting

const patternFiles = execFileSync('find', ['data/patterns', '-name', '*.json', '-not', '-name', '_template.json'],
  { encoding: 'utf-8' }).trim().split('\n');

const allProblems = [];
for (const file of patternFiles) {
  const pattern = JSON.parse(readFileSync(file, 'utf-8'));
  for (const p of pattern.problems || []) {
    if (p.leetcodeSlug && p.leetcodeSlug !== 'unknown') {
      allProblems.push({
        id: p.id,
        slug: p.leetcodeSlug,
        title: p.title,
        pattern: pattern.name,
        important: p.important || false
      });
    }
  }
}

console.log(`Validating ${allProblems.length} LeetCode links...\n`);

const premium = [];
const invalid = [];
const valid = [];

async function validate() {
for (let i = 0; i < allProblems.length; i++) {
  const p = allProblems[i];

  if (i > 0 && i % 10 === 0) {
    console.log(`Progress: ${i}/${allProblems.length}...`);
  }

  try {
    const query = JSON.stringify({
      query: `query getQuestionDetail($titleSlug: String!) {
        question(titleSlug: $titleSlug) {
          questionId
          title
          isPaidOnly
          difficulty
        }
      }`,
      variables: { titleSlug: p.slug }
    });

    const result = execFileSync('curl', [
      '-s',
      '-X', 'POST',
      '-H', 'Content-Type: application/json',
      '-H', 'Referer: https://leetcode.com/problems/',
      '--data', query,
      LEETCODE_GRAPHQL
    ], { encoding: 'utf-8' });

    const data = JSON.parse(result);

    if (data.errors) {
      invalid.push({ ...p, error: 'Query error' });
      console.log(`  ✗ ${p.slug} - Query error`);
    } else if (!data.data || !data.data.question) {
      invalid.push({ ...p, error: 'Not found' });
      console.log(`  ✗ ${p.slug} - Not found`);
    } else if (data.data.question.isPaidOnly) {
      premium.push(p);
      if (p.important) {
        console.log(`  ⚠️  ${p.slug} - PREMIUM (marked as important!)`);
      }
    } else {
      valid.push(p);
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, DELAY_MS));

  } catch (err) {
    invalid.push({ ...p, error: err.message });
    console.log(`  ✗ ${p.slug} - ${err.message}`);
  }
}

console.log('\n' + '='.repeat(60));
console.log('VALIDATION RESULTS');
console.log('='.repeat(60));
console.log(`✓ Valid (free): ${valid.length}`);
console.log(`⚠️  Premium: ${premium.length}`);
console.log(`✗ Invalid: ${invalid.length}`);

if (premium.length > 0) {
  console.log('\n' + '='.repeat(60));
  console.log('PREMIUM PROBLEMS (behind paywall):');
  console.log('='.repeat(60));
  for (const p of premium) {
    const star = p.important ? ' ⭐ IMPORTANT' : '';
    console.log(`  ${p.pattern} → ${p.slug}${star}`);
  }
}

if (invalid.length > 0) {
  console.log('\n' + '='.repeat(60));
  console.log('INVALID/BROKEN LINKS:');
  console.log('='.repeat(60));
  for (const p of invalid) {
    console.log(`  ${p.pattern} → ${p.slug} (${p.error})`);
  }
}

// Check if any important problems are premium
const importantPremium = premium.filter(p => p.important);
if (importantPremium.length > 0) {
  console.log('\n' + '='.repeat(60));
  console.log('❌ ERROR: Important problems are premium!');
  console.log('='.repeat(60));
  console.log('These problems are marked as important but require LeetCode Premium:');
  for (const p of importantPremium) {
    console.log(`  - ${p.title} (${p.slug})`);
  }
  console.log('\nFix: Either remove "important" flag or replace with free alternative.');
  process.exit(1);
}

if (invalid.length > 0) {
  console.log('\n❌ Validation failed: ' + invalid.length + ' broken links');
  process.exit(1);
}

console.log('\n✅ All links valid!');
}

validate().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
