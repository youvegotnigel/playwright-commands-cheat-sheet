# Network Mocking Guide Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `mocking.html`, a "Network mocking decisions" guide on the shared guide renderer, and grow the page switch to five tabs (Commands · Waits · Selectors · Async · Mocks).

**Architecture:** A new data module `js/mocking.js` feeds the existing `renderGuide(sections, { linkColumns })` in `js/guide.js`. No renderer changes. The tab and cross-page tests move into one `tests/page-switch.spec.js`, driven by a `PAGES` list in `tests/helpers/guide.js`, before the fifth tab is added (the async plan did this). A new `tests/mocking-guide.spec.js` mirrors the locator spec and adds mocking content rules.

**Tech Stack:** Vanilla ES2022 modules, HTML5, CSS3, `@playwright/test` 1.65.0. No build step, no CDN.

**Spec:** `docs/superpowers/specs/2026-11-08-mocking-guide-design.md`

## Global Constraints

- Vanilla ES modules, no build step, no CDN or Google Fonts, no runtime dependencies.
- Prettier style: 2 spaces, single quotes, semicolons, ES5 trailing commas, ~100 columns (`js/`, `tests/`).
- Guide CSS scoped under `.guide`. Page-switch links use `.page-tab`, never `filter-btn`. `js/guide.js` is not forked or changed.
- Dashboard palette only. New tab accent: `--accent: #fbbf24` on `.icon-mocking`.
- Only APIs in `@playwright/test` 1.65.0, checked in `node_modules/playwright-core/types/types.d.ts`. Version notes never name a version above 1.65.
- Healthcare-style app throughout (patients, appointments, records). No real people or brands.
- No em dash `—` or en dash `–` in guide data. Every code example ≥ 20 characters with balanced `()`, `[]`, `{}` and quotes.
- Do not edit `js/meta.json`. Meta-bar fallbacks in `mocking.html` equal those in `index.html`.
- Each commit message ends with the `Co-Authored-By` line from the session's attribution reminder.
- `npm test` (chromium, iPhone 16, Pixel 7), `npm run lint` and `npm run format:check` pass before the work is complete.

## Coordination with the async plan

`docs/superpowers/plans/2026-11-08-async-guide.md` has run: it did the Task 1 consolidation, added the Async tab (so Mocks is the fifth), and brought a phone tab layout that scales with the tab count. Task 1 below is a no-op, Task 2 appends the Mocks entry to the end of `PAGES`, and the page-switch tests expect rows `[3, 2]`.

## Decisions this plan makes

- **Names:** page `mocking.html`, module `js/mocking.js`, `window.mockingSections`, tab label `Mocks`, icon class `icon-mocking`, h1 `Playwright Network Mocking Cheat Sheet`, `<title>🔌 Playwright Mocking Guide</title>`.
- **Section ids and row counts:** `strategy` 7, `outcomes` 6, `matching` 6, `order` 7, `har` 6, `channels` 5, `verify` 5, `pitfalls` 7 (6 if the glob fact is not confirmed, see Task 3 Step 1), `summary` 5.
- **Flags and tags:** `strategy` "mock every request" row `<tag>Avoid</tag>`; `har` "strip secrets" row `<tag>Security</tag>`; every `pitfalls` row flagged, no tag. Flag total 9 (8 without the glob row).
- **Linked columns:** `{ strategy: 0, outcomes: 0, channels: 1, verify: 1 }`.
- **Summary rows** (Need · Use · Rule of thumb): a real journey works → real backend; a specific UI state → `route.fulfill()`; realistic data with one change → `route.fetch()` then `fulfill`; many stable endpoints → `routeFromHAR()`; noise you don't test → `route.abort()`.
- **Phone tabs:** the phone layout already scales (async plan). Append the Mocks entry to `PAGES`; the page-switch tests expect rows `[3, 2]`. Nothing to change in `style.css` for the layout.

## Review Focus

1. A reader on a 360px phone sees five tabs in two centred rows (3 + 2) with nothing clipped, on every page. (Task 2)
2. The new icon's accent must not inherit the waiting icon's spin; each page's click animates only its own icon. (Task 2)
3. A snippet that teaches a mistake must be flagged. Unflagged snippets register routes before `goto`, await them, and resolve every route. (Task 3)
4. Every link chip opens a dashboard search with at least one tile, and the network tiles it targets are the right ones. (Task 3)
5. The five pages' meta-bar fallbacks stay identical, so a release bump can't miss the new page. (Task 2)

---

### Task 1: One home for the page-switch and cross-page tests

Done by the async plan (`tests/page-switch.spec.js`, `PAGES` and `fallbacks()` in `tests/helpers/guide.js` exist). Nothing to do here.

---

### Task 2: The Mocks tab, its icon and the page shell

**Files:**
- Create: `mocking.html`, `js/mocking.js`, `tests/mocking-guide.spec.js`
- Modify: `index.html`, `waiting.html`, `locators.html`, `async.html` (fifth tab), `style.css`, `tests/helpers/guide.js`, `tests/page-switch.spec.js`

**Interfaces:**
- Consumes: `PAGES`, `fallbacks`, `mockBackends`, `MOCK_DATE` from `tests/helpers/guide.js`; `renderGuide(sections, { linkColumns })` from `js/guide.js`.
- Produces: `PAGES` gains `{ path: '/mocking.html', tab: 'Mocks', icon: 'mocking', accent: 'rgb(251, 191, 36)' }`. `mocking.html` has the `locators.html` shell with `#toc`, `#content`, the h1, lede and six pills from the spec. `js/mocking.js` exports nothing; it sets `window.mockingSections = SECTIONS` (empty array for now) and calls `renderGuide(SECTIONS, { linkColumns: LINK_COLUMN })`.

- [ ] **Step 1: Write failing tests.**
  - Append the `PAGES` entry above (last). Every page-switch test now expects five tabs, and the phone layout test expects rows `[3, 2]`.
  - The phone layout, five-tab and desktop one-row tests already exist in `tests/page-switch.spec.js` (async plan). With the fifth page in `PAGES` they expect rows `[3, 2]`. Nothing to add.
  - Add `each icon animates only its own parts`: on `/mocking.html` reached by clicking the Mocks tab, the `.icon-mocking .accent` computed `animationName` is `reply-slide`, never `spin-back`; on `/waiting.html` reached by its tab, `.icon-waiting .accent` is still `spin-back`.
  - In `tests/mocking-guide.spec.js` (Supabase mocked with `mockBackends`, same layout as the locator spec): `loads at /mocking.html and /mocking with title, h1, logos and the dashboard stylesheet` (title matches `/Playwright Mocking Guide/`, h1 `Playwright Network Mocking Cheat Sheet`); `meta-bar shows only the playwright and last-updated badges`; `failed fetches leave the exact fallback values in place`; `the pills read the mocking spectrum, most real first` (`['Real backend', 'Seed via API', 'Modify response', 'Replay HAR', 'Fake response', 'Block']`, none `.warn`); `counts one visit per session from the guide`.
- [ ] **Step 2: Run** `npx playwright test tests/page-switch.spec.js tests/mocking-guide.spec.js --project=chromium`. Expected: FAIL (no fifth tab, no page).
- [ ] **Step 3: Build it.**
  - `mocking.html`: copy `locators.html`, then change the title, h1, lede (spec text), pills, script `js/mocking.js`, and `aria-current` to the Mocks tab.
  - Fifth tab on all four existing pages, after Async: `<a class="page-tab" href="mocking.html"><svg class="tab-icon icon-mocking" viewBox="0 0 20 20" aria-hidden="true" focusable="false">…</svg>Mocks</a>`. Icon: a request arrow (`<path d="M3 7h11"/><path d="M11 4l3 3-3 3"/>`) and a reply arrow as the accent (`<g class="accent reply"><path d="M17 13H6"/><path d="M9 10l-3 3 3 3"/></g>`). Adjust the coordinates by eye to match the other icons' visual weight.
  - `style.css`: `.icon-mocking { --accent: #fbbf24; }`. Inside the existing reduced-motion block (the waiting accent rule is already scoped to `.icon-waiting`), add `.icon-mocking.play .reply { animation: reply-slide 0.45s cubic-bezier(.3,1.4,.5,1); }` with `@keyframes reply-slide { from { transform: translateX(6px); opacity: 0; } }`. Keep it about as long as the Waits spin (0.8s or more, as the Async icon does) so the icons feel alike.
- [ ] **Step 4: Run** `npx playwright test tests/page-switch.spec.js tests/mocking-guide.spec.js tests/waiting-guide.spec.js tests/locator-guide.spec.js`. Expected: all pass in all three projects.
- [ ] **Step 5: Look at it.** Screenshot the page switch on all five pages at 1280 and 360 into the scratchpad and read the images. The five icons should read as one set, and the grid should be centred. Fix by eye, then re-run Step 4.
- [ ] **Step 6: Commit:** `feat: add the Mocks tab and the mocking guide page shell`.

---

### Task 3: Mocking guide content and its rules

**Files:**
- Modify: `js/mocking.js`, `tests/mocking-guide.spec.js`

**Interfaces:**
- Consumes: Task 2's `mocking.html` / `js/mocking.js`; `plain`, `unbalanced`, `contrastOf` from `tests/helpers/guide.js`.
- Produces: `SECTIONS` (nine sections, shape `{ id, title, note?, text?, cols, rows: [c0, c1, c2, flag?][] }`) and `LINK_COLUMN = { strategy: 0, outcomes: 0, channels: 1, verify: 1 }`.

- [ ] **Step 1: Confirm the open fact.** Read playwright.dev/docs/network (glob URL patterns) for 1.65. If `?` and `[]` are not glob syntax, keep the `pitfalls` glob row (7 rows, 9 flags); otherwise drop it (6 rows, 8 flags). Record which in the ledger.
- [ ] **Step 2: Write failing tests** in `tests/mocking-guide.spec.js`, mirroring the locator spec's `sections`, `links to the dashboard`, `copy buttons`, `layout`, `content` (generic parts) and `colours` blocks with this guide's ids, titles, columns and counts:
  - Ids `['strategy','outcomes','matching','order','har','channels','verify','pitfalls','summary']`, row counts from the Decisions list, 9 TOC anchors, flagged-row count, tags exactly `['Avoid', 'Security']`, summary column 3 is prose, every cell equals `plain()` of its data, copy writes the exact source, one copy button per code row, chips stay inside cells at 1280/800/390, the Copy band, phone layout, palette and WCAG AA contrast.
  - `every link opens a dashboard search that shows at least one tile` (de-duplicated hashes), and `links target the network tiles`: the `route.fulfill()` chip → `#search=route.fulfill()`, `page.routeWebSocket()` → `page.routeWebSocket()`, `context.setOffline()` → `context.setOffline()`, `waitForRequest()` → `waitForRequest()`.
  - Mocking content rules, each over `window.mockingSections`, unflagged rows only unless stated:
    - `routes are awaited`: no code matches `/(?<!await )\b(?:page|context)\.route(FromHAR|WebSocket)?\(/`.
    - `routes are registered before navigation`: where code has both, the first `.route(`, `.routeFromHAR(` or `.routeWebSocket(` index is below the first `page.goto(` index.
    - `every route handler resolves the route`: code containing `.route(` also contains one of `route.fulfill(`, `route.continue(`, `route.fallback(`, `route.abort(`.
    - `JSON responses use the json option`: no `body: JSON.stringify(`.
    - `discouraged patterns appear only on flagged rows` (all rows): `waitForTimeout(`, `'networkidle'`, `body: JSON.stringify(` only where `flag === true`.
    - `every pitfall shows the wrong way, then the right way`: each `pitfalls` code has `// Wrong` before `// Right`, and the Right half contains `await`.
    - `the strategy keeps real journeys`: the first `strategy` row's first cell contains `Real backend` and is not flagged.
    - `version notes never name a version above the pinned Playwright`, `balanced brackets and quotes`, `no dashes, real code examples` (as in the locator spec).
- [ ] **Step 3: Run** `npx playwright test tests/mocking-guide.spec.js --project=chromium`. Expected: the new section, link, copy and content tests FAIL (empty `SECTIONS`). Rule tests that pass vacuously on empty data are fine at this point; Step 6 proves they bite.
- [ ] **Step 4: Write the content** in `js/mocking.js` per the spec's section outline, in the QA-lead voice, one healthcare app throughout (`/api/patients`, `/api/appointments`, `/api/records`). Check every option name against `types.d.ts`. Key facts to state correctly: last registered route wins, page routes beat context routes, `notFound` defaults to `abort`, routing disables the HTTP cache, `page.requests()` keeps up to 100 and must be read immediately.
- [ ] **Step 5: Run** `npx playwright test tests/mocking-guide.spec.js`. Expected: all pass in all three projects.
- [ ] **Step 6: Prove the rules bite.** Temporarily break one unflagged snippet per rule (move a `page.route` below `goto`; drop an `await`; delete a handler's `route.fulfill(`; swap `json:` for `body: JSON.stringify(`), run `-g "content"` each time (expected: the matching test fails), then `git checkout -- js/mocking.js`.
- [ ] **Step 7: Run** `npm run lint` and `npm run format:check`. Expected: clean.
- [ ] **Step 8: Commit:** `feat: add the network mocking guide content`.

---

### Task 4: Docs, release sync and final verification

**Files:**
- Modify: `CLAUDE.md`, `AGENTS.md`, `readme.md`, `.claude/skills/playwright-release-sync/SKILL.md`

- [ ] **Step 1: Docs.** In `CLAUDE.md`, add `mocking.html`, `js/mocking.js`, `tests/mocking-guide.spec.js` and `tests/page-switch.spec.js` to the layout tree. Add the mocking guide to "Guide Pages", change the switch to "Commands / Waits / Selectors / Async / Mocks", extend the phone layout note (five tabs wrap 3 + 2), and point "Adding a guide" at `PAGES` in `tests/helpers/guide.js`. Change "Meta-bar fallbacks live in four pages" to five. Mirror the guide list in `AGENTS.md` and the features list in `readme.md`.
- [ ] **Step 2: Release sync.** In the skill's step 8, list `mocking.html` with the other pages that hold `#pw-version` and `#last-updated` fallbacks.
- [ ] **Step 3: Verify.** Run `npm run lint`, `npm run format:check`, `npm test`. Expected: clean, and all tests pass in all three projects. Also `grep -rn "googleapis\|cdn\." mocking.html js/mocking.js` returns nothing.
- [ ] **Step 4: Commit:** `docs: document the network mocking guide and the five-tab switch`. Leave the push and any PR to the owner.
