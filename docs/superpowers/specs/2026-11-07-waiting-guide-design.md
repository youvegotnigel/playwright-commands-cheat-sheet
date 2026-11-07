# Waiting Guide Page — Design

**Date:** 2026-11-07
**Status:** Draft, awaiting approval
**Source content:** `Playwright Waiting Cheat Sheet.html` (repo root, untracked)

## Intent

The repo has a standalone "Playwright Waiting Cheat Sheet": a long reading page that explains
how Playwright waits. It covers which actionability checks each action performs, which assertions
retry, explicit waits, methods that look like waits but are not, timeout settings and pro tips.
It is being brought into the cheat sheet site so it ships, is hosted and is maintained with the
dashboard.

The dashboard and the waiting sheet do different jobs. A dashboard tile is one command; the
waiting sheet's value is comparison across commands (tables, flagged rows, flaky vs correct).
About 18 wait-related commands already exist as tiles, spread across Utility, Network, Assertions
and Queries, so turning the sheet into tiles would duplicate them and lose the comparisons.

The sheet therefore becomes a **sister page** of the dashboard: same site, same header, same dark
look, with a switch between the two.

## Decisions made by the owner

1. **Separate page.** The guide is its own page (`waiting.html`). It is not a filter on the
   dashboard grid and not a view swapped in place of the grid.
2. **Straight restyle.** Keep the sheet's eight sections, three-column tables, wording and code
   examples as they are, and recolour them to the dashboard's visual language. No content
   redesign: no actionability dot matrix, no "wait spectrum" hero, no side-by-side
   flaky/correct panes, no timeout diagram.

## Goals

- Every section, row, note, tag and code example in the source sheet appears on the new page,
  in the same order, with the same text.
- A reader moving between the dashboard and the guide feels they are on one site: same header,
  meta-bar, background, surfaces, borders, code colours, fonts and button styles.
- A visible two-way switch between "Commands" and "Waiting guide" on both pages.
- Method names in the guide link to that command on the dashboard.
- Works on desktop, iPhone 16 and Pixel 7 with no horizontal page scroll.
- Covered by its own Playwright spec. The existing suite stays green.

## Non-goals

- The dashboard search does not index guide content.
- No new dashboard tiles or categories, and no change to the `js/data/` schema.
- No popularity tracking (🔥 counts) on the guide.
- No light theme. The source sheet has one; the dashboard is dark only.

## Anti-goals (failure even if it works)

- The guide looks like a different site: its own fonts, a light page, VS Code Dark+ code colours,
  green-on-white accents.
- A CDN or Google Fonts import, a bundler, or any runtime dependency.
- A dashboard behaviour change beyond adding the page switch.
- A Copy button that yields text different from the snippet's source.

## Constraints (from CLAUDE.md)

- Vanilla ES modules, no build step, no CDN imports. The page must work from `npx serve` and
  GitHub Pages.
- Prettier style: 2 spaces, single quotes, semicolons, ES5 trailing commas, ~100 columns.
- New browser globals used in `js/` must be added to the `js/**/*.js` block of
  `eslint.config.js`.
- `npm test` (all three projects) must pass before the work is complete.

## The page

### Files

| File | Change |
|------|--------|
| `waiting.html` | New. Page markup: shared header, meta-bar, page switch, guide shell. |
| `js/waiting.js` | New ES module. The source's `SECTIONS` array (ported verbatim), the `inline()` markup helper, `render()`, and the copy handler. Imports `highlight` from `./highlight.js`. |
| `js/meta-bar.js` | New. Extracted from `app.js`: fills `#pw-version` from `package.json` and `#last-updated` from `js/meta.json`. Used by both pages. |
| `js/app.js` | `initMetaBar()` keeps setting `#cmd-count` and calls the shared module for the two fetched badges. Behaviour unchanged. |
| `index.html` | Add the page switch below the meta-bar. |
| `style.css` | Page switch styles; guide styles under a `/* Waiting guide */` comment; widen the token selectors (below). |
| `tests/waiting-guide.spec.js` | New spec (see Testing). |
| `.gitignore` | Add `.superpowers/` (brainstorm mockups). |
| `readme.md`, `AGENTS.md`, `CLAUDE.md` | Mention the guide page and the new files in the layout tree. |
| `.claude/skills/playwright-release-sync/SKILL.md` | Step 8: `waiting.html` also holds meta-bar fallbacks (`#pw-version`, `#last-updated`), so the sync bumps them alongside `index.html`. |

The original `Playwright Waiting Cheat Sheet.html` is not committed and not deleted; the owner
removes it once happy with the port.

### Top of page (shared with the dashboard)

1. **Header.** Identical markup to `index.html`: logo, "Playwright Commands Dashboard", logo. The
   header is the site identity; the guide's own title lives in the body.
2. **Meta-bar.** Two badges only, `playwright vX` and `last updated YYYY-MM-DD`, using the same
   `.meta-badge` markup, the same colours (`#22c55e`, `#38bdf8`) and the same fallback values as
   `index.html`. The commands count and visitors badges are dashboard-only.
3. **Page switch.** A `<nav class="page-switch" aria-label="Pages">` with two links, "Commands"
   (`index.html`) and "⏱ Waiting guide" (`waiting.html`). It is centred directly below the
   meta-bar on both pages. Each link is styled like a dashboard filter pill (`.filter-btn` look:
   999px radius, `rgba(255,255,255,0.06)` fill, 700 weight, `#cbd5e1` text). The current page has
   `aria-current="page"` and the active pill look (`rgba(255,255,255,0.18)` fill, white text,
   2px `rgba(255,255,255,0.25)` outline). Use the class `page-tab`, **not** `filter-btn`, so
   existing tests that select `.filter-btn` are unaffected. On phones the two pills sit side by
   side at equal width.

### Guide body

Wrapped in `<main class="guide container">`. The container is the dashboard's: max-width 1200px,
15px padding. All guide styles are scoped under `.guide`, because `style.css` already styles
`pre` globally (pre-wrap, bottom margin) and the source sheet's generic class names (`.card`,
`.note`, `.tag`, `.block`, `.copy`) would otherwise collide.

**Intro block**, in source order:
- `h1` "Playwright Waiting Cheat Sheet", `#e2e8f0`, ~30px (25px at ≤760px).
- Lede paragraph, `#94a3b8`, max 70ch.
- Actionability pills (Visible, Stable, Receives Events, Enabled, Editable), with green text
  `#4ade80` on `rgba(22,163,74,0.2)`, the dashboard's "beginner" badge colours.
- Section index: links "01 Auto-waiting: actions" … "08 Summary", `#94a3b8` with a `#334155`
  underline, turning `#e2e8f0` on hover and focus.
- The source's syntax-colour legend row is **dropped**: it teaches nothing about waiting and the
  dashboard has no equivalent.

**Sections** (`<section id>` with ids `actions`, `assertions`, `navigation`, `explicit`,
`not-waits`, `timeouts`, `tips`, `summary`):
- `h2` with a monospace two-digit number in header green `#2ead33`, then the title in `#e2e8f0`.
- Optional note paragraph, `#94a3b8`, 14px.
- A table card: background `#1e293b`, 1px `#334155` border, 12px radius (the modal's surface).
  Columns are 25% / 25% / 50%.
- `th`: 12px uppercase, 0.06em tracking, `#94a3b8`, `#334155` bottom border.
- `td`: `#cbd5e1` body text, `#334155` row dividers.
- **Flagged rows** (the source's 4th array element `true`): inset 3px left edge in `#fb923c`.
- **Tags** (`<tag>Avoid</tag>`, `Legacy`, `Deprecated`): 11px uppercase, `#fb923c` on
  `rgba(234,88,12,0.2)`, the dashboard's "intermediate" badge colours.
- The Summary section's third column is prose (`text: true`), not a code block, as in the source.

**Code:**
- Blocks are `pre` with background `#020617`, 8px radius, 12px 14px padding,
  `ui-monospace, Menlo, Consolas, monospace` at ~12.8px / 1.6. Use `white-space: pre` with
  `overflow-x: auto`, so code keeps its shape and scrolls inside the cell instead of widening the
  page.
- Inline chips (backtick text in data) are `code` with background `#020617`, `#e2e8f0` text,
  4px radius, `nowrap`.
- Both are highlighted with the repo's `highlight()` from `js/highlight.js`. The source's own
  highlighter and its rainbow brackets are not ported.
- Token colours are the dashboard's. Change the six `#m-code .tok-*` selectors in `style.css` to
  also match `.guide .tok-*`, so both pages share one palette definition.

**Copy button** on each code block: absolute top-right, a small version of `.btn-copy` (sky
`#38bdf8` fill, black text, 600 weight). On success it shows "✓ Copied!" on green `#4ade80` for
2s, as in the dashboard. On failure it shows "Select and copy" for 2s. It copies the snippet's
source string from the data, so the copied text is exactly the original.

**Links back to the dashboard.** Inline chips that name a method link to the dashboard search,
for example `index.html#search=waitForURL`. `applyHashState()` in `app.js` already applies this
hash on load, so the dashboard needs no change.
- Which chips: those in the first column of `actions`, `navigation`, `explicit` and
  `not-waits`, and those in the second column (matchers) of `assertions`.
- Search key: the last identifier that is followed by `(`, or the whole chip text if there is
  none. So `page.waitForURL(url)` gives `waitForURL`, `expect(fn).toPass()` gives `toPass`,
  `page.waitForEvent('popup')` gives `waitForEvent`, and `toBeVisible` stays `toBeVisible`.
- A chip links only if some dashboard item's `name` contains the key (case-insensitive).
  `js/waiting.js` imports `categories` from `./data/index.js` to check this at render time, so
  links stay correct as the data changes and never lead to an empty grid.
- Linked chips keep the code-chip look, add a 1px `#38bdf8` outline on hover and focus, and
  carry `title="Open in the commands dashboard"`.

### Phones (≤760px)

As in the source: `thead` and `colgroup` are hidden, and each row becomes a stacked block whose
cells show their column name (`data-label`) as an 11px uppercase `#94a3b8` caption. Rows are
separated by `#334155` dividers. Code blocks scroll horizontally inside the card. The page itself
never scrolls sideways.

### Accessibility

- `<html lang="en">`; `<title>⏱ Playwright Waiting Guide</title>`.
- Real `table` / `th scope="col"` semantics on desktop.
- Copy buttons are `<button type="button">`.
- Focus-visible outline `3px solid #f8fafc` with offset (the tile focus style) on links, pills
  and buttons.
- Text contrast on `#1e293b` and `#0f172a`: `#cbd5e1`, `#94a3b8` and `#e2e8f0` all pass 4.5:1.

### Test access

`js/waiting.js` exposes `window.waitingSections` (the `SECTIONS` array), following the
`window.categories` pattern, so specs can compare the rendered page against the data.

### Analytics

`waiting.html` loads `js/visitor-counter.js`. It already counts one visit per tab session with a
`sessionStorage` key shared across pages, so a reader who lands on the guide first is counted
once. `visitor-display.js` and `popular-commands.js` are not loaded.

## Testing

New `tests/waiting-guide.spec.js`, running in all three projects. Supabase is mocked as in the
other specs (`**/rest/v1/**`, `**/functions/v1/**`). Cases:

- Page loads with the expected title and `h1`. Eight sections render in order with the ids
  above, and the section index has eight working anchor links.
- Row counts per section match `window.waitingSections` (source: 9, 9, 2, 15, 4, 5, 7, 4).
- Exactly the three tags render (Avoid, Legacy, Deprecated), and the flagged-row count matches
  the data (10 in the source).
- Copy writes each block's exact source. Stub `navigator.clipboard.writeText` via
  `addInitScript` and compare against the data for at least one multi-line snippet that has
  quotes, and for the `toHaveURL(/\/dashboard/)` regex snippet.
- The page switch exists on both pages, has `aria-current="page"` on the right link and
  navigates both ways.
- Each rendered link-back chip's search term returns at least one tile on the dashboard (check
  all of them in chromium, and a sample on mobile to keep the run short).
- The meta-bar badges populate (mock `js/meta.json` as `meta-bar.spec.js` does).
- No horizontal page scroll: `document.documentElement.scrollWidth <= window.innerWidth` on every
  project.
- The existing `meta-bar.spec.js` passes unchanged after the meta-bar extraction.

Then run `npm run lint`, `npm run format:check` and `npm test`.

Note: `npx serve` uses clean URLs, so `/waiting.html` redirects to `/waiting`. Relative links to
`waiting.html` work under both `serve` and GitHub Pages, and `page.goto('/waiting.html')`
follows the redirect.

## Left to the builder

- Exact spacing, font sizes within the ranges above, and the hover transitions (reuse the
  dashboard's 0.15s).
- The internal shape of `js/meta-bar.js`, as long as `index.html` behaves exactly as before.
- Doc wording in `readme.md`, `AGENTS.md` and `CLAUDE.md`.
- Whether to add a screenshot of the guide to `images/` for the readme.
