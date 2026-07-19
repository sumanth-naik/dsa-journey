#!/usr/bin/env node
// check-wcag-contrast.mjs — Validate WCAG AA contrast ratios

import { readFileSync } from 'fs';

// WCAG AA: 4.5:1 for normal text, 3:1 for large text (18pt+)
const MIN_NORMAL = 4.5;
const MIN_LARGE = 3.0;

function hexToRgb(hex) {
  let h = hex.replace('#', '');
  // Handle 3-digit hex (#e77 → #ee7777)
  if (h.length === 3) {
    h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  }
  return {
    r: parseInt(h.substr(0, 2), 16) / 255,
    g: parseInt(h.substr(2, 2), 16) / 255,
    b: parseInt(h.substr(4, 2), 16) / 255,
  };
}

function luminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(c => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrast(hex1, hex2) {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  const l1 = luminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = luminance(rgb2.r, rgb2.g, rgb2.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

const css = readFileSync('css/styles.css', 'utf-8');

// Extract color variables
const darkColors = {
  bg: '#0f1420',
  'bg-elev': '#171d2b',
  'bg-elev2': '#1e2638',
  border: '#2a3346',
  text: '#e7ecf3',
  'text-dim': '#9aa7bd',
  accent: '#6ea8fe',
  'accent-soft': '#24406e',
  green: '#43c187',
  amber: '#e8b64c',
  red: '#e77',
  purple: '#b58cf0',
};

const lightColors = {
  bg: '#f6f8fc',
  'bg-elev': '#fff',
  'bg-elev2': '#eef2f9',
  border: '#dde4ef',
  text: '#16202e',
  'text-dim': '#5a677d',
  accent: '#2861d8',
  'accent-soft': '#dce8ff',
};

// Test cases: [foreground, background, context, minRatio]
const tests = [
  // Dark mode
  ['text', 'bg', 'Dark: body text on background', MIN_NORMAL],
  ['text', 'bg-elev', 'Dark: text on card', MIN_NORMAL],
  ['text-dim', 'bg', 'Dark: muted text on background', MIN_NORMAL],
  ['text-dim', 'bg-elev', 'Dark: muted text on card', MIN_NORMAL],
  ['accent', 'bg', 'Dark: accent (links) on background', MIN_NORMAL],
  ['green', 'bg', 'Dark: green status on background', MIN_NORMAL],
  ['amber', 'bg', 'Dark: amber status on background', MIN_NORMAL],
  ['red', 'bg', 'Dark: red status on background', MIN_NORMAL],

  // Primary button (the problematic one!)
  ['#06101f', 'accent', 'Dark: primary button text', MIN_LARGE],

  // Light mode
  ['text', 'bg', 'Light: body text on background', MIN_NORMAL],
  ['text', 'bg-elev', 'Light: text on card', MIN_NORMAL],
  ['text-dim', 'bg', 'Light: muted text on background', MIN_NORMAL],
  ['text-dim', 'bg-elev', 'Light: muted text on card', MIN_NORMAL],
  ['accent', 'bg', 'Light: accent (links) on background', MIN_NORMAL],
];

console.log('='.repeat(70));
console.log('WCAG AA CONTRAST CHECK');
console.log('='.repeat(70));
console.log('Minimum ratios: 4.5:1 (normal text), 3:1 (large/bold text)\n');

let failures = 0;

function getColor(name, mode) {
  const colors = mode === 'light' ? lightColors : darkColors;
  return colors[name] || name; // allow literal hex values
}

for (const [fg, bg, context, minRatio] of tests) {
  const mode = context.startsWith('Light') ? 'light' : 'dark';
  const fgColor = getColor(fg, mode);
  const bgColor = getColor(bg, mode);
  const ratio = contrast(fgColor, bgColor);
  const pass = ratio >= minRatio;

  const status = pass ? '✓' : '✗ FAIL';
  const color = pass ? '\x1b[32m' : '\x1b[31m';
  const reset = '\x1b[0m';

  console.log(`${color}${status}${reset} ${context}`);
  console.log(`   ${fgColor} on ${bgColor} → ${ratio.toFixed(2)}:1 (need ${minRatio}:1)`);

  if (!pass) failures++;
}

console.log('\n' + '='.repeat(70));
if (failures === 0) {
  console.log('✓ All contrast ratios pass WCAG AA');
} else {
  console.log(`✗ ${failures} contrast failures`);
  process.exit(1);
}
