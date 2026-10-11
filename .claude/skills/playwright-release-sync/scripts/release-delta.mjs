#!/usr/bin/env node
// Prints the Playwright release notes between the version pinned in
// package.json and the latest stable release, read from the release's git tag.
//
// The tag matters: docs on `main` (and Context7, which indexes `main`) already
// describe the next, unreleased version. Notes at the tag describe exactly what
// shipped.
//
// Usage (from the repo root):
//   node .claude/skills/playwright-release-sync/scripts/release-delta.mjs
//       Markdown of every "## Version X.Y" section newer than the pinned minor.
//   node .claude/skills/playwright-release-sync/scripts/release-delta.mjs --check
//       One line, `pinned=1.63.0 latest=1.64.0 behind=true`, for CI gating.
//   ... --to=1.64.0     Compare against a specific release instead of npm latest.
//
// Exit code 0 on success, 2 when npm or GitHub could not be reached.

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const arg = (name) =>
  process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const checkOnly = process.argv.includes('--check');

const parse = (v) => v.replace(/^[\^~>=<\s]+/, '').split(/[.-]/).slice(0, 3).map(Number);
const cmp = (a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const pinnedRaw = pkg.devDependencies?.['@playwright/test'];
if (!pinnedRaw) {
  console.error('No @playwright/test devDependency in package.json. Run from the repo root.');
  process.exit(2);
}
const pinned = parse(pinnedRaw);

let latestRaw = arg('to');
if (!latestRaw) {
  try {
    latestRaw = execFileSync('npm', ['view', '@playwright/test', 'version'], {
      encoding: 'utf8',
    }).trim();
  } catch (err) {
    console.error('npm view failed:', err.message);
    process.exit(2);
  }
}
const latest = parse(latestRaw);
const behind = cmp(pinned, latest) < 0;

if (checkOnly) {
  console.log(`pinned=${pinned.join('.')} latest=${latest.join('.')} behind=${behind}`);
  process.exit(0);
}

if (!behind) {
  console.log(`Pinned ${pinned.join('.')} is already the latest stable release. No delta.`);
  process.exit(0);
}

const tag = `v${latest.join('.')}`;
const url = `https://raw.githubusercontent.com/microsoft/playwright/${tag}/docs/src/release-notes-js.md`;
let notes;
try {
  const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  notes = await res.text();
} catch (err) {
  console.error('Could not fetch release notes:', err.message);
  process.exit(2);
}

// Sections are "## Version 1.64". Patch releases live inside their minor's
// section, so a pinned 1.63.0 -> latest 1.63.2 also prints the 1.63 section.
const sections = notes.split(/^(?=## Version \d+\.\d+)/m).slice(1);
const wanted = sections.filter((s) => {
  const [, maj, min] = s.match(/^## Version (\d+)\.(\d+)/);
  const v = [Number(maj), Number(min)];
  const afterPinned = v[0] > pinned[0] || (v[0] === pinned[0] && v[1] >= pinned[1]);
  const notAfterLatest = v[0] < latest[0] || (v[0] === latest[0] && v[1] <= latest[1]);
  const samePinnedMinor = v[0] === pinned[0] && v[1] === pinned[1];
  return afterPinned && notAfterLatest && (!samePinnedMinor || latest[1] === pinned[1]);
});

console.log(`<!-- Release notes ${pinned.join('.')} -> ${latest.join('.')} from ${url} -->\n`);
console.log(wanted.join('\n').trim());
