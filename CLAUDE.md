# Playwright Commands Cheat Sheet — AI Assistant Guide

A static, single-page interactive web dashboard providing a quick reference for Playwright testing commands. Users can browse, search, filter, and view syntax-highlighted code examples. Hosted on GitHub Pages at `https://youvegotnigel.github.io/playwright-commands-cheat-sheet/`. Command popularity and visitor counts are tracked via Supabase.

---

## Core Principles

- **No build step.** Pure vanilla ES modules. No bundler, no transpilation, no compilation.
- **Zero runtime dependencies.** All `package.json` deps are `devDependencies` (Playwright, ESLint, Prettier, Serve).
- **No CDN imports.** Everything loads from the repo or the browser's native APIs.
- **Run the tests** before marking any change complete: `npm test`.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla JavaScript (ES2022+ modules), HTML5, CSS3 |
| Syntax highlighting | Custom dependency-free highlighter (`js/highlight.js`) |
| Analytics backend | Supabase (PostgreSQL + Edge Functions on Deno) |
| Testing | `@playwright/test` v1.61.0 |
| Linting | ESLint 9 flat config |
| Formatting | Prettier 3 |
| Dev server | `npx serve` on port 3000 |
| Hosting | GitHub Pages |
| CI/CD | GitHub Actions |

---

## Repository Layout

```
playwright-commands-cheat-sheet/
├── index.html                    # Main markup: header, meta-bar, search, filters, grid, modal
├── style.css                     # Single stylesheet: dark theme, category tile gradients
├── js/
│   ├── app.js                    # Primary logic: render, filter, search, modal, meta-bar (~330 lines)
│   ├── highlight.js              # Dependency-free syntax highlighter (JS/TS + shell, ~120 lines)
│   ├── popular-commands.js       # Command open tracking via Supabase (~90 lines)
│   ├── visitor-counter.js        # Visitor increment on page load (~40 lines)
│   ├── visitor-display.js        # Live visitor count display, polls every 30s (~80 lines)
│   ├── meta.json                 # { "lastUpdated": "YYYY-MM-DD" } — auto-stamped by CI
│   └── data/
│       ├── index.js              # Imports and re-exports all category modules
│       ├── config.js             # Config commands (baseURL, testDir, timeout, retries…)
│       ├── setup.js              # Setup commands (test(), describe(), beforeEach()…)
│       ├── actions.js            # Action commands (click, fill, press, drag…)
│       ├── queries.js            # Locator commands (getByRole, getByLabel, locator…)
│       ├── assertions.js         # Assertion commands (toBeVisible, toHaveText…)
│       ├── utility.js            # Utility commands (goto, screenshot, pdf, context…) — largest file
│       ├── api.js                # API commands (request.get/post/put/delete…)
│       ├── accessibility.js      # Accessibility commands (ARIA roles, aria-*)
│       ├── patterns.js           # Common patterns (waiting, dialogs, auth, intercepts…)
│       └── cli.js                # CLI commands (npx playwright, flags, codegen…)
├── tests/
│   ├── cheatsheet.spec.js        # UI: page load, search, filters, modal, views, keyboard, URL state
│   ├── data-integrity.spec.js    # Data: required fields, level enum, docs URLs, code validity
│   ├── highlight.spec.js         # Highlighter: keywords, strings, comments, shell, escaping
│   ├── meta-bar.spec.js          # Meta-bar: version badge, last-updated, command count, visitor counter
│   └── popular-commands.spec.js  # Popularity: count loading, 🔥 badge, "Popular" filter, caching
├── supabase/
│   ├── migrations/
│   │   ├── 0001_visits_counter.sql       # Visitor counter table + RPC + RLS
│   │   └── 0002_command_views.sql        # Command views table + RPC + RLS
│   └── functions/
│       ├── increment-visitor/index.ts    # Edge Function: increment visitor count
│       └── increment-command-view/index.ts  # Edge Function: record command open
├── docs/superpowers/
│   ├── plans/                    # Feature implementation plans
│   └── specs/                    # Feature design specifications
├── images/                       # Dashboard and modal screenshots
├── .github/workflows/
│   ├── test.yml                  # CI: run full test suite (chromium + 2 mobile) on push/PR
│   └── stamp-date.yml            # CI: auto-update js/meta.json on push to master
├── playwright.config.js          # Test config: webServer port 3000, 3 projects
├── eslint.config.js              # Flat config: lints js/ only, per-block globals
├── .prettierrc                   # singleQuote, semi, tabWidth: 2, trailingComma: es5
├── package.json                  # devDependencies only; scripts: test, lint, format
├── AGENTS.md                     # Comprehensive contributor guide
└── readme.md                     # User-facing documentation
```

---

## Commands

```bash
# Testing
npm test                          # Full suite (all 3 projects)
npm run test:chromium             # Desktop Chrome only
npm run test:iphone               # iPhone 16 emulation
npm run test:pixel                # Pixel 7 emulation
npm run test:mobile               # Both mobile projects
npm run test:ui                   # Interactive Playwright UI mode
npm run test:report               # Show last HTML report

# Linting & formatting
npm run lint                      # ESLint on js/
npm run lint:fix                  # ESLint with --fix
npm run format                    # Prettier on js/ and tests/
npm run format:check              # Prettier check (no write)
```

---

## Playwright Configuration

- **Test directory:** `./tests/`
- **Dev server:** `npx serve` auto-started on `http://localhost:3000`
- **Projects:**
  - `chromium` — desktop Chrome
  - `iPhone 16` — mobile emulation
  - `Pixel 7` — mobile emulation
- **Reporter:** GitHub in CI, HTML locally
- **Artifacts:** test reports uploaded on failure, retained 14 days

---

## Data Schema

Every command lives in a category module under `js/data/`. Each file exports a single `Category` object:

```js
export const myCategory = {
  cat: 'Display Name',     // shown in filter buttons and tiles
  cls: 'css-class',        // matches CSS class for tile gradient
  color: '#hexcolor',      // accent color
  items: [
    {
      name: 'commandName()',           // required — display name
      level: 'beginner',              // required — 'beginner' | 'intermediate' | 'advanced'
      desc: 'What this does.',        // required — short description
      tip: 'Pro tip or warning.',     // optional
      docs: 'https://playwright.dev/docs/...', // optional — full docs URL
      code: `// JS/TS code example\nawait page.doSomething();`, // optional
    },
  ],
};
```

All fields in `items` (except `name`, `level`, `desc`) are optional. The `data-integrity.spec.js` test validates every item's shape — run it after adding commands.

### Adding a new category

1. Create `js/data/mycategory.js` following the schema above
2. Import and re-export it in `js/data/index.js`
3. Add a gradient rule in `style.css` targeting `.mycategory` tiles
4. Run `npm test` — `data-integrity.spec.js` will catch schema errors

### Adding commands to an existing category

Append to the `items` array in the relevant `js/data/*.js` file. The `data-integrity.spec.js` test will validate the new entry automatically.

---

## Syntax Highlighting

`js/highlight.js` exports two functions:

- **`highlight(code)`** — for JavaScript/TypeScript snippets
- **`highlightShell(code)`** — for CLI/shell snippets

`app.js` chooses which function to use based on the `code` content (CLI category uses `highlightShell`; all others use `highlight`). Both return HTML with `<span class="tok-*">` tokens. The highlighter HTML-escapes all text and uses single-pass regex tokenization.

**Token CSS classes:** `tok-kw` (keywords), `tok-str` (strings), `tok-cmt` (comments), `tok-num` (numbers), `tok-fn` (function names), `tok-api` (Playwright API), `tok-flag` (shell flags), `tok-prog` (shell programs).

---

## Popular Commands Feature

- Each time a user opens a command modal, `popular-commands.js` calls the Supabase Edge Function `increment-command-view`
- Deduplication: one open per command per session (`sessionStorage`)
- Bot guard: `navigator.webdriver` check skips automation runs
- Counts are fetched from Supabase REST API and cached to `localStorage`
- Commands in the top ~10% by view count receive a 🔥 badge and appear under the "Popular" filter
- Stable command ID scheme: `` `${item.cls}:${item.name}` ``

---

## Visitor Counter

- `visitor-counter.js` increments the Supabase counter once per page load
- Deduplication: `sessionStorage` key prevents re-increment on reload
- Bot guard: `navigator.webdriver` check
- `visitor-display.js` polls the Supabase REST API every 30 seconds and updates the meta-bar
- Falls back gracefully to `localStorage` cached value if Supabase is unavailable

---

## State Management

| Mechanism | Used for |
|-----------|---------|
| URL hash | Filter + search state (`#filter=beginner&search=goto`) |
| `localStorage` | Popularity counts cache, visitor count cache |
| `sessionStorage` | Per-session dedup for visitor increment and command opens |
| `window.categories` | Exposed for test access (via `page.evaluate`) |
| `window.highlight` / `window.highlightShell` | Exposed for test access |
| `window.popularCommands` | Exposed for test access |

---

## Testing Patterns

### Accessing app internals

Tests reach internal state via window globals:

```js
const categories = await page.evaluate(() => window.categories);
const highlighted = await page.evaluate(() => window.highlight('await page.click()'));
```

### Mocking Supabase

All tests that involve analytics mock both the REST API and Edge Functions using `page.route()` to avoid real increments and network dependency:

```js
await page.route('**/rest/v1/**', route => route.fulfill({ json: [] }));
await page.route('**/functions/v1/**', route => route.fulfill({ status: 200 }));
```

### Simulating real visitors

The `poseAsRealVisitor` helper uses `addInitScript` to set `navigator.webdriver = false`, bypassing the bot guard:

```js
await page.addInitScript(() => { Object.defineProperty(navigator, 'webdriver', { get: () => false }); });
```

---

## Code Style

- **Indentation:** 2 spaces
- **Quotes:** single
- **Semicolons:** required
- **Trailing commas:** ES5 style
- **Line length:** ~100 chars (Prettier enforced)
- **No em-dashes or en-dashes in command data.** Never use `—` (em-dash) or `–` (en-dash) in any `js/data/` item field (`name`, `desc`, `tip`, `code`, etc.). Use a period, comma, or colon to break a sentence, and a hyphen `-` for ranges (e.g. `200-299`). `data-integrity.spec.js` enforces this — a stray dash fails the suite.
- **ESLint globals:** each block (app, test, supabase functions) has its own globals whitelist in `eslint.config.js` — add new globals there if needed

---

## CI/CD

### `test.yml`

- Triggers: push to `master` or `develop`, PR to `master`
- Matrix: chromium, iPhone 16, Pixel 7
- Steps: checkout → Node 20 → `npm ci` → install Playwright → run tests → upload report artifacts

### `stamp-date.yml`

- Triggers: push to `master` only
- Writes today's date to `js/meta.json` and commits with `[skip ci]`
- Keeps the "Last Updated" meta-bar badge accurate after every merge

---

## Important Gotchas

- **No build step.** Never introduce a bundler, transpiler, or import from a CDN. The app must work by opening `index.html` directly with a static file server.
- **ESLint lints `js/` only.** Test files (`tests/`) are formatted with Prettier but not ESLint-linted. If you add new globals used in `js/`, add them to `eslint.config.js`.
- **`js/meta.json` is auto-updated by CI.** Do not manually edit it; the `stamp-date.yml` workflow overwrites it on every push to master.
- **Supabase URLs are public but RLS-protected.** The Supabase project URL and anon key are intentionally embedded in client-side JS. RLS policies ensure users can only increment counts, never read raw rows directly (aggregates only).
- **`data-integrity.spec.js` is your schema enforcer.** Run it after any change to `js/data/`. It validates required fields, level enum values, and that code snippets are parseable JS.
- **Mobile tests use real device emulation.** The `playwright.config.js` uses `iPhone 16` and `Pixel 7` device descriptors. UI tests written for desktop may fail on mobile — check responsive behaviour.
