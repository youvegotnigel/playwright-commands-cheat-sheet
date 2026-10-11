---
name: playwright-release-sync
description: Use when a new Playwright version is released, when @playwright/test in package.json is behind npm latest, when asked to update or sync the cheat sheet to a Playwright release, or when js/data entries may have drifted from current Playwright (deprecations, changed signatures, broken playwright.dev links).
---

# Playwright release sync

## Overview

Brings `js/data/` in line with a Playwright release: new APIs added, changed and
removed APIs corrected, every `docs` link resolving, version references bumped,
tests pinned, and every gate passing.

**Core principle: what shipped is the truth.** Read the release notes at the release's
git tag and the `.d.ts` files of the installed release. Training data, memory,
`main`-branch docs and Context7 (which indexes `main`) are not evidence. They can
describe unreleased features or miss removed ones.

## When to use

- `release-delta.mjs --check` prints `behind=true`
- Someone asks to "update to Playwright 1.xx" or "sync the cheat sheet"
- A scheduled sync run (`.github/workflows/cheatsheet-sync.yml`)
- Docs links or examples are suspected stale, even with no new release (skip to step 5)

## Workflow

Run everything from the repo root. Make a todo per step.

1. **Measure the gap.**
   `node .claude/skills/playwright-release-sync/scripts/release-delta.mjs --check`
2. **Read the whole delta.**
   `node .claude/skills/playwright-release-sync/scripts/release-delta.mjs`
   Read **every** section of every version in the delta: features, New APIs,
   **Breaking changes**, **Announcements**, deprecations. Announcements carry the
   biggest changes, such as a whole package being frozen or removed.
3. **Bump and install.** `npm install -D @playwright/test@^X.Y.Z`, then
   `npx playwright install chromium webkit`. Tests fail with "Executable doesn't
   exist" until the browsers match.
4. **Triage into a change list** (see the table below). Every item gets an action
   (add, update, rewrite, or skip with a reason).
5. **Check existing entries against the delta.** For each breaking change,
   deprecation or removal, `grep -n` the API across `js/data/` and fix every hit.
   A new API that supersedes an old pattern means updating the old entry's tip too.
6. **Verify, then write.** Before writing any entry, confirm each claim against
   `node_modules/playwright-core/types/types.d.ts` (page, locator, request),
   `node_modules/playwright/types/test.d.ts` (config, fixtures, test, expect) or
   `npx playwright <cmd> --help` (CLI). Follow `references/quality-bar.md` for
   entry rules, placement and tests.
7. **Check every docs link** (the network is required):
   `node .claude/skills/playwright-release-sync/scripts/check-docs-links.mjs`
   Fix every failure, including in entries you did not touch. Find the real
   anchor by listing the page's ids. Do not guess them.
8. **Bump version references and the header badges.**
   - `grep -rn --exclude-dir=node_modules "<old version>" .` must only hit
     history. Expected hits: the `readme.md` badge, the `CLAUDE.md` tech table,
     and the `--version` example in `js/data/cli.js`.
   - In `index.html` the meta bar holds fallback values, shown when the
     runtime fetches fail. Set `#pw-version` to the new version and
     `#cmd-count` to the real count:
     `node --no-warnings -e "import('./js/data/index.js').then(({categories})=>console.log(categories.reduce((n,c)=>n+c.items.length,0)))"`.
     Set `#last-updated` to today's date.
   - Never edit `js/meta.json`. CI stamps the live "last updated" date on
     every push to master, so the merge date shows automatically. A stale date
     on `develop` is expected: the stamp commits land only on master. Editing
     the file there makes the PR conflict.
9. **Pin it with tests.** Add a `Playwright X.Y entries` describe block to
   `tests/data-integrity.spec.js` and update any exhaustive list the change touches.
10. **Run the gates.** All four must pass:
    `npm run lint && npm run format:check && npm test`, plus the link checker.
    In CI, `npm run test:chromium` replaces `npm test`. Run `npm run format`
    if the format check fails.
11. **Report.** The commit or PR body lists every added, updated and fixed entry
    with the version, plus a "Deliberately left out" section that gives a
    one-line reason per release-note item.

## Triage

| Release-note item | Action |
|---|---|
| New user-facing API, option or CLI flag a test author would type | Add an entry, `Added in Playwright vX.Y.` |
| New option on an API that already has an entry | Update that entry's code and tip, `(vX.Y+)` |
| Behaviour change or breaking change | Update every affected entry. Say "Since vX.Y" in its tip |
| Deprecation | Keep the entry, name the replacement in the tip |
| Removal, or a package no longer published | Rewrite to the replacement. Keep a migration entry for the old form |
| Browser versions, OS support, internal reporter APIs, MCP or agent tooling internals | Leave out, and list under "Deliberately left out" |

## Red flags: stop and verify

- Writing a signature or option name you have not seen in the `.d.ts`
- "The release notes only list N new APIs" without having read Announcements and Breaking changes
- Only adding entries, without grepping existing ones for changed behaviour
- A docs anchor you have not confirmed on the live page
- Using a Context7 or `main` docs result that the tag's notes do not mention
- Weakening or deleting an assertion to make a test pass

## Common mistakes

| Mistake | Fix |
|---|---|
| Missed a model change announced in an earlier release | The delta covers every version after the pinned one. Read all of them |
| `docs` link passes the tests but 404s | `data-integrity.spec.js` only checks the domain. Run the link checker |
| Old version left in `index.html` | Step 8 grep, every run |
| API category test fails after adding to it | The test is an exhaustive list. Update it deliberately, with a comment |
| em or en dash in an entry | Use a period, comma or colon. The test suite rejects dashes |
