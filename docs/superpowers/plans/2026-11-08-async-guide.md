# Async Guide Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `async.html`, a guide to mastering async TypeScript in Playwright tests (with multi-browser, multi-actor scenarios), and grow the page switch to four tabs with a phone layout that scales to five.

**Architecture:** A new data module `js/async.js` feeds the existing `renderGuide(sections, { linkColumns })` in `js/guide.js`. No renderer changes. The tab and cross-page tests move into one `tests/page-switch.spec.js`, driven by a `PAGES` list in `tests/helpers/guide.js`, before the fourth tab is added. A new `tests/async-guide.spec.js` mirrors the locator spec and adds async content rules.

**Tech Stack:** Vanilla ES2022 modules, HTML5, CSS3, `@playwright/test` 1.65.0. No build step, no CDN.

**Spec:** `docs/superpowers/specs/2026-11-08-async-guide-design.md`

## Global Constraints

- Vanilla ES modules, no build step, no CDN or Google Fonts, no runtime dependencies. No TypeScript dependency is added.
- Prettier style: 2 spaces, single quotes, semicolons, ES5 trailing commas, ~100 columns (`js/`, `tests/`).
- Guide CSS scoped under `.guide`. Page-switch links use `.page-tab`. `js/guide.js` is not forked or changed.
- Dashboard palette only. New tab accent: `--accent: #f996a9` on `.icon-async`.
- Examples are TypeScript and use only APIs in `@playwright/test` 1.65.0, checked in `node_modules/playwright-core/types/types.d.ts` and `node_modules/playwright/types/test.d.ts`. Version notes never name a version above 1.65.
- Healthcare-style app throughout (doctor, patient, nurse, admin, receptionist). No real people or brands.
- No em dash `—` or en dash `–` in guide data. Every code example ≥ 20 characters with balanced `()`, `[]`, `{}` and quotes.
- Do not edit `js/meta.json`. Meta-bar fallbacks in `async.html` equal those in `index.html`.
- Each commit message ends with the `Co-Authored-By` line from the session's attribution reminder.
- `npm test` (chromium, iPhone 16, Pixel 7), `npm run lint` and `npm run format:check` pass before the work is complete.

## Coordination with the mocking plan

`docs/superpowers/plans/2026-11-08-mocking-guide.md` also adds a tab and does the same test consolidation. Whichever plan runs second:
- skips its own Task 1 if `tests/page-switch.spec.js` and `PAGES` already exist,
- appends its page to `PAGES`, and relies on this plan's count-aware phone layout (five tabs wrap 3 + 2) instead of the mocking plan's fixed 2 × 2 grid.

## Decisions this plan makes

- **Names:** page `async.html`, module `js/async.js`, `window.asyncSections`, tab label `Async`, icon class `icon-async`, h1 `Playwright Async Cheat Sheet`, `<title>⚡ Playwright Async Guide</title>`.
- **Section ids and row counts:** `basics` 6, `awaits` 7, `loops` 5, `parallel` 6, `multi-user` 7, `handoffs` 6, `events` 5, `structure` 7, `summary` 5.
- **Flags and tags:** all 7 `awaits` rows flagged (no tag); `loops` `forEach(async` row `<tag>Broken</tag>`; `parallel` same-page `Promise.all` row `<tag>Race</tag>`; `handoffs` sleep row `<tag>Avoid</tag>`; `structure` shared-`beforeAll`-page row `<tag>Fragile</tag>`. Flag total 11; tags in page order `['Broken', 'Race', 'Avoid', 'Fragile']`.
- **Linked columns:** `{ parallel: 0, handoffs: 1, events: 1, structure: 0 }`.
- **Summary rows** (Situation · Do this · Rule of thumb): any Playwright call → await it; waiting for something → assert it, don't sleep; an action triggers an event → register the wait first; several independent things → `Promise.all` across pages, never on one page; more than one user → a context per actor, closed in teardown.
- **Phone tabs:** below 600px, `.page-switch { display: flex; flex-wrap: wrap; justify-content: center; --cols: 2; }`, `.page-switch:has(> .page-tab:nth-child(5)) { --cols: 3; }`, each `.page-tab` `flex: 0 0 calc((100% - (var(--cols) - 1) * 6px) / var(--cols))`, gap 6px. Remove the `max-width: 380px` rule.

## Review Focus

1. A 360px phone shows the tabs in at most two centred rows, equal widths, nothing clipped, on every page, and still does when a fifth tab is added. (Task 2)
2. An unflagged example never floats a promise or skips `await` on a web-first assertion. A reader copying it must get a correct test. (Task 3)
3. Every multi-user example closes what it opens and synchronises actors on visible state, never on time. (Task 3)
4. The new icon's accent must not inherit the waiting icon's spin. (Task 2)
5. The meta-bar fallbacks stay identical across all pages. (Task 2)

---

### Task 1: One home for the page-switch and cross-page tests

Identical to Task 1 of `docs/superpowers/plans/2026-11-08-mocking-guide.md`: create `tests/page-switch.spec.js`, move the waiting spec's `Waiting guide: page switch` block and the locator spec's `page switch`, `cross-page` and `icon animation` blocks into it, and drive every test from `PAGES` and `fallbacks()` in `tests/helpers/guide.js`. Follow that task's steps and its interface (`PAGES` entries `{ path, tab, icon, accent }`). Skip this task if it is already done.

- [ ] **Step 1:** Do mocking-plan Task 1, Steps 1 to 3. Expected: all moved tests pass, and none are lost.
- [ ] **Step 2: Commit:** `test: one home for the page-switch and cross-page tests`.

---

### Task 2: The Async tab, its icon, the scaling phone layout and the page shell

**Files:**
- Create: `async.html`, `js/async.js`, `tests/async-guide.spec.js`
- Modify: `index.html`, `waiting.html`, `locators.html` (and `mocking.html` if it exists), `style.css`, `tests/helpers/guide.js`, `tests/page-switch.spec.js`

**Interfaces:**
- Consumes: `PAGES`, `fallbacks`, `mockBackends`, `MOCK_DATE` from `tests/helpers/guide.js`; `renderGuide(sections, { linkColumns })`.
- Produces: `PAGES` gains `{ path: '/async.html', tab: 'Async', icon: 'async', accent: 'rgb(249, 150, 169)' }`, appended last. `async.html` has the `locators.html` shell with this guide's title, h1, lede and pills. `js/async.js` sets `window.asyncSections = SECTIONS` (empty for now) and calls `renderGuide(SECTIONS, { linkColumns: LINK_COLUMN })`.

- [ ] **Step 1: Write failing tests.**
  - Append the `PAGES` entry. Every Task 1 test now expects the new tab.
  - Replace the phone-row test in `tests/page-switch.spec.js` with `on phones the tabs wrap into at most two centred rows`: at widths 360 and 390, per page, group `.page-tab` boxes by `top`; at most 2 rows; row sizes `[ceil(n/2), floor(n/2)]`; all widths equal (±1px); each row's left and right gaps to `.page-switch` content edges are equal (±1px, centred); none clipped; no page sideways scroll.
  - Add `the phone layout holds for five tabs`: inject a fifth `.page-tab` clone into `.page-switch` with `page.evaluate`, then the same assertions give rows `[3, 2]`.
  - Add `on desktop the tabs share one row`: at 1280, a single `top`.
  - Add `each icon animates only its own parts`: on `/async.html` reached by its tab, `.icon-async .accent` computed `animationName` is `handoff`, never `spin-back`; on `/waiting.html` reached by its tab, `.icon-waiting .accent` is `spin-back`.
  - In `tests/async-guide.spec.js` (`mockBackends`, same layout as the locator spec): `loads at /async.html and /async with title, h1, logos and the dashboard stylesheet`; `meta-bar shows only the playwright and last-updated badges`; `failed fetches leave the exact fallback values in place`; `the pills read the five async rules` (`['Await every call', 'Register before you trigger', "Assert, don't sleep", 'Parallel only when independent', 'Close what you open']`, none `.warn`); `counts one visit per session from the guide`.
- [ ] **Step 2: Run** `npx playwright test tests/page-switch.spec.js tests/async-guide.spec.js --project=chromium`. Expected: FAIL.
- [ ] **Step 3: Build it.**
  - `async.html`: copy `locators.html`; set the title, h1, lede (spec text), pills and `js/async.js`; put `aria-current` on the Async tab.
  - Async tab, last, on every page: `<a class="page-tab" href="async.html"><svg class="tab-icon icon-async" viewBox="0 0 20 20" aria-hidden="true" focusable="false">…</svg>Async</a>`. Icon: two lanes (`<path d="M3 6h14"/><path d="M3 14h14"/>`) and a hand-off arrow from the upper lane to the lower as `<path class="accent handoff" …/>` with an arrowhead. Tune by eye to match the other icons' weight.
  - `style.css`: `.icon-async { --accent: #f996a9; }`. In the reduced-motion block, scope the waiting accent rule to `.icon-waiting.play .accent:not(.solid)`; add `.icon-async.play .handoff { stroke-dasharray: 24; animation: handoff 0.6s ease-out; }` and `@keyframes handoff { from { stroke-dashoffset: 24; } }`. Add the phone layout from the Decisions list, and delete the 380px rule and the stale "Three equal tabs" comment.
- [ ] **Step 4: Run** `npx playwright test tests/page-switch.spec.js tests/async-guide.spec.js tests/waiting-guide.spec.js tests/locator-guide.spec.js`. Expected: all pass in all three projects.
- [ ] **Step 5: Look at it.** Screenshot the switch on every page at 1280 and 360, plus the injected five-tab case at 360, into the scratchpad and read the images. The icons should read as one set and the rows should be centred. Fix by eye, then re-run Step 4.
- [ ] **Step 6: Commit:** `feat: add the Async tab, a scaling phone tab layout and the async guide shell`.

---

### Task 3: Async guide content and its rules

**Files:**
- Modify: `js/async.js`, `tests/async-guide.spec.js`

**Interfaces:**
- Consumes: Task 2's page and module; `plain`, `unbalanced`, `contrastOf` from `tests/helpers/guide.js`.
- Produces: `SECTIONS` (nine sections, shape `{ id, title, note?, text?, cols, rows: [c0, c1, c2, flag?][] }`) and `LINK_COLUMN = { parallel: 0, handoffs: 1, events: 1, structure: 0 }`.

- [ ] **Step 1: Confirm the lint rule names** in the spec's "To check while writing" list against the `typescript-eslint` and `eslint-plugin-playwright` docs. Keep confirmed names only, and record any drop in the ledger.
- [ ] **Step 2: Write failing tests** in `tests/async-guide.spec.js`, mirroring the locator spec's `sections`, `links to the dashboard`, `copy buttons`, `layout`, `content` (generic parts) and `colours` blocks with this guide's ids, columns and the counts, flags and tags from the Decisions list. Add these async content rules over `window.asyncSections`, on unflagged rows unless stated:
  - `no floating Playwright calls`: no line ending `;` matches `/^\s*(?:page|\w+Page|context|\w+Context|browser|locator|\w+Button|\w+Field|\w+Row)\.(?!on\(|once\()\w+\(/` (a call statement with no `await`, `return` or assignment). Extend the receiver list if the content uses other names; the test lists them in one array.
  - `web-first assertions are awaited`: no line matches `/^\s*expect\([^)]*\)\.(not\.)?to(BeVisible|BeHidden|HaveText|ContainText|HaveCount|HaveURL|HaveTitle|HaveValue|BeEnabled|BeDisabled|BeChecked|HaveAttribute)\(/`.
  - `discouraged patterns appear only on flagged rows` (all rows): `.forEach(async`, `waitForTimeout(`, `setTimeout(`, `.then(`.
  - `every awaits row shows the flaky way, then the correct way`: `// Flaky` before `// Correct`; the correct half contains `await`.
  - `multi-user examples close what they open`: in `multi-user` and `handoffs`, code containing `newContext(` also contains `.close()` or `await use(`.
  - `hand-offs wait on the receiving side`: every unflagged `handoffs` code contains `await expect(` or `expect.poll(`.
  - `switching is just using the other page`: no code in any row contains `switchTo` or `setActivePage`.
  - `links target the right tiles`: `expect.poll()` → `#search=expect.poll()`, `test.step()` → `#search=test.step()`, `test.extend()` → `#search=test.extend()`.
  - `version notes`, `balanced brackets and quotes`, `no dashes, real code examples` (as in the locator spec).
- [ ] **Step 3: Run** `npx playwright test tests/async-guide.spec.js --project=chromium`. Expected: the section, link, copy and content tests FAIL (empty `SECTIONS`).
- [ ] **Step 4: Write the content** in `js/async.js` per the spec's outline, as TypeScript in the QA-lead voice. The `multi-user` and `handoffs` sections tell one connected story: a typed fixture `test.extend<{ doctorPage: Page; patientPage: Page }>` that opens two contexts from saved `storageState` files and closes them after `await use()`, then the patient sends a message and the doctor sees it, the doctor starts the call and both join with `Promise.all` across the two pages, the nurse-to-doctor queue, the admin approval, and the two-receptionist conflict. Check every option name in the type files.
- [ ] **Step 5: Run** `npx playwright test tests/async-guide.spec.js`. Expected: all pass in all three projects.
- [ ] **Step 6: Prove the rules bite.** Temporarily, one at a time in unflagged rows: drop an `await` before an action; drop the `await` before a web-first `expect`; add `.forEach(async`; remove a `.close()` from a multi-user example; replace a hand-off assertion with `waitForTimeout`. Run `-g "content"` each time (expected: the matching test fails), then `git checkout -- js/async.js`.
- [ ] **Step 7: Run** `npm run lint` and `npm run format:check`. Expected: clean.
- [ ] **Step 8: Commit:** `feat: add the async guide content`.

---

### Task 4: Docs, release sync and final verification

**Files:**
- Modify: `CLAUDE.md`, `AGENTS.md`, `readme.md`, `.claude/skills/playwright-release-sync/SKILL.md`, `docs/superpowers/plans/2026-11-08-mocking-guide.md`

- [ ] **Step 1: Docs.** In `CLAUDE.md`: add `async.html`, `js/async.js`, `tests/async-guide.spec.js` and `tests/page-switch.spec.js` to the layout tree; add the async guide to "Guide Pages"; change the switch list to include Async; describe the scaling phone layout (replacing the 13px note); point "Adding a guide" at `PAGES`; update the meta-bar fallback page count. Mirror the guide list in `AGENTS.md` and the features list in `readme.md`.
- [ ] **Step 2: Release sync.** List `async.html` among the pages holding `#pw-version` / `#last-updated` fallbacks in the skill's step 8.
- [ ] **Step 3: Mocking plan.** In its Task 2, replace the fixed 2 × 2 grid and the 380px removal with: "Phone layout already scales (async plan). Append the Mocks entry to `PAGES`; the page-switch tests expect rows `[3, 2]`." Remove its Task 1 if it was done here.
- [ ] **Step 4: Verify.** Run `npm run lint`, `npm run format:check`, `npm test`. Expected: clean, and all tests pass in all three projects. Also `grep -rn "googleapis\|cdn\." async.html js/async.js` returns nothing.
- [ ] **Step 5: Commit:** `docs: document the async guide and the four-tab switch`. Leave the push and any PR to the owner.
