# Waiting Guide Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `waiting.html`, a restyled port of `Playwright Waiting Cheat Sheet.html`, as a sister page of the dashboard with a two-way page switch.

**Architecture:** A static page with a small ES module (`js/waiting.js`) that holds the source `SECTIONS` data and renders the eight section tables, highlighting code with the repo's `highlight()`. The version and last-updated badge logic moves out of `app.js` into `js/meta-bar.js`, shared by both pages. All guide CSS goes in `style.css`, scoped under `.guide`.

**Tech Stack:** Vanilla ES2022 modules, HTML5, CSS3, `@playwright/test` for tests. No build step, no CDN.

**Spec:** `docs/superpowers/specs/2026-11-07-waiting-guide-design.md`

## Global Constraints

- Vanilla ES modules, no build step, no CDN or Google Fonts imports, no runtime dependencies.
- Prettier style: 2 spaces, single quotes, semicolons, ES5 trailing commas, ~100 columns (applies to `js/` and `tests/`).
- A new browser global used in `js/` must be added to the `js/**/*.js` globals block in `eslint.config.js`.
- Dashboard palette only: page `#0f172a`, header/code `#020617`, surface `#1e293b`, border `#334155`, text `#e2e8f0` / `#cbd5e1`, muted `#94a3b8`, header green `#2ead33`, sky `#38bdf8`, copied green `#4ade80`, flag/tag orange `#fb923c`.
- Dark only. Fonts: the dashboard's (`Arial, sans-serif`; code `ui-monospace, Menlo, Consolas, monospace`).
- Guide CSS is scoped under `.guide` (existing global `pre` and generic class names would collide).
- Page-switch links use class `page-tab`, never `filter-btn`.
- Do not edit `js/meta.json`. Do not modify or delete `Playwright Waiting Cheat Sheet.html`.
- Each commit message ends with the `Co-Authored-By` line given by the session's attribution reminder.
- `npm test` (chromium, iPhone 16, Pixel 7) must pass before the work is complete.

## Review Focus

Failure modes the spec implies; each has a test in the task that owns it.

1. `/waiting` (the clean-URL redirect `npx serve` applies) and `/waiting.html` both load with CSS and JS intact. (Task 2)
2. A linked method chip must never lead to an empty dashboard grid, and a chip with no dashboard match renders without a link. (Task 4)
3. If `package.json` or `js/meta.json` fail to load, the guide's badges keep their fallback values and are never blank. (Task 2)
4. If the clipboard write is rejected, the Copy button says "Select and copy" instead of failing silently. (Task 4)
5. Code containing `<`, `>` or `&` (for example `Promise<void>`) renders as text and copies unchanged. (Task 3)

---

### Task 1: Housekeeping and shared meta-bar module

**Files:**
- Modify: `.gitignore` (add `.superpowers/`)
- Create: `js/meta-bar.js`
- Modify: `js/app.js` (the `initMetaBar` IIFE, currently ~lines 305-340)
- Guard test (unchanged): `tests/meta-bar.spec.js`

**Interfaces:**
- Produces: `export function loadMetaBadges(): void` in `js/meta-bar.js`. Fetches `./package.json` and `./js/meta.json` (`cache: 'no-cache'`) and writes `v<version>` to `#pw-version` and `lastUpdated` to `#last-updated`. Each element is null-guarded and each fetch fails silently, leaving the HTML fallback.

- [ ] **Step 1: Baseline.** Run `npx playwright test tests/meta-bar.spec.js --project=chromium`. Expected: all pass.
- [ ] **Step 2: Add `.superpowers/` to `.gitignore`.**
- [ ] **Step 3: Create `js/meta-bar.js`** by moving the two `fetch` blocks (version, last-updated) out of `initMetaBar` verbatim, keeping their comments, wrapped in `loadMetaBadges()`.
- [ ] **Step 4: Update `js/app.js`.** Import `loadMetaBadges` from `./meta-bar.js`. `initMetaBar` keeps setting `#cmd-count` and then calls `loadMetaBadges()`. No other behaviour change.
- [ ] **Step 5: Verify.** Run `npx playwright test tests/meta-bar.spec.js --project=chromium` (expected: all pass) and `npm run lint` (expected: no errors).
- [ ] **Step 6: Commit** `.gitignore`, `js/meta-bar.js`, `js/app.js`, the spec and this plan: `refactor: extract shared meta-bar module`.

---

### Task 2: Page shell, page switch and shared top of page

**Files:**
- Create: `waiting.html`, `tests/waiting-guide.spec.js`
- Modify: `index.html` (add the switch between `.meta-bar` and `.container`), `style.css`

**Interfaces:**
- Consumes: `loadMetaBadges()` from Task 1.
- Produces: the DOM contract later tasks build on: `<main class="guide container">` containing `h1`, `p.lede`, `.pills`, `<nav id="toc" aria-label="Sections">` and `<div id="content">`. Both pages contain `<nav class="page-switch" aria-label="Pages">` with two `a.page-tab` links: "Commands" (`index.html`) and "⏱ Waiting guide" (`waiting.html`); the current page's link has `aria-current="page"`.

`waiting.html` content: `lang="en"`, `<title>⏱ Playwright Waiting Guide</title>`, the identical header markup from `index.html`, a meta-bar with only the playwright and last-updated badges (same markup, colours and fallback values as `index.html`), the switch, then the intro block with the source's lede text, the five actionability pills (Visible, Stable, Receives Events, Enabled, Editable) and `h1` "Playwright Waiting Cheat Sheet". No syntax legend. Loads `js/visitor-counter.js` (defer) and, in Task 3, `js/waiting.js`. For this task a small inline-free module script imports `loadMetaBadges` and calls it; Task 3 moves that call into `waiting.js`.

- [ ] **Step 1: Write failing tests** in `tests/waiting-guide.spec.js`. Same `beforeEach` mocks as `cheatsheet.spec.js` (`**/rest/v1/**` to `{ json: [] }`, `**/functions/v1/**` to 200) plus `**/js/meta.json**` returning `{ lastUpdated: '2025-12-25' }`. Tests:
  - `loads at /waiting.html and at the clean URL /waiting`: both have title matching `/Playwright Waiting Guide/`, one `h1` with text `Playwright Waiting Cheat Sheet`, two `header img.header-logo`, and a computed stylesheet applied (`getComputedStyle(document.body).backgroundColor` is `rgb(15, 23, 42)`).
  - `meta-bar shows only the playwright and last-updated badges`: `.meta-badge .k` texts equal `['playwright', 'last updated']`; `#last-updated` has `2025-12-25`.
  - `keeps fallback badge values when package.json and meta.json fail`: abort both routes; `#pw-version` and `#last-updated` are not empty.
  - `shows the five actionability pills`.
  - `page switch is on both pages with aria-current on the current one`: guide has `aria-current="page"` on the "Waiting guide" link; dashboard on "Commands".
  - `page switch navigates both ways`: click through guide to dashboard (URL matches `/\/(index\.html)?$/`) and back (URL matches `/waiting/`).
  - `page switch does not add filter buttons`: on `/`, `.filter-btn` count equals `categories.length + 3`.
  - `counts one visit per session from the guide`: with `navigator.webdriver` false (reuse the init-script pattern from the visitor tests in `tests/meta-bar.spec.js`), loading `/waiting.html` makes exactly one POST to `increment-visitor`, and a reload makes none.
- [ ] **Step 2: Run** `npx playwright test tests/waiting-guide.spec.js --project=chromium`. Expected: FAIL (page missing).
- [ ] **Step 3: Create `waiting.html` and add the switch to `index.html`** as described above.
- [ ] **Step 4: Style in `style.css`.** `.page-switch` (centred flex, gap 8px, padding 14px 16px 0). `.page-tab` (same look as `.filter-btn`: 999px radius, `rgba(255,255,255,0.06)` fill, 700 weight, 15px, `#cbd5e1`, no underline, 6px 14px padding, 0.15s transition); hover `rgba(255,255,255,0.12)`; `[aria-current="page"]` gets `rgba(255,255,255,0.18)` fill, white text, `outline: 2px solid rgba(255,255,255,0.25)`. Under a `/* Waiting guide */` comment: `.guide h1` (`#e2e8f0`, 30px, 25px at max-width 760px), `.guide .lede` (`#94a3b8`, max-width 70ch), `.guide .pills`/`.pill` (`#4ade80` on `rgba(22,163,74,0.2)`, 999px radius, 12.5px, 600). Add a `:focus-visible` rule (`3px solid #f8fafc`, offset 2px) for `.page-tab`.
- [ ] **Step 5: Run the spec** in all three projects: `npx playwright test tests/waiting-guide.spec.js`. Expected: all pass.
- [ ] **Step 6: Run** `npx playwright test tests/cheatsheet.spec.js tests/meta-bar.spec.js --project=chromium`. Expected: pass (dashboard unaffected).
- [ ] **Step 7: Commit:** `feat: add waiting guide page shell and page switch`.

---

### Task 3: Render the eight sections

**Files:**
- Create: `js/waiting.js`
- Modify: `waiting.html` (load `js/waiting.js` as `type="module"`, remove the Task 2 meta-bar script), `style.css`, `tests/waiting-guide.spec.js`

**Interfaces:**
- Consumes: `highlight(code: string): string` from `./highlight.js`; `loadMetaBadges()` from `./meta-bar.js`.
- Produces in `js/waiting.js`:
  - `const SECTIONS` ported verbatim from the source `Playwright Waiting Cheat Sheet.html` (the array at lines 168-407): shape `{ id, title, note?, text?, cols: [string, string, string], rows: [string, string, string, flag?][] }`. Keep the text, order, the `<tag>` markup and the `true` flag exactly. Exposed as `window.waitingSections`.
  - `esc(s: string): string` (HTML-escape `&`, `<`, `>`).
  - `inline(text: string): string`: backtick text becomes `<code class="inl">` containing `highlight()` output; `<tag>X</tag>` becomes `<span class="tag">X</span>`; everything else is escaped. (Task 4 extends this.)
  - `renderGuide(): void`: fills `#toc` with `<a href="#id">NN Title</a>` links and `#content` with one `<section id>` per entry: `h2` (`<span class="num">NN</span>` plus title), optional `p.note`, then a `.table-card` with `<table>` (`colgroup` 25/25/50, `thead` with `th scope="col"`, `tbody`). Cells carry `data-label` = column name. Rows with the flag get class `flag`. The third cell is `inline()` text when `section.text` is true, otherwise `<div class="block"><pre><code>highlighted</code></pre></div>` (Task 4 adds the button). Then `loadMetaBadges()` is called once at module load.

- [ ] **Step 1: Write failing tests** (add to `tests/waiting-guide.spec.js`, using `window.waitingSections`):
  - `renders the eight sections in order`: section ids equal `['actions','assertions','navigation','explicit','not-waits','timeouts','tips','summary']`; each has an `h2` containing its title and its two-digit number.
  - `section index has eight working anchors`: `#toc a` count 8, texts like `01 Auto-waiting: actions`; clicking the last one scrolls `#summary` into the viewport.
  - `row counts match the data`: `tbody tr` counts per section equal `[9, 9, 2, 15, 4, 5, 7, 4]` and equal `rows.length` from `window.waitingSections`.
  - `flagged rows and tags`: `tr.flag` count is 10; `.tag` texts equal `['Avoid', 'Legacy', 'Deprecated']`.
  - `summary third column is prose, not code`: `#summary pre` count 0; every other section row has a `pre`.
  - `tables use column headers`: every `th` has `scope="col"`; first section headers read `Method`, `Checks performed`, `Real-world example`.
  - `code is highlighted with the dashboard palette`: a `.guide pre .tok-keyword` computes to `rgb(56, 189, 248)`; a `.tok-string` to `rgb(74, 222, 128)`.
  - `flagged rows show the orange edge`: first `td` of a `tr.flag` has a `box-shadow` containing `rgb(251, 146, 60)`.
  - `escapes angle brackets in code`: the Page Objects row in `#tips` has `pre` text containing `Promise<void>`, and `#tips pre` contains no child element named `void`.
  - `the guide has no horizontal-scroll-causing syntax legend`: `.legend` count is 0.
- [ ] **Step 2: Run** `npx playwright test tests/waiting-guide.spec.js --project=chromium`. Expected: the new tests FAIL.
- [ ] **Step 3: Implement `js/waiting.js`** as specified. Verify the port with `node --check js/waiting.js` and compare row totals to the numbers above.
- [ ] **Step 4: Style under `.guide`.** `section` (grid, gap 12px, margin-bottom 32px). `h2` (flex, baseline, `#e2e8f0`, 20px; `.num` monospace 13px `#2ead33`). `p.note` (`#94a3b8`, 14px, max-width 75ch). `#toc` (flex wrap, gap 6px 14px, 13.5px; links `#94a3b8` with 1px `#334155` bottom border; hover and focus `#e2e8f0`). `.table-card` (`#1e293b`, 1px `#334155`, 12px radius, overflow hidden). `table` (100%, collapse, `table-layout: fixed`). `th` (12px uppercase, 0.06em tracking, `#94a3b8`, 600, 10px 14px padding, `#334155` bottom border). `td` (12px 14px, top-aligned, `#cbd5e1`, `#334155` bottom border, `min-width: 0`; last row no border). `tr.flag td:first-child` (`box-shadow: inset 3px 0 0 #fb923c`). `.tag` (11px, 700, uppercase, `#fb923c` on `rgba(234,88,12,0.2)`, 4px radius, 1px 6px padding). `code.inl` (`#020617`, `#e2e8f0`, 4px radius, `nowrap`, inline-block, monospace 12.5px). `pre` (`#020617`, 8px radius, 12px 14px padding, monospace ~12.8px/1.6, `white-space: pre`, `overflow-x: auto`, margin 0, no word-break). Widen the six `#m-code .tok-*` selectors in `style.css` to also match `.guide .tok-*` (same colours).
- [ ] **Step 5: Run the spec** in all three projects (`npx playwright test tests/waiting-guide.spec.js`). Expected: all pass.
- [ ] **Step 6: Run** `npm run lint` and `npm run format:check`. Expected: clean (add any new global to `eslint.config.js`; run `npm run format` if needed).
- [ ] **Step 7: Commit:** `feat: render the waiting guide sections`.

---

### Task 4: Copy buttons and links back to the dashboard

**Files:**
- Modify: `js/waiting.js`, `style.css`, `tests/waiting-guide.spec.js`

**Interfaces:**
- Consumes: `categories` from `./data/index.js`; `SECTIONS`, `inline()`, `renderGuide()` from Task 3.
- Produces in `js/waiting.js`:
  - `linkKey(chip: string): string`: the last identifier that is followed by `(` (regex `/([A-Za-z_$][\w$]*)\s*\(/g`, last match), else the whole trimmed chip text. Examples: `page.waitForURL(url)` gives `waitForURL`; `expect(fn).toPass()` gives `toPass`; `page.waitForEvent('popup')` gives `waitForEvent`; `toBeVisible` gives `toBeVisible`.
  - `inline(text: string, link?: boolean): string`: when `link` is true, each backtick chip whose `linkKey` matches a dashboard item (`categories.some((c) => c.items.some((i) => i.name.toLowerCase().includes(key.toLowerCase())))`) renders as `<a class="inl" href="index.html#search=<encodeURIComponent(key)>" title="Open in the commands dashboard">`; other chips stay `<code class="inl">`.
  - Linking applies to column index 0 of `actions`, `navigation`, `explicit`, `not-waits`, and column index 1 of `assertions`.
  - Each code block gets `<button class="guide-copy" type="button" data-section data-row>Copy</button>`. A single delegated click handler copies `SECTIONS[section].rows[row][2]` (the source string, not the DOM text). Success: text `✓ Copied!` plus class `copied` for 2000 ms, then back to `Copy`. Rejection: text `Select and copy` for 2000 ms.

- [ ] **Step 1: Write failing tests:**
  - `every linked chip leads to at least one dashboard item`: collect `.guide a.inl` hrefs; assert at least 20 exist, every href starts with `index.html#search=`, and for each decoded key `window.categories` has an item whose name includes it (case-insensitive).
  - `known chips link with the right search key`: the chips for `page.waitForURL(url)`, `expect(fn).toPass()` and `toBeVisible` link to `#search=waitForURL`, `#search=toPass`, `#search=toBeVisible`.
  - `chips with no dashboard match are plain chips`: in the first column of `#actions`, every `code.inl` (not a link) has a key that matches no item name (computed in `page.evaluate` using `categories`).
  - `chips outside the linked columns are never links`: `#timeouts a.inl`, `#tips a.inl` and `#summary a.inl` counts are 0.
  - `clicking a link opens the dashboard with that search`: click the `waitForURL` chip; URL ends `#search=waitForURL`; `#search-input` has `waitForURL`; at least one `.tile` is visible; `page.goBack()` returns to the guide.
  - `copy button count equals code rows`: `.guide-copy` count is 51.
  - `copy writes the exact source`: stub `navigator.clipboard.writeText` with `addInitScript` to record calls; click the Copy button of the `waitForResponse` row in `#explicit` (multi-line, quotes) and of the `Page` row in `#assertions` (regex `/\\/dashboard/` in source); recorded text equals the matching `window.waitingSections` strings exactly.
  - `copy shows feedback then resets`: after a click the button has text `✓ Copied!` and class `copied`, then returns to `Copy` within 3 s.
  - `copy failure shows Select and copy`: stub `writeText` to reject; button text becomes `Select and copy`, then resets.
- [ ] **Step 2: Run** the spec, chromium. Expected: the new tests FAIL.
- [ ] **Step 3: Implement** `linkKey`, the `link` parameter of `inline()`, the per-column link rule inside `renderGuide()`, the button markup and the delegated handler.
- [ ] **Step 4: Style under `.guide`.** `a.inl` matches `code.inl` plus `text-decoration: none`, `1px solid transparent` border, `#38bdf8` border on hover and `:focus-visible`. `.block` (position relative). `.guide-copy` (absolute, top 6px, right 6px, sky `#38bdf8` fill, `#000` text, 600, 11px, 4px 10px padding, 6px radius, no border, pointer, hover `#7dd3fc`); `.guide-copy.copied` (`#4ade80` fill). Add the `3px solid #f8fafc` focus-visible outline for `a.inl` and `.guide-copy`.
- [ ] **Step 5: Run the spec** in all three projects. Expected: all pass.
- [ ] **Step 6: Run** `npm run lint` and `npm run format:check`. Expected: clean.
- [ ] **Step 7: Commit:** `feat: add copy buttons and dashboard links to the waiting guide`.

---

### Task 5: Phone layout and overflow

**Files:**
- Modify: `style.css`, `tests/waiting-guide.spec.js`

**Interfaces:**
- Consumes: the `data-label` attributes, `.table-card`, `.page-switch` from earlier tasks.

- [ ] **Step 1: Write failing tests:**
  - `no horizontal page scroll`: runs in every project; `document.documentElement.scrollWidth <= window.innerWidth`.
  - `phone layout stacks rows with labelled cells`: set viewport 390x844; `thead` is hidden; each `td` in `#actions` has a `::before` content equal to its `data-label` (check via `getComputedStyle(td, '::before').content`) and `td` display is `block`.
  - `desktop layout shows the table header`: viewport 1280x800; `thead` visible, three `th` in `#actions`.
  - `code scrolls inside its block`: for the widest `pre` at 390 px, `pre.scrollWidth > pre.clientWidth` is allowed but `document.documentElement.scrollWidth <= window.innerWidth`; computed `overflow-x` is `auto` and `white-space` is `pre`.
  - `page tabs share the width on phones`: at 390 px the two `.page-tab` widths differ by at most 1px.
- [ ] **Step 2: Run** the spec, chromium. Expected: the new tests FAIL.
- [ ] **Step 3: Add the `@media (max-width: 760px)` rules** under `.guide`: `table, tbody, tr, td { display: block; width: 100%; }`, `thead, colgroup { display: none; }`, rows divided by `1px solid #334155`, `td` padding 6px 14px with no border, `td::before { content: attr(data-label); display: block; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: #94a3b8; margin-bottom: 3px; }`, `.page-tab { flex: 1; text-align: center; }`, container side padding 16px. Respect `prefers-reduced-motion` by disabling the transitions added in Tasks 2 and 4.
- [ ] **Step 4: Run the full guide spec** in all three projects. Expected: all pass.
- [ ] **Step 5: Look at it.** Start `npx serve -l 3000 .` in the background, take screenshots of `/waiting.html` at 1280 and 390 wide plus `/` to the scratchpad directory with a throwaway script, read the images, and compare against the approved restyle mockup. Fix any spacing or colour that reads as a different site, then stop the server.
- [ ] **Step 6: Commit:** `feat: responsive layout for the waiting guide`.

---

### Task 6: Docs, release-sync skill and final verification

**Files:**
- Modify: `readme.md`, `AGENTS.md`, `CLAUDE.md`, `.claude/skills/playwright-release-sync/SKILL.md`

- [ ] **Step 1: Update docs.** In `CLAUDE.md` and `AGENTS.md`, add to the layout tree: `waiting.html`, `js/waiting.js`, `js/meta-bar.js`, `tests/waiting-guide.spec.js`; add a short "Waiting guide" section (what it is, that `SECTIONS` in `js/waiting.js` is the content source, that `.guide` scopes its CSS, and that links back use `index.html#search=`). In `readme.md`, mention the guide and the page switch in the features list.
- [ ] **Step 2: Update release sync.** In `.claude/skills/playwright-release-sync/SKILL.md` step 8, state that `waiting.html` also holds `#pw-version` and `#last-updated` fallbacks, to be bumped with `index.html`, and that the `grep` for the old version covers it.
- [ ] **Step 3: Verify everything.** Run `npm run lint`, `npm run format:check` and `npm test`. Expected: lint and format clean; all tests pass in chromium, iPhone 16 and Pixel 7. Also `grep -rn "googleapis\|cdn\." waiting.html js/waiting.js js/meta-bar.js` returns nothing.
- [ ] **Step 4: Commit:** `docs: document the waiting guide page`. Leave the push and any PR to the owner.
