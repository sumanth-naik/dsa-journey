#!/usr/bin/env node
// validate-js.mjs — Syntax check all JavaScript files

import { execFileSync } from 'child_process';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';

function findJsFiles(dir) {
  const files = [];
  for (const item of readdirSync(dir)) {
    const path = join(dir, item);
    const stat = statSync(path);
    if (stat.isDirectory() && item !== 'node_modules' && item !== '.git') {
      files.push(...findJsFiles(path));
    } else if (stat.isFile() && item.endsWith('.js')) {
      files.push(path);
    }
  }
  return files;
}

const jsFiles = findJsFiles('js');
let errors = 0;

console.log(`Validating ${jsFiles.length} JavaScript files...\n`);

for (const file of jsFiles) {
  try {
    execFileSync('bun', ['build', file, '--target=browser'], { encoding: 'utf-8', stdio: 'pipe' });
    console.log(`  ✓ ${file}`);
  } catch (err) {
    console.error(`  ✗ ${file}`);
    console.error(err.stderr);
    errors++;
  }
}

console.log(errors ? `\n✗ ${errors} files with syntax errors` : '\n✓ All JavaScript files valid');
process.exit(errors > 0 ? 1 : 0);
