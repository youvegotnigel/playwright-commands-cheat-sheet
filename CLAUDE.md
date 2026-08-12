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
| Testing | `@playwright/test` v1.62.1 |
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
│   ├── app.js                    # Primary logic: render, filter, search, modal, meta-bar (~350 lines)
│   ├── highlight.js              # Dependency-free syntax highlighter (JS/TS + shell, ~130 lines)
│   ├── popular-commands.js       # Command open tracking via Supabase (~95 lines)
│   ├── visitor-counter.js        # Visitor increment on page load (~40 lines)
│   ├── visitor-display.js        # Live visitor count display, polls every 30s (~75 lines)
│   ├── meta.json                 # { "lastUpdated": "YYYY-MM-DD" } — auto-stamped by CI
│   └── data/
│       ├── index.js              # Imports and re-exports all category modules (order = display order)
│       ├── config.js             # Config commands (baseURL, testDir, timeout, launchOptions…)
│       ├── setup.js              # Setup commands (test(), describe(), beforeEach()…)
│       ├── actions.js            # Action commands (click, fill, press, drag…)
│       ├── queries.js            # Locator commands (getByRole, getByLabel, locator…)
│       ├── assertions.js         # Assertion commands (toBeVisible, toHaveText…)
│       ├── utility.js            # Utility commands (goto, screenshot, evaluate, events…) — largest file
│       ├── network.js            # Network & Mocking (route, fulfill, HAR, WebSocket…)
│       ├── api.js                # API commands (request.get/post/put/delete…)
│       ├── accessibility.js      # Accessibility commands (ARIA roles, aria-*)
│       ├── fixtures.js           # Fixtures (test.extend(), scopes, auto, option fixtures)
│       ├── clock.js              # Clock & Time (clock.install(), setFixedTime, fastForward…)
│       ├── tracing.js            # Tracing & Debugging (trace, pause(), codegen, show-trace…)
│       ├── component.js          # Component Testing (experimental-ct, mount(), props…)
│       ├── media.js              # Media & Audio (HTMLMediaElement state, AnalyserNode, getStats…)
│       ├── patterns.js           # Common patterns (auth, POM, popups, WebAuthn…)
│       └── cli.js                # CLI commands (npx playwright, flags…)
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
│   ├── stamp-date.yml            # CI: auto-update js/meta.json on push to master
│   └── cheatsheet-sync.yml       # CI: monthly agent run to sync with new Playwright releases
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
- **Reporter:** `github` when `process.env.CI` is set, otherwise `list` + `html`
- **Artifacts:** test reports uploaded on failure, retained 14 days

---

## Data Schema

Every command lives in a category module under `js/data/`. Each file exports a single `Category` object:

```js
/** @type {import('./index.js').Category} */
export default {
  cat: 'Display Name',     // shown in filter buttons and tiles
  cls: 'css-class',        // matches CSS class for tile gradient
  color: '#hexcolor',      // 6-digit hex, validated by the test suite
  items: [
    {
      name: 'commandName()',                    // display name, globally unique
      level: 'beginner',                        // 'beginner' | 'intermediate' | 'advanced'
      desc: 'What this does.',                  // short description
      tip: 'Pro tip or warning.',               // pro tip / gotcha
      docs: 'https://playwright.dev/docs/...',  // must be https and playwright.dev
      code: `// JS/TS code example
await page.doSomething();`,                     // template literal, min 20 chars
    },
  ],
};
```

**Every category module uses `export default`, not a named export.**

**All six item fields are required.** `data-integrity.spec.js` fails on a missing, blank, or whitespace-only value for any of `name`, `level`, `desc`, `tip`, `docs`, `code`. Beyond presence, it enforces:

| Rule | Check |
|------|-------|
| `level` | one of `beginner` \| `intermediate` \| `advanced` |
| `docs` | starts with `https://` **and** contains `playwright.dev` |
| `code` | at least 20 characters after trimming |
| `name` | unique within its category **and** across every category |
| `color` | matches `/^#[0-9a-fA-F]{6}$/` |
| all fields | contain no em-dash `—` or en-dash `–` |

Because `code` is a template literal, escape any literal `${` as `\${` and any backslash sequence (e.g. a regex `\.`) as `\\.`.

### Adding a new category

1. Create `js/data/mycategory.js` with `export default { cat, cls, color, items }`
2. In `js/data/index.js`, add **both** the `import` line and an entry in the exported
   `categories` array — array position controls display and filter-button order
3. Add a gradient rule in `style.css` targeting `.mycategory` tiles, matching the
   category's `color` as the gradient start
4. Run `npm test` — `data-integrity.spec.js` will catch schema errors

The filter button is built automatically from the `categories` array (`buildFilters()` in
`app.js`), so no markup change is needed in `index.html`.

### Adding commands to an existing category

Append to the `items` array in the relevant `js/data/*.js` file. The `data-integrity.spec.js` test will validate the new entry automatically.

---

## Syntax Highlighting

`js/highlight.js` exports two functions:

- **`highlight(code)`** — for JavaScript/TypeScript snippets
- **`highlightShell(code)`** — for CLI/shell snippets

`app.js` picks the shell highlighter when `item.cls === 'cli'` **or** the snippet starts with
`npx` or a `#` comment (`/^\s*(npx|#)/`); everything else uses `highlight()`. Both return HTML
with `<span class="tok-*">` tokens. The highlighter HTML-escapes all text and uses single-pass
regex tokenization, so `Copy` always yields the original source exactly.

**Token CSS classes** (six, shared by both highlighters):

| Class | JS/TS meaning | Shell meaning |
|-------|---------------|---------------|
| `tok-keyword` | language keywords | flags (`-x`, `--xyz`) |
| `tok-string` | string literals | quoted strings |
| `tok-comment` | `//` and `/* */` | `#` comments (`//` is **not** a comment) |
| `tok-number` | numeric literals | numeric literals |
| `tok-fn` | function names | not used |
| `tok-api` | Playwright API identifiers | known program names |

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
- **ESLint globals:** `eslint.config.js` has two blocks, `js/**/*.js` and `tests/**/*.js`, each with its own explicit globals whitelist. There is no `env`, so a browser global not on the list is reported as `no-undef` — add it to the right block when you use a new one.

---

## CI/CD

### `test.yml`

- Triggers: push to `master`, PR to `master`
- Concurrency: superseded runs on the same ref are cancelled
- Matrix: chromium, iPhone 16, Pixel 7
- Steps: checkout → Node 20 → `npm ci` → install Playwright → run tests → upload report artifacts

### `stamp-date.yml`

- Triggers: push to `master` only
- Writes today's date to `js/meta.json` and commits with `[skip ci]`
- Keeps the "Last Updated" meta-bar badge accurate after every merge

### `cheatsheet-sync.yml`

- Triggers: monthly cron (06:00 UTC on the 1st, tracking the Playwright release cadence) plus manual `workflow_dispatch`
- Runs an agent to add commands introduced by new Playwright releases

---

## Important Gotchas

- **No build step.** Never introduce a bundler, transpiler, or import from a CDN. The app must work by opening `index.html` directly with a static file server.
- **`npm run lint` covers `js/` only.** `eslint.config.js` does define a `tests/**/*.js` block, but the `lint` script runs `eslint js/`, so test files are Prettier-formatted and never linted in practice. Pass `npx eslint tests/` explicitly if you want them checked.
- **`js/meta.json` is auto-updated by CI.** Do not manually edit it; the `stamp-date.yml` workflow overwrites it on every push to master.
- **Supabase URLs are public but RLS-protected.** The Supabase project URL and anon key are intentionally embedded in client-side JS. RLS policies ensure users can only increment counts, never read raw rows directly (aggregates only).
- **`data-integrity.spec.js` is your schema enforcer.** Run it after any change to `js/data/`. It validates required fields, the level enum, docs URLs, global name uniqueness, and the dash ban. It checks `code` length only — it does **not** parse the snippet, so a syntax error in an example will ship silently. Read your example back before committing.
- **Mobile tests use real device emulation.** The `playwright.config.js` uses `iPhone 16` and `Pixel 7` device descriptors. UI tests written for desktop may fail on mobile — check responsive behaviour.
