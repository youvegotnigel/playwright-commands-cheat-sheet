#!/usr/bin/env node
// Verifies that every `docs` URL in js/data/ resolves on playwright.dev and,
// when the URL has a #fragment, that the anchor exists on the page.
//
// data-integrity.spec.js only checks that a URL is https and mentions
// playwright.dev. It cannot catch a renamed page or a moved heading, which is
// exactly what drifts between Playwright releases.
//
// Usage (from the repo root):
//   node .claude/skills/playwright-release-sync/scripts/check-docs-links.mjs
//   node .claude/skills/playwright-release-sync/scripts/check-docs-links.mjs --only=Query,CLI
//
// Exit code 0 when every link is good, 1 when any page or anchor is missing,
// 2 when the checker itself could not run (e.g. no network).

import { pathToFileURL } from 'node:url';
import path from 'node:path';

process.removeAllListeners('warning'); // silence the MODULE_TYPELESS_PACKAGE_JSON notice

const repoRoot = process.cwd();
const only = (process.argv.find((a) => a.startsWith('--only=')) ?? '')
  .slice('--only='.length)
  .split(',')
  .filter(Boolean);

let categories;
try {
  ({ categories } = await import(pathToFileURL(path.join(repoRoot, 'js/data/index.js')).href));
} catch (err) {
  console.error(`Could not import js/data/index.js from ${repoRoot}. Run from the repo root.`);
  console.error(err.message);
  process.exit(2);
}

// page URL (no fragment) -> [{ cat, name, anchor }]
const byPage = new Map();
for (const { cat, items } of categories) {
  if (only.length && !only.includes(cat)) continue;
  for (const { name, docs } of items) {
    const url = new URL(docs);
    const anchor = decodeURIComponent(url.hash.slice(1));
    url.hash = '';
    const key = url.href.replace(/\/$/, '');
    if (!byPage.has(key)) byPage.set(key, []);
    byPage.get(key).push({ cat, name, anchor, docs });
  }
}

// Docusaurus ships minified HTML, so ids appear both quoted and unquoted.
const hasAnchor = (html, anchor) => {
  const esc = anchor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`id=(?:"${esc}"|'${esc}'|${esc}(?=[\\s>]))`).test(html);
};

async function fetchPage(url, attempt = 1) {
  try {
    const res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(20_000) });
    return { status: res.status, finalUrl: res.url, html: res.ok ? await res.text() : '' };
  } catch (err) {
    if (attempt < 3) return fetchPage(url, attempt + 1);
    return { status: 0, error: err.message, html: '' };
  }
}

const pages = [...byPage.keys()];
const results = new Map();
const CONCURRENCY = 6;
let next = 0;
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    while (next < pages.length) {
      const url = pages[next++];
      results.set(url, await fetchPage(url));
    }
  })
);

if ([...results.values()].every((r) => r.status === 0)) {
  console.error('Every request failed. Is the network available?');
  process.exit(2);
}

const failures = [];
for (const [url, entries] of byPage) {
  const r = results.get(url);
  for (const e of entries) {
    if (r.status !== 200) {
      failures.push({ ...e, problem: `page returned ${r.status || r.error}` });
    } else if (new URL(r.finalUrl).pathname.replace(/\/$/, '') !== new URL(url).pathname) {
      // playwright.dev redirects unknown or renamed pages; treat as a move.
      failures.push({ ...e, problem: `page redirected to ${r.finalUrl}` });
    } else if (e.anchor && !hasAnchor(r.html, e.anchor)) {
      failures.push({ ...e, problem: `anchor #${e.anchor} not found on page` });
    }
  }
}

const total = [...byPage.values()].reduce((n, list) => n + list.length, 0);
if (!failures.length) {
  console.log(`OK: ${total} docs links across ${pages.length} pages all resolve.`);
  process.exit(0);
}

console.log(`FAIL: ${failures.length} of ${total} docs links are broken.\n`);
for (const f of failures) {
  console.log(`- [${f.cat}] ${f.name}\n    ${f.docs}\n    ${f.problem}`);
}
process.exit(1);
