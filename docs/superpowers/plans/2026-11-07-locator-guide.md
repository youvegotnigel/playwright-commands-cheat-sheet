# Locator Guide Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `locators.html`, a "Choosing a locator" guide built on a guide renderer shared with the waiting guide, and turn the page switch into three tabs.

**Architecture:** The waiting guide's renderer moves unchanged into `js/guide.js` as `renderGuide(sections, { linkColumns })`. Each guide is then a data module (`js/waiting.js`, `js/locators.js`) plus one HTML page with the same shell. The existing `tests/waiting-guide.spec.js` proves the refactor changed nothing. A new `tests/locator-guide.spec.js` mirrors it and adds checks on the locator content.

**Tech Stack:** Vanilla ES2022 modules, HTML5, CSS3, `@playwright/test` 1.65.0. No build step, no CDN.

**Spec:** `docs/superpowers/specs/2026-11-07-locator-guide-design.md`

## Global Constraints

- Vanilla ES modules, no build step, no CDN or Google Fonts, no runtime dependencies.
- Prettier style: 2 spaces, single quotes, semicolons, ES5 trailing commas, ~100 columns (`js/`, `tests/`).
- Guide CSS scoped under `.guide`. Page-switch links use `.page-tab`, never `filter-btn`.
- Dashboard palette only. The one new style, `.pill.warn`, reuses the tag colours: `#fb923c` text on `rgba(234,88,12,0.2)`.
- No em dash `—` or en dash `–` anywhere in guide data.
- Every code example: at least 20 characters, `await` where Playwright needs it, balanced `()`, `[]`, `{}` and quotes. Uses only APIs in `@playwright/test` 1.65.0. Version notes never name a version above 1.65.
- Healthcare-style app throughout (patients, appointments, records). No real people or brands.
- `tests/waiting-guide.spec.js` changes **only** in its `Waiting guide: page switch` block (labels and three tabs).
- Do not edit `js/meta.json`.
- Each commit message ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- `npm test` (chromium, iPhone 16, Pixel 7) and `npm run lint` pass before the work is complete.

## Decisions this plan makes (the spec left them open or is silent)

- **APIs verified** in `node_modules/playwright-core/types/types.d.ts` (1.65.0): `locator.within(locator)`, `locator.visible()`, `page.getByRef(ref)`, `locator.describe(description)`, `getByRole({ description })`, `filter({ hasNotText, visible })`, `contentFrame()`, `ariaSnapshot()`.
- **Linked columns:** `{ ladder: 0, narrowing: 0, lists: 1, boundaries: 1, strictness: 0, team: 0 }`. In `lists` and `boundaries` the first column is prose (a task or situation) and the method chips sit in column 1, the same way the waiting guide links `assertions` on column 1. `role-options` (option names like `exact: true`), `fragile` (anti-patterns) and `summary` are not linked.
- **Dashboard tiles that exist** (so these chips link): `getByRole()`, `getByLabel()`, `getByPlaceholder()`, `getByText()`, `getByAltText()`, `getByTitle()`, `getByTestId()`, `locator()`, `filter()`, `locator.visible()`, `locator.within()`, `and()`, `or()`, `first() / last()`, `nth()`, `frameLocator()`, `describe()`, `locator.ariaSnapshot()`, `toMatchAriaSnapshot()`, `page.getByRef()`, `locator.all()`, `toHaveCount()`, `toHaveText()`, `page.waitForEvent()`, `codegen`, `testIdAttribute`. **No tile:** `contentFrame()`, so that chip renders plain.
- **Positional methods:** `.nth(`, `.first()` and `.last()` are allowed in unflagged code only in the `lists` section. There the spec makes order the point, and `within()`'s canonical column example needs `.nth()`. Every other discouraged pattern is allowed in code only on flagged rows, in every section.
- **The popup row's link to the waiting guide** is a text cross-reference ("see Explicit waits in the Waiting guide"), not a hyperlink. The renderer must stay unchanged, and its inline markup has no link syntax.
- **Phone tabs** (measured in Chromium and WebKit: three equal tabs, no overflow, no side scroll at 360, 393 and 412px):
  - `@media (max-width: 760px)`: `.page-switch { gap: 6px }` and `.page-tab { flex: 1 1 0; min-width: 0; padding: 6px 4px; gap: 4px }`, replacing today's `flex: 1`.
  - `@media (max-width: 380px)`: `.page-tab { font-size: 13px }`.
  - Above 380px the font stays 15px, so the existing test "page tabs look exactly like the dashboard filter pills" still passes on the iPhone 16 (393px) and Pixel 7 (412px) projects.
- **Flagged rows (12) and tags, in page order:** ladder `locator(css)` <tag>Last resort</tag>; narrowing `first()` / `last()` / `nth()` <tag>Fragile</tag>; boundaries XPath in shadow DOM <tag>Doesn't pierce</tag>; strictness `getByRef()` <tag>Not for tests</tag>; all 7 `fragile` rows (no tag); summary "Structural" row.
- **Test helpers:** the new spec imports `mockBackends`, `contrastOf`, `plain` and `unbalanced` from a new `tests/helpers/guide.js`. The waiting spec keeps its own copies, so the refactor's proof file stays untouched.

## Review Focus

Failure modes the spec implies; each has a test in the task that owns it.

1. On a 360px phone the three tabs fit one row with equal widths and no sideways scroll, and on the iPhone/Pixel projects they still match the filter-pill look. (Task 2)
2. A chip in a linked column for a method with no dashboard tile (`contentFrame()`) renders as a plain chip, never a link to an empty grid. (Task 3)
3. Code with CSS attribute selectors, regex literals with backslashes (`/^Dr\.? Okafor$/`) or `<`/`>` renders as text and copies byte-for-byte from `SECTIONS`. (Task 3)
4. `/locators` (the `npx serve` clean URL) and `/locators.html` both load with CSS and JS. (Task 2)
5. Keyboard users reach the third tab with the white focus ring, and `aria-current` sits on the right tab on each of the three pages. (Task 2)

---

### Task 1: Shared guide renderer

**Files:**
- Create: `js/guide.js`
- Modify: `js/waiting.js` (keep lines 11-445 `SECTIONS` and `window.waitingSections`; remove the markup, copy and render code below them)
- Guard test (unchanged): `tests/waiting-guide.spec.js`

**Interfaces:**
- Produces: `export function renderGuide(sections: Section[], { linkColumns }: { linkColumns: Record<string, 0 | 1> }): void` in `js/guide.js`.
  - `Section = { id, title, note?, text?, cols: [string, string, string], rows: [string, string, string, true?][] }`.
  - It renders `#toc` and `#content`, registers the document click handler for `.guide-copy` (copying `sections[n].rows[row][2]`), and calls `loadMetaBadges()`.
  - `esc`, `chipMethod`, `COMMAND_NAMES`, `searchTerm` and `inline` move into `guide.js` as module-private helpers, with their comments.

- [ ] **Step 1: Baseline.** Run `npx playwright test tests/waiting-guide.spec.js --project=chromium`. Expected: all pass.
- [ ] **Step 2: Create `js/guide.js`.** Move everything from `/* ── MARKUP` to the end of `waiting.js` into it verbatim, with these changes only:
  - `renderGuide` takes `(sections, { linkColumns })` and reads them instead of `SECTIONS` / `LINK_COLUMN`.
  - The click listener is registered inside `renderGuide` and reads `sections`.
  - `renderGuide` ends with `loadMetaBadges()`.
  - The header comment says the module renders any guide page from its data module.
- [ ] **Step 3: Trim `js/waiting.js`.**
  - Its imports become just `import { renderGuide } from './guide.js';`.
  - It keeps `SECTIONS` and `window.waitingSections`.
  - Its link map becomes `const LINK_COLUMN = { actions: 0, navigation: 0, explicit: 0, 'not-waits': 0, assertions: 1 };` and the file ends with `renderGuide(SECTIONS, { linkColumns: LINK_COLUMN });`.
  - Update its header comment.
- [ ] **Step 4: Verify.** Run `npx playwright test tests/waiting-guide.spec.js` (all three projects) and `npm run lint`. Expected: all pass, no lint errors, and `git diff --stat tests/` is empty.
- [ ] **Step 5: Commit** `js/guide.js`, `js/waiting.js`, the spec and this plan: `refactor: share the guide renderer between guide pages`.

---

### Task 2: Locator page shell and the three-tab switch

**Files:**
- Create: `locators.html`, `js/locators.js` (shell only: `const SECTIONS = [];`), `tests/helpers/guide.js`, `tests/locator-guide.spec.js`
- Modify: `index.html:24-27`, `waiting.html:22-25` (nav), `style.css` (`.page-switch` comment, phone rules at lines 312-313, a new 380px rule, `.pill.warn` next to `.guide .pill`), `tests/waiting-guide.spec.js` (`Waiting guide: page switch` block only)

**Interfaces:**
- Consumes: `renderGuide` (Task 1).
- Produces:
  - `js/locators.js`: `SECTIONS` (filled in Task 3), `LINK_COLUMN`, `window.locatorSections = SECTIONS`, `renderGuide(SECTIONS, { linkColumns: LINK_COLUMN })`.
  - `tests/helpers/guide.js` exports:
    - `MOCK_DATE`
    - `mockBackends(page) -> Promise<{ posts: number }>`
    - `contrastOf(page, selector) -> Promise<number>`
    - `plain(text) -> string`
    - `unbalanced(code) -> string | null`, which returns the first unmatched or mismatched bracket or quote, or null. It scans `()`, `[]` and `{}`. It skips `'…'`, `"…"` and `` `…` `` strings (honouring `\` escapes, and nesting `${…}` in templates) and `//` / `/* */` comments.
  - The first three helpers are copied from `tests/waiting-guide.spec.js` lines 3-18 and 822-853.

**Nav markup** (identical on all three pages except `aria-current`):

```html
<nav class="page-switch" aria-label="Pages">
  <a class="page-tab" href="index.html"><span class="tab-icon" aria-hidden="true">⌨️</span>Commands</a>
  <a class="page-tab" href="waiting.html"><span class="tab-icon" aria-hidden="true">⏱️</span>Waiting</a>
  <a class="page-tab" href="locators.html"><span class="tab-icon" aria-hidden="true">🎯</span>Locators</a>
</nav>
```

**`locators.html`** is a copy of `waiting.html` with:
- `<title>🎯 Playwright Locator Guide</title>` and `<h1>Playwright Locator Cheat Sheet</h1>`.
- The lede, verbatim: "A good locator finds an element the way a user would, so it survives redesigns and refactors. Start at the top of the ladder and stop at the first locator that uniquely matches."
- `<div class="pills" aria-label="Locator priority ladder">` holding pills `Role`, `Label`, `Placeholder`, `Text`, `Alt text`, `Title`, `Test ID`, and `<span class="pill warn">CSS / XPath</span>`.
- `<script type="module" src="js/locators.js">`.
- The same meta-bar fallback values as `index.html`.

- [ ] **Step 1: Update the waiting spec's page-switch block.**
  - `is on both pages…` becomes `is on all three pages with aria-current on the current one`. It loops `['/waiting.html', 'Waiting']`, `['/', 'Commands']` and `['/locators.html', 'Locators']`, and expects 3 links named `Commands`, `Waiting`, `Locators`.
  - The icons test expects `[KEYBOARD, STOPWATCH, TARGET]` with `const TARGET = '🎯';`.
  - The icon and height balance test compares every tab with the first.
  - `navigates both ways` clicks `getByText('Waiting')`.
  - `page tabs share the width on phones` checks every width against the first.
- [ ] **Step 2: Write `tests/helpers/guide.js` and the shell tests in `tests/locator-guide.spec.js`.** Use `test.beforeEach(mockBackends)`.
  - `Locator guide: page shell`
    - For `/locators.html` and `/locators`: title matches `/Playwright Locator Guide/`, a single h1 reads `Playwright Locator Cheat Sheet`, 2 header logos, body background `rgb(15, 23, 42)`.
    - The meta-bar shows only `['playwright', 'last updated']`, with `#last-updated` = `MOCK_DATE`.
    - When `package.json` and `meta.json` are aborted, `#pw-version` and `#last-updated` equal the fallbacks parsed from the page HTML.
    - `.guide .pill` reads `['Role', 'Label', 'Placeholder', 'Text', 'Alt text', 'Title', 'Test ID', 'CSS / XPath']`. Only the last has class `warn`, with colour `rgb(251, 146, 60)` and background `rgba(234, 88, 12, 0.2)`. Its contrast (via `contrastOf`) is at least 4.5.
    - With a pose-as-visitor init script, one visit is counted per session (`state.posts` 1 after a reload).
  - `Locator guide: page switch`
    - Tab focus lands on `.page-tab` with ring `solid 3px rgb(248, 250, 252)`. Pressing Tab twice more reaches `Locators`, which has the same ring. Skip on WebKit, as the waiting spec does.
    - Clicking `Locators` from `/` and from `/waiting.html` lands on the h1 `Playwright Locator Cheat Sheet`.
  - `Locator guide: cross-page`
    - `header` outerHTML is identical on `/`, `/waiting.html` and `/locators.html`.
    - The `#pw-version` / `#last-updated` fallbacks parsed from the HTML are equal on all three pages.
    - At 360x740 on each page: the three `.page-tab` tops are equal, widths differ by at most 1px, each tab has `scrollWidth <= clientWidth`, and `scrollWidth <= innerWidth` holds for the page.
- [ ] **Step 3: Run both specs (chromium).** Expected: FAIL. `locators.html` is a 404, and there are 2 tabs, not 3.
- [ ] **Step 4: Implement.**
  - Create `locators.html` and `js/locators.js` (empty `SECTIONS`, `LINK_COLUMN = {}`).
  - Put the nav markup on all three pages.
  - Make the `style.css` phone changes listed under Decisions, and add `.guide .pill.warn { background: rgba(234,88,12,0.2); color: #fb923c; }`.
  - Update the `.page-switch` comment to "Commands / Waiting / Locators".
- [ ] **Step 5: Verify.** Run `npx playwright test tests/waiting-guide.spec.js tests/locator-guide.spec.js` (all three projects). Expected: all pass. Pay particular attention to "page tabs look exactly like the dashboard filter pills" on iPhone 16 and Pixel 7.
- [ ] **Step 6: Commit** `feat: add the locator guide page shell and a three-tab page switch`.

---

### Task 3: Locator guide content

**Files:**
- Modify: `js/locators.js` (`SECTIONS`, `LINK_COLUMN`)
- Modify: `tests/locator-guide.spec.js` (sections, links, copy, layout, content, colours)

**Interfaces:**
- Consumes: `renderGuide` (Task 1); the shell, `window.locatorSections` and the helpers (Task 2).
- Produces: `LINK_COLUMN = { ladder: 0, narrowing: 0, lists: 1, boundaries: 1, strictness: 0, team: 0 }`.

**Sections** (id, exact title, exact cols, row count). Row content follows the spec's outline, in that order:

| id | Title | Cols | Rows |
|----|-------|------|------|
| `ladder` | The locator priority ladder | Locator · Use it when · Real-world example | 8 |
| `role-options` | Making role locators precise | Option · What it does · Example | 8 |
| `narrowing` | Scoping and filtering | Method · Use it when · Example | 9 |
| `lists` | Lists, tables and repeated items | Task · Approach · Example | 6 |
| `boundaries` | Frames, shadow DOM and new tabs | Situation · Approach · Example | 6 |
| `strictness` | Strict mode and readable failures | Situation · What to do · Example | 4 |
| `fragile` | Fragile vs robust locators | Pattern · Why it breaks · Fragile vs robust | 7 |
| `team` | Team practices for a stable suite | Practice · Why · Example | 5 |
| `summary` (`text: true`) | Summary | Category · Locators · Rule of thumb | 4 |

Pinned cells:
- Ladder first-column chips, in order: `getByRole()`, `getByLabel()`, `getByPlaceholder()`, `getByText()`, `getByAltText()`, `getByTitle()`, `getByTestId()`, `locator(css)` <tag>Last resort</tag>.
- Summary first column: `User-facing`, `Contract`, `Structural` (flagged), `Positional`.
- Version notes: "(v1.60+)" on `description`, "(v1.63+)" on `visible()`, "(v1.64+)" on `within()` and `getByRef()`.
- In `boundaries`, the `contentFrame()` chip sits in column 1.
- One `role-options` row uses a regex name with a backslash (`/^Dr\.? Okafor$/`, written `\\.` in the template literal).

Notes (left to the builder by the spec) go on `ladder`, `narrowing` and `fragile` at least.

- [ ] **Step 1: Write the failing tests.** Mirror `tests/waiting-guide.spec.js`, with `/locators.html`, `window.locatorSections` and the values above.
  - `Locator guide: sections`
    - 9 sections in id order with numbered h2s, 9 TOC anchors, and the last anchor scrolls `#summary h2` into view.
    - Row counts `[8, 8, 9, 6, 6, 4, 7, 5, 4]` in the DOM and the data.
    - 12 `tr.flag`.
    - `.guide .tag` reads `['Last resort', 'Fragile', "Doesn't pierce", 'Not for tests']`.
    - The summary has no `pre`. 27 `th`, all `scope="col"`.
  - `Locator guide: links`
    - At least 25 `a.inl`, all `^index\.html#search=`, and each de-duplicated hash shows at least one `#grid .tile` (the waiting spec's hashchange loop).
    - Exact hrefs for `['#ladder', 'getByRole()', 'getByRole()']`, `['#ladder', 'locator(css)', 'locator()']`, `['#narrowing', 'within()', 'locator.within()']`, `['#narrowing', 'visible()', 'locator.visible()']`, `['#boundaries', 'frameLocator()', 'frameLocator()']`, `['#strictness', 'ariaSnapshot()', 'locator.ariaSnapshot()']` and `['#strictness', 'getByRef()', 'page.getByRef()']`.
    - `#boundaries code.inl` has text `contentFrame()` and no `a` ancestor.
    - `role-options`, `fragile` and `summary` have 0 `a.inl`.
  - `Locator guide: copy buttons`
    - 53 `.guide-copy`.
    - Copying the `ladder` `getByRole()` row and the regex row in `role-options` writes exactly those `SECTIONS` strings, and the second contains `\.`.
    - The Copy band never covers code at 1280 and 390px.
    - It shows `✓ Copied!` and then resets, and shows `Select and copy` on rejection.
  - `Locator guide: layout`
    - No sideways scroll.
    - Phone stacking with `data-label` captions matching `#ladder` cols.
    - Chips stay inside cells at 1280, 800 and 390px.
    - Code scrolls inside its `pre` (`overflowX: auto`, `whiteSpace: pre`).
  - `Locator guide: content`
    - Exact titles and cols (table above).
    - Every rendered cell equals `plain()` of its data.
    - Flagged rows in the DOM equal the data flags.
    - Ladder first cells equal the pinned chips, and pill `i` names ladder row `i`: `Role` ↔ `getByRole`, …, `Test ID` ↔ `getByTestId`, `CSS / XPath` ↔ `locator(css)`.
    - Discouraged patterns `/page\.\$\(|nth-child|\/html\/|['"]text=|>>|:visible/` appear in column 2 code only on flagged rows. `/\.nth\(|\.first\(\)|\.last\(\)/` likewise, outside `lists`.
    - Every `fragile` row is flagged, and its code splits on `// Robust`. The first half starts with `// Fragile`. The second matches `/getBy\w+\(|\.filter\(|\.within\(/` and matches neither discouraged regex.
    - Every `/v(\d+)\.(\d+)/` in any cell is at most the `@playwright/test` version, read with `fs.readFileSync('package.json')` (strip `^`).
    - `unbalanced(code)` is null for every code cell of `window.locatorSections` and of `window.waitingSections` (load `/waiting.html` for the second).
    - No `–` or `—` in any string, and code is at least 20 characters.
  - `Locator guide: colours`
    - The waiting spec's `PALETTE` holds on this page.
    - WCAG AA (4.5:1) for the same selector list plus `.guide .pill.warn`.
    - Code tokens match the `#m-code` modal colours.
- [ ] **Step 2: Run** `npx playwright test tests/locator-guide.spec.js --project=chromium`. Expected: the new blocks FAIL (0 sections).
- [ ] **Step 3: Write `SECTIONS` and `LINK_COLUMN` in `js/locators.js`.**
  - Follow the spec's row outline and content rules. Escape `${` as `\${` and backslashes as `\\` in template literals.
  - Check each version note and behavioural claim against the playwright.dev page for that API: case-insensitive substring default for `name`; `exact`; `includeHidden`; `visible()` replacing `:visible`; `within()` resolving `nth` per parent; XPath not piercing shadow roots; closed shadow roots unsupported.
- [ ] **Step 4: Verify.** Run `npx playwright test tests/locator-guide.spec.js tests/waiting-guide.spec.js` (all three projects) and `npm run lint`. Expected: all pass. If `unbalanced` flags a waiting-guide example, fix the helper's scanner (the waiting data is the known-good reference), not the waiting data.
- [ ] **Step 5: Read every example back** in the rendered page at 1280px and 390px, as a reader would. The spec does not parse code, so a nonsensical but balanced snippet would pass.
- [ ] **Step 6: Commit** `feat: add the locator guide content`.

---

### Task 4: Docs and release-sync skill

**Files:**
- Modify: `readme.md` (features list line 21, tree lines 44 and 60-62), `AGENTS.md` (tree lines 27-33, the meta-bar note at lines 122-130, a "Guide pages" section replacing "Waiting guide" at line 132, test list line 204), `CLAUDE.md` (repository layout, a "Guide pages" section that keeps the waiting-guide facts and adds the locator guide, and the meta-bar fallback gotcha listing three pages), `.claude/skills/playwright-release-sync/SKILL.md` (line 59: `locators.html` holds fallbacks too, plus a step to review guide version notes and examples on each release)

- [ ] **Step 1: Write the docs.**
  - "How to add a guide": create `js/<name>.js` with `SECTIONS`, `LINK_COLUMN`, `window.<name>Sections` and `renderGuide(...)`.
  - Copy `locators.html`'s shell, and add the tab to the nav on every page.
  - Add a spec that mirrors `tests/locator-guide.spec.js`.
  - Bump the meta-bar fallbacks on every page.
- [ ] **Step 2: Verify.** Run `npm test`, `npm run lint` and `npm run format:check`. Expected: all pass. Check `grep -rn "Waiting guide" index.html waiting.html locators.html` finds no tab labels.
- [ ] **Step 3: Commit** `docs: document the shared guide system and the locator guide`.
