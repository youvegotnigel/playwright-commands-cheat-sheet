---
name: periodic-colour-families
description: Use when restyling the cheat sheet's colours (tiles, page background, text, accents), reordering categories, adding a category and choosing its colour, or when asked to match the Selenide cheat sheet's colour design (pastel periodic-table families on a dark slate page, dark tile text, flat fills).
---

# Periodic colour families

Port the colour design of the Selenide Commands Cheat Sheet
(`https://youvegotnigel.github.io/selenide-commands-cheat-sheet/`) to this cheat sheet. The
user approved that palette after preview, so reuse its exact hex values wherever a category
fits a family. Generate a new shade only when a family needs more shades than the reference
has.

**Scope:** the whole colour system, which has to work as one: tile fills and category order,
the text colour on the tiles, the page background and surfaces the tiles sit on, the text
colours on those surfaces, accents, and the hover and focus states that the pale fills need.
It does **not** cover the periodic-cell layout, inspector, roving keyboard or name splitting
from that site. Leave those alone unless the user asks for them.

## The design in one paragraph

Categories are grouped into **families**, like element groups in a periodic table. Each family
has one hue, and each category in it gets its own shade of that hue, getting lighter down
the family. Families run around the colour wheel (blue, cyan, green, yellow, orange, rose,
violet), so the grid reads as one smooth spectrum. Fills are **flat** (no gradients),
OKLCH-derived pastels with lightness between 0.71 and 0.92, and chroma drops as lightness
rises so pale tiles stay soft rather than neon. **Every tile uses dark text `#0f172a`**
(slate-900); the lowest contrast in the reference palette is 6.48:1. Families exist only as
colour and display order. They are not a data field and get no label in the UI.

## How the tiles and the page work together

The design works because of one idea: **the tile text is the page background.** Tiles are
pale pastels on a dark slate page (`#0f172a`), and their text is that same `#0f172a`, so
each tile reads as a light card cut out of the page. Contrast is symmetric, so one number
covers two uses: a fill that gives 6.5:1 for dark text on the tile also gives 6.5:1 when the
fill is used as **text or a dot on the dark page** (group headers, filter dots). Nothing
else on the page is pastel. All the other surfaces stay dark slate and quiet, and the tiles
are the only large areas of colour.

### Surfaces (dark to light), Tailwind slate

| Token | Hex | Used for |
|---|---|---|
| deep | `#020617` | header, meta bar, code blocks (`pre`), meta-badge value text |
| page | `#0f172a` | `body` background **and** all tile text |
| raised | `#1e293b` | modal, search input, meta-badge key, group-header divider |
| border | `#334155` | input and button borders |
| border-hover | `#64748b` | input focus and button hover borders |

### Text on dark surfaces

| Role | Hex | Contrast | Rule |
|---|---|---|---|
| primary | `#e2e8f0` | 14.5 on page, 11.9 on raised | body text, modal title |
| pill label | `#cbd5e1` | 12.0 on page | filter buttons; active pill uses `#fff` |
| secondary | `#94a3b8` | 7.0 on page, 5.7 on raised, 7.9 on deep | descriptions, tips, meta-badge keys, code comments |
| muted | `#64748b` | 3.75 on page, 3.07 on raised | **not for readable text.** Placeholders and borders only |
| faint | `#475569` | 2.36 on page | **not for readable text.** Decorative glyphs only (shortcut hint, close icon at rest) |

The Selenide site uses muted and faint for some readable text (code comments, empty state,
inspector meta). Don't copy that here: use secondary (`#94a3b8`) for anything a user has to
read.

### Accents (Tailwind 400 shades, on dark only)

- Sky `#38bdf8`: tip border and label, Copy button (black label, 9.8:1), syntax keywords.
  Hover `#7dd3fc`. Success (Copied) `#4ade80`.
- Level badges: green `#4ade80`, orange `#fb923c` and purple `#c084fc` text on a 20% tint of
  the same hue, over the raised surface (5.5 to 8.4:1).
- Syntax on `#020617`: keyword `#38bdf8`, string `#4ade80`, api `#c084fc`, number `#fb923c`,
  function `#fbbf24`, comment `#94a3b8` italic.
- Header title: Playwright green `#2ead33` on deep (6.9:1). Meta-badge values (`#22c55e`,
  `#38bdf8`, `#a855f7`, `#fb923c` with `#020617` text) already match the Selenide site.
- The accents are saturated 400 shades and the tiles are softer pastels, so the two never
  compete. Don't use a tile pastel as a button or badge colour, and don't use a saturated
  accent as a tile fill.

### Text and states on the tiles

- All tile text is `#0f172a`, including the number, level dots and category label. Never
  white.
- Faded secondary text on a tile needs **opacity ≥ 0.8**. At the old 0.65 it measures 3.5:1
  on the darkest fills, and the checker fails it. Prefer size and weight over fading to show
  hierarchy.
- Hover: white outline `rgba(255,255,255,0.85)`, lift `translateY(-2px)`, shadow
  `0 6px 20px rgba(0,0,0,0.35)`. Focus: `3px solid #f8fafc`, offset 2px. White rings show on
  every pastel and on the dark page.
- Modal overlay `rgba(0,0,0,0.75)`.

All of these pairs are in `references/playwright-proposed-palette.json` (`pairs`,
`secondaryOpacity`), and the checker tests them.

## Reference palette (approved, Selenide site)

Display order, top to bottom. `L C h` are OKLCH. Contrast is against `#0f172a`.

| Family | Selenide category | Fill | Contrast | L / C / h |
|---|---|---|---|---|
| Setup (blue) | Setup & Config | `#72a0f5` | 6.85 | 0.709 / 0.135 / 262 |
| | Navigation & Browser | `#76bafe` | 8.69 | 0.771 / 0.120 / 250 |
| | Remote & Grid | `#8ad1ff` | 10.75 | 0.831 / 0.096 / 238 |
| | Build & Run | `#a3e7ff` | 13.12 | 0.891 / 0.075 / 222 |
| Finding (cyan) | Selectors | `#3bcddc` | 9.31 | 0.780 / 0.120 / 205 |
| | Collections | `#75ecde` | 12.59 | 0.870 / 0.110 / 185 |
| Acting (green) | Actions | `#3ec87d` | 8.30 | 0.741 / 0.160 / 155 |
| | Windows, Frames, Alerts | `#84d987` | 10.42 | 0.811 / 0.141 / 145 |
| | Files | `#b8e688` | 12.51 | 0.871 / 0.131 / 130 |
| | JavaScript, Storage, Clipboard | `#e2f07d` | 14.45 | 0.921 / 0.141 / 115 |
| Debugging (yellow) | Reports & Debugging | `#f4c43a` | 10.88 | 0.840 / 0.155 / 88 |
| | Proxy & Network | `#f4e886` | 14.23 | 0.920 / 0.120 / 102 |
| Checking (orange) | Element Conditions | `#f98e52` | 7.67 | 0.751 / 0.150 / 48 |
| | Collection Conditions | `#fca25f` | 8.90 | 0.790 / 0.135 / 56 |
| | Waits & Timeouts | `#feb671` | 10.32 | 0.830 / 0.120 / 64 |
| Structure (rose) | Page Objects | `#f0777a` | 6.48 | 0.710 / 0.149 / 20 |
| | Patterns | `#f996a9` | 8.47 | 0.780 / 0.120 / 8 |
| | Test Frameworks | `#ffb5cd` | 10.83 | 0.849 / 0.091 / 358 |
| Mobile (violet) | Appium Setup | `#9e92f3` | 6.68 | 0.710 / 0.139 / 288 |
| | Mobile Selectors | `#c79ff4` | 8.24 | 0.770 / 0.125 / 305 |
| | Mobile Gestures | `#e9aff2` | 10.10 | 0.829 / 0.111 / 322 |
| | Mobile Context & App | `#ffc2e9` | 12.03 | 0.880 / 0.085 / 340 |

The same data is in `references/selenide-reference-palette.json`.

## Proposed mapping for this repo

`references/playwright-proposed-palette.json` maps this repo's 16 categories onto the
families, reusing reference shades. `scripts/check-palette.mjs` passes on it. New display
order:

| # | Family | `cat` | `cls` | Fill | Reference shade it reuses |
|---|---|---|---|---|---|
| 1 | Setup | Config | `config` | `#72a0f5` | Setup & Config |
| 2 | Setup | Setup | `setup` | `#76bafe` | Navigation & Browser |
| 3 | Setup | CLI | `cli` | `#a3e7ff` | Build & Run |
| 4 | Finding | Query | `query` | `#3bcddc` | Selectors |
| 5 | Finding | Accessibility | `accessibility` | `#75ecde` | Collections |
| 6 | Acting | Action | `action` | `#3ec87d` | Actions |
| 7 | Acting | Utility | `utility` | `#84d987` | Windows, Frames, Alerts |
| 8 | Acting | Clock & Time | `clock` | `#b8e688` | Files |
| 9 | Acting | Media & Audio | `media` | `#e2f07d` | JavaScript, Storage, Clipboard |
| 10 | Debugging | Tracing & Debugging | `tracing` | `#f4c43a` | Reports & Debugging |
| 11 | Debugging | Network & Mocking | `network` | `#f4e886` | Proxy & Network |
| 12 | Checking | Assertions | `assertion` | `#f98e52` | Element Conditions |
| 13 | Checking | API | `api` | `#feb671` | Waits & Timeouts |
| 14 | Structure | Fixtures | `fixture` | `#f0777a` | Page Objects |
| 15 | Structure | Patterns | `pattern` | `#f996a9` | Patterns |
| 16 | Structure | Component Testing | `component` | `#ffb5cd` | Test Frameworks |

Reasoning, so the user can push back on specific choices:

- Setup skips the third blue (`#8ad1ff`), so the remaining steps are wider.
- Accessibility sits with Query because ARIA roles are mostly used to find elements (`getByRole`).
- API is in Checking because API tests are mostly requests followed by `expect` on the
  response. Another option is Debugging, next to Network & Mocking. That needs a third yellow
  generated between `#f4c43a` and `#f4e886`.
- Fixtures is in Structure (`test.extend`, scopes), with Patterns and Component Testing.
- Violet is unused because this site has no mobile section. It stays free for a future
  family, which would close the wheel back to blue.

**Before you edit any file, show the user this table and get their approval or changes.**
Which family a category belongs in is their decision.

## Generating a new shade

Only do this when no reference shade fits.

1. Use a hue inside the family's range (see `h` above). Place lightness so steps within the
   family are about 0.06 L apart. Lower chroma as L rises (roughly 0.16 at L 0.74 down to
   0.075 at L 0.89).
2. `node scripts/oklch-to-hex.mjs <L> <C> <h>`. If it prints `out of gamut`, lower C.
3. Add the shade to the palette JSON and run `node scripts/check-palette.mjs <file>`.
   - Hard rules: contrast ≥ 4.5 against `#0f172a`, L within 0.70 to 0.93, OKLab ΔE×100 ≥ 4.5
     between neighbouring shades in a family, and ≥ 7.7 between the last tile of one family
     and the first tile of the next.
   - Warning (aim to clear it): in-family ΔE below 6. The reference has one: the orange trio, at 4.6.
4. Show the user any new shade before using it.

## Implementation steps

Read this repo's `CLAUDE.md` first and follow its rules: no build step, tests before code,
and expected values hand-written from an independent source (here, the approved table), never
copied from the code under test.

1. **Tests first** (in `tests/cheatsheet.spec.js` or a new `tests/tile-colours.spec.js`). Run
   them and watch them fail.
   - `PALETTE`: an `[cls, fill]` array written by hand from the approved table, in display order.
   - For each entry: a tile with that class has computed `background-color` equal to
     `rgb(r, g, b)` of the fill and `background-image` equal to `none` (no gradient left behind).
   - `.tile` computed `color` is `rgb(15, 23, 42)`.
   - `window.categories` (or whatever the app exposes) `.map(c => c.cls)` equals the
     `PALETTE` cls column, and each category's `color` equals its fill.
   - Contrast: for every category, the WCAG contrast between the tile's computed text colour
     and its fill is ≥ 4.5. Write the formula into the test (relative luminance, then
     `(L1 + 0.05) / (L2 + 0.05)`) rather than importing it from app code.
   - Page: `body` computed background is `rgb(15, 23, 42)`. Group-header text and the modal
     description each reach ≥ 4.5 against the surface behind them.
2. **Order:** in `js/data/index.js`, reorder `categories` to the approved order and add a
   `// <Family>` comment above each group. Tile numbers and grouped-view order follow array
   position, so update any test that relies on the old order. Write the new expectations by
   hand.
3. **Data:** set each `js/data/<file>.js` `color` to its fill. Filter dots (`app.js` ~256) and
   group headers (`app.js` ~108) read `color`, so they update with no code change.
4. **CSS** (`style.css`):
   - Replace every `linear-gradient(...)` rule with `.<cls> { background: <fill>; }`, grouped
     under `/* <Family> */` comments in display order, below a header comment that says the
     fills must pass 4.5:1 against `#0f172a`.
   - Add `color: #0f172a;` to `.tile`. Make sure the tile number, level dots and popular icon
     inherit it and are not hard-coded light. White text on these fills fails contrast.
   - Hover: replace `transform: scale(1.05)` (it overlaps neighbours) with
     `transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.35); outline: 2px solid rgba(255,255,255,0.85);`.
   - Add `.tile:focus-visible { outline: 3px solid #f8fafc; outline-offset: 2px; }` and a
     `prefers-reduced-motion: reduce` block that removes the transition and transform.
   - Set `.tile-num` (and any other faded tile text) to opacity ≥ 0.8.
   - Audit every non-tile colour against "How the tiles and the page work together". Move any
     readable text that uses `#64748b` or `#475569` to `#94a3b8`, including the syntax
     comment token. Keep the surfaces as listed. If you change a colour that isn't in
     `pairs`, add the pair to the JSON and rerun the checker.
   - Consider defining the surface and text tokens as CSS custom properties on `:root`
     (`--surface-deep`, `--surface-page`, `--text-secondary`, ...) so the roles stay explicit.
     Only do it if the user agrees, since it touches most rules.
5. **Docs:** replace the mentions of gradients with flat fills: `CLAUDE.md` (layout line,
   schema `cls` comment, "Adding a new category" step 3), `AGENTS.md` (~77) and `readme.md`
   (~99). Add the family rule to "Adding a new category": put the category in the right family
   and keep each family contiguous in `index.js`; reuse or generate a shade with this skill; add
   the CSS rule under its family comment; add `[cls, fill]` to `PALETTE` at its display position.
6. **Verify:** `npm test`, `npm run lint` and `npm run format:check`. Report failures with
   their output. Then load the page (`npx serve`) and check the grid on desktop and at phone
   width: the colour should flow blue to rose, and each family should form one contiguous run.

## Common mistakes

| Mistake | Fix |
|---|---|
| Keeping the gradient and only changing its colours | Flat fill. The test checks `background-image: none` |
| Leaving white or inherited light text on tiles | `.tile { color: #0f172a; }`, and check the child elements |
| Picking shades by eye or making them "a bit brighter" | Reuse reference hex values, or generate in OKLCH and run the checker |
| Splitting a family across the array | Keep each family contiguous; the comments in `index.js` make this visible |
| Computing `PALETTE` from `window.categories` in the test | Write it by hand from the approved table |
| Adding a family label to the UI or the data schema | Families are colour and order only |
| Lightening the page or panels to "match" the pastel tiles | Keep the slate surfaces dark. The tiles stand out because everything else is quiet |
| Pastel buttons or badges | Accents use saturated 400 shades, and pastels are for tiles only |
| Muted grey (`#64748b`) for text users read | `#94a3b8` minimum on any dark surface |
