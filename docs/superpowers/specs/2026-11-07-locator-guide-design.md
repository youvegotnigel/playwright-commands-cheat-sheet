# Locator Guide Page — Design

**Date:** 2026-11-07
**Status:** Draft, awaiting approval
**Builds on:** `docs/superpowers/specs/2026-11-07-waiting-guide-design.md` (same page system)

## Intent

The owner wants a second guide, "Choosing a locator", for Playwright users who want to become
experts. The voice is that of a QA lead and Playwright expert: modern best practice, explained
plainly, with realistic examples.

Locators and waits cause most brittle Playwright tests between them. The waiting guide covers
waits; this guide covers the other half. Like the waiting guide, its value is **decisions and
comparisons** (which locator, when, and what goes wrong), not single-command reference. The
dashboard's Query tiles already cover that.

## Goals

- A reader can answer "which locator should I write here?" for any element, in under a minute.
- It teaches the priority ladder, how to make role locators precise, how to narrow and scope,
  how to handle lists, tables, frames and shadow DOM, and how to recognise fragile locators.
- It covers modern APIs from the pinned Playwright version (1.65): `getByRole` with `exact`,
  `level`, state options and `description` (v1.60), `filter({ has, hasNot, hasText,
  hasNotText, visible })`, `visible()` (v1.63), `within()` (v1.64), `and()` / `or()`,
  `describe()`, `contentFrame()`, `ariaSnapshot()`, and `getByRef()` for agent tooling (v1.64).
- Every example is a realistic snippet from one healthcare-style app (patients, appointments),
  consistent with the waiting guide's examples.
- It looks and behaves exactly like the waiting guide: same page, same components, same palette.
- Covered by its own spec, including content-correctness checks.

## Non-goals

- No new dashboard tiles. The guide links to the existing Query and Accessibility tiles.
- No dashboard search over guide content.
- No new visual components. The guide reuses the waiting guide's table, chip, tag, code-block
  and Copy patterns.

## Anti-goals

- Recommending a fragile pattern without flagging it (CSS class chains, `nth-child`, absolute
  XPath, `page.$`, `nth()` as a default).
- Examples that don't run on Playwright 1.65, or that use an API newer than the pinned version.
- A second, slightly different copy of the guide renderer.

## Shared guide system (refactor first)

The waiting guide's renderer becomes shared, so each guide is just data plus one page.

| File | Role |
|------|------|
| `js/guide.js` | New. `renderGuide(sections, { linkColumns })`: TOC, sections, tables, chips, tags, flagged rows, Copy buttons and links back, plus the copy click handler and `loadMetaBadges()`. Moved out of `js/waiting.js` unchanged in behaviour. |
| `js/waiting.js` | Keeps only the waiting `SECTIONS`, its link-column map, `window.waitingSections`, and a `renderGuide(...)` call. |
| `js/locators.js` | New. Locator `SECTIONS`, its link-column map, `window.locatorSections`, and `renderGuide(...)`. |
| `locators.html` | New. Same shell as `waiting.html`: header, two meta-bar badges, page switch, `main.guide.container` with its own `h1`, lede, pills, `#toc`, `#content`. |

`linkColumns` maps a section id to the column whose chips link back (0 or 1), as today. The
existing `tests/waiting-guide.spec.js` must pass unchanged after the refactor (except the
page-switch label tests below). That is the proof the refactor changed no behaviour.

## Page switch: three tabs

`⌨️ Commands` · `⏱️ Waiting` · `🎯 Locators`, on all three pages, same `.page-tab` styling and
emoji-presentation `aria-hidden` icons. The labels shorten from "Waiting guide" to "Waiting"
so three pills fit one row on a 360px phone. Each page's `h1` still carries the full title.
On phones the three tabs share the row equally; the font may drop to 13–14px so they fit
without wrapping or sideways scroll. Accessible names become `Commands`, `Waiting`, `Locators`.

## Page content

**Title:** `Playwright Locator Cheat Sheet` (`<title>🎯 Playwright Locator Guide</title>`).

**Lede:** A good locator finds an element the way a user would, so it survives redesigns and
refactors. Start at the top of the ladder and stop at the first locator that uniquely matches.

**Pills (the ladder, in order):** Role · Label · Placeholder · Text · Alt text · Title ·
Test ID · CSS / XPath. The last pill uses the orange "warning" style (`.pill.warn`, the tag
colours); the rest use the green pill style.

**Sections.** All use the guide's three-column table. Row 4th element `true` flags a row
(orange edge), and `<tag>X</tag>` adds a tag. Code examples follow the content rules below.

1. **`ladder` — The locator priority ladder.** Cols: Locator · Use it when · Real-world example.
   Rows: `getByRole()`, `getByLabel()`, `getByPlaceholder()`, `getByText()`, `getByAltText()`,
   `getByTitle()`, `getByTestId()`, `locator(css)` <tag>Last resort</tag> (flagged). Each "use
   it when" says why the rung is where it is. For example, test IDs are stable but invisible to
   users, so they sit below user-facing locators, and a test ID contract is agreed with
   developers.
2. **`role-options` — Making role locators precise.** Cols: Option · What it does · Example.
   Rows: `name` (case-insensitive substring by default), `exact: true`, `name` as a regex,
   `level` (headings), `checked` / `pressed` / `expanded` / `selected`, `disabled`,
   `includeHidden`, `description` (v1.60, same-named buttons).
3. **`narrowing` — Scoping and filtering.** Cols: Method · Use it when · Example. Rows: chaining
   (`dialog.getByRole(...)`), `filter({ hasText })`, `filter({ has })`, `filter({ hasNot })` /
   `filter({ hasNotText })`, `visible()` (v1.63, replaces `:visible`), `within()` (v1.64),
   `and()`, `or()` (for "either A or B appears"), `first()` / `last()` / `nth()` <tag>Fragile</tag>
   (flagged).
4. **`lists` — Lists, tables and repeated items.** Cols: Task · Approach · Example. Rows: act on
   the row that contains a value, read a whole column (`within()`), assert a count
   (`toHaveCount`), assert all texts in order (`toHaveText([...])`), loop over items (`all()`
   only after the count is asserted), pick by position only when order is the point (`nth()`).
5. **`boundaries` — Frames, shadow DOM and new tabs.** Cols: Situation · Approach · Example.
   Rows: iframe (`frameLocator()`), iframe from an existing locator (`contentFrame()`), open
   shadow DOM (pierced automatically by `getBy*` and CSS), XPath in shadow DOM <tag>Doesn't
   pierce</tag> (flagged), closed shadow DOM (not supported, test through the host's public
   surface), new tab or popup (wait for `popup`, then locate in it; links to the waiting guide's
   pattern).
6. **`strictness` — Strict mode and readable failures.** Cols: Situation · What to do · Example.
   Rows: "strict mode violation: resolved to 2 elements" (narrow the locator, don't reach for
   `first()`), `describe()` for readable traces and reports, check what Playwright sees
   (`ariaSnapshot()` / `toMatchAriaSnapshot`), `getByRef()` for agent tooling only
   <tag>Not for tests</tag> (flagged).
7. **`fragile` — Fragile vs robust locators.** Cols: Pattern · Why it breaks · Fragile vs robust.
   Every row is flagged and its code has `// Fragile` then `// Robust`. Rows: CSS class chains,
   `nth-child` / positional CSS, absolute XPath, text that includes dynamic data, `page.$()` /
   ElementHandles, legacy `text=` and `>>` selectors, `:visible` pseudo-class.
8. **`team` — Team practices for a stable suite.** Cols: Practice · Why · Example. Rows: agree a
   `testIdAttribute` with developers, define locators once in page objects, fix accessibility
   instead of working around it (a missing label is a bug), lint for raw locators
   (`eslint-plugin-playwright`: `prefer-native-locators`, `no-raw-locators`, `no-nth-methods`,
   `no-element-handle`), pick locators with tools (`codegen`, UI mode and trace viewer
   "Pick locator", VS Code extension).
9. **`summary` — Summary.** Prose third column, like the waiting guide. Cols: Category · Locators
   · Rule of thumb. Rows: User-facing (role, label, placeholder, text, alt, title): your first
   choice. Contract (test ID): when no user-facing hook is stable. Structural (CSS / XPath):
   last resort, comment why. Positional (`nth`, `first`, `last`): only when order is the point.

**Links back.** Method chips in each section's first column link to their dashboard tile with
the same full-name rule as the waiting guide. The summary's second column is not linked.

## Content rules

- Healthcare-style app throughout: patients, appointments, records. No real people or brands.
- Every code example is at least 20 characters, uses `await` where Playwright needs it, and has
  balanced brackets and quotes.
- Discouraged patterns (`page.$(`, `nth-child`, absolute XPath `//html` or `/html`, `text=`,
  `>>`, `:visible`, `.nth(` / `.first()` / `.last()` as a default) appear only in flagged rows.
- Version notes such as "(v1.63+)" never name a version newer than the pinned `@playwright/test`.
- No em dashes or en dashes, matching the project's data rule.
- Facts are checked against playwright.dev for the pinned version.

## Testing

New `tests/locator-guide.spec.js`, in all three projects, Supabase mocked as in the other
specs. It mirrors the waiting guide spec where behaviour is shared: shell, meta-bar badges and
fallbacks, every cell rendered from the data, flagged rows and tags, copy writes the exact
source, every link opens a dashboard search with at least one tile, chips stay inside cells,
the Copy band, phone layout, no sideways scroll, palette and WCAG AA contrast.

Locator-specific content checks:

- The pills read the ladder in order, and the `ladder` section's rows follow the same order.
- Discouraged patterns appear only in flagged rows.
- Every `fragile` row has `// Fragile` before `// Robust`, and the robust half uses a
  `getBy*` locator or `.filter(` / `.within(`.
- Every "vX.Y" mentioned is at most the pinned Playwright version (read from `package.json`).
- Every code example has balanced `()`, `[]`, `{}` and quotes, outside strings and comments.
  The same check runs on the waiting guide's examples.
- Section titles and column headers are exact.

Cross-page checks (run once): all three pages have identical headers, matching meta-bar
fallbacks, and the three-tab switch with `aria-current` on the right tab. The existing
waiting-guide page-switch tests are updated for the new labels.

## Also updated

- `index.html` and `waiting.html`: three-tab switch.
- `readme.md`, `AGENTS.md`, `CLAUDE.md`: the guide system (`js/guide.js` plus a data module per
  guide) and how to add a guide.
- `.claude/skills/playwright-release-sync/SKILL.md`: `locators.html` holds meta-bar fallbacks
  too, and guide version notes are reviewed on each release.

## Left to the builder

- Exact wording of every row and example, within the outline and content rules above.
- Which rows get a short `note` under the section title.
- Phone tab font size within 13–15px, as long as three tabs fit at 360px.
