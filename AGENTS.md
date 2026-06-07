# AGENTS.md

Guidance for AI agents (and humans) working on the **Playwright Commands Cheat Sheet**.
Read this before making changes. Follow existing patterns; keep the project simple.

## What this is

A static, single-page dashboard of Playwright commands. Users browse command
**tiles** grouped by category, filter/search, and open a **modal** showing the
command's description, syntax-highlighted code, a tip, and a docs link.

## Golden rules

1. **No build step.** Plain ES modules (`<script type="module">`) served as static
   files (GitHub Pages). Do **not** introduce bundlers, transpilers, frameworks,
   TypeScript, or npm runtime dependencies. Keep it vanilla and offline-friendly.
2. **No CDN / third-party runtime libraries.** Everything ships from the repo.
3. **Change behavior → add/adjust a Playwright test.** See "Testing".
4. **Run `npm run lint` and `npm test` before considering work done.** Both must be clean.
5. **Don't commit, push, merge, or open PRs unless asked.** Default branch is
   `master`; active work happens on `develop` and merges to `master` via PR.

## Project structure

```
index.html              # markup: header, meta bar, filters, grid, modal
style.css               # all styles (single file)
js/
  app.js                # UI logic: render tiles, filter/search, modal, meta bar
  highlight.js          # dependency-free syntax highlighter (JS/TS + shell)
  visitor-counter.js    # increments the Supabase visitor count (once per session)
  visitor-display.js    # reads + displays the live count (polls, caches)
  meta.json             # { "lastUpdated": "YYYY-MM-DD" } — stamped by CI
  data/
    index.js            # imports + orders all categories -> `categories`
    <category>.js       # one file per category (the command data)
tests/                  # Playwright specs (see Testing)
supabase/               # visitor-counter backend (SQL migration + Edge Function)
docs/superpowers/       # design specs + implementation plans for features
.github/workflows/      # test.yml (CI tests) + stamp-date.yml (meta.json)
```

`js/app.js` exposes `window.categories`, `window.highlight`, and
`window.highlightShell` **only so tests can reach them** via `page.evaluate()`.
Keep that pattern if you add testable internals.

## Command data: adding / editing tiles

Each category is a file in `js/data/` with this shape:

```js
export default { cat: 'Action', cls: 'action', color: '#22c55e', items: [
  { name: 'click()',
    level: 'beginner',            // 'beginner' | 'intermediate' | 'advanced'
    desc:  'Clicks an element…',
    tip:   'Auto-waits for actionability before clicking.',
    docs:  'https://playwright.dev/docs/...',
    code:  `await page.getByRole('button').click();` },
  // …more items
]};
```

Current categories (`cat` → `cls`): Config→config, Setup→setup, Action→action,
Query→query, Assertions→assertion, Utility→utility, API→api,
Accessibility→accessibility, Patterns→pattern, CLI→cli.

**To add a command:** append an `Item` to the right category's `items` array. That's
it — the tile renders, the modal works, and syntax highlighting applies
automatically (see below). All `Item` fields are required.

**To add a new category:** create `js/data/<name>.js` exporting a `Category`, then
import and add it to the array in `js/data/index.js`. Add a matching tile-gradient
rule `.<cls> { … }` and (if you want it in the modal token theme) nothing else is
needed. Note the visible command count in the meta bar updates automatically.

**Keeping commands accurate (use Context7):** when adding or revising a command,
verify the API, signature, and `docs` URL against the **current** Playwright docs.
Use the Context7 MCP (`resolve-library-id` → `query-docs` for `/microsoft/playwright`)
rather than relying on memory — the API changes between versions. The `docs` link
should point to the specific Playwright page for that command.

## Syntax highlighting

`js/highlight.js` is a tiny, escape-safe, single-pass regex highlighter. Two exports:
- `highlight(code)` — JS/TS snippets.
- `highlightShell(code)` — CLI/shell snippets (`#` comments, flags, programs; leaves
  URLs/paths plain — does NOT treat `//` as a comment).

`openModal()` in `js/app.js` routes by category: `item.cls === 'cli'` uses
`highlightShell`, everything else uses `highlight`. Token colors are `.tok-*` rules
scoped to `#m-code` in `style.css`.

**Automatic for new tiles?** Yes — highlighting runs at render time on every
`item.code`. New commands in existing categories just work. Caveats:
- A new **shell** category under a non-`cli` `cls` would get the JS highlighter;
  extend the routing condition (or add a per-item `lang` field) if you introduce one.
- New JS keywords / Playwright APIs aren't colored until added to the `KEYWORDS` /
  `APIS` sets in `highlight.js`. Unknown tokens render plain — graceful, never broken.
- **Never break Copy:** the modal sets `#m-code.innerHTML = highlight(...)`, but the
  Copy button reads `innerText`, which strips tags and returns the exact source. The
  highlighter HTML-escapes everything; keep both invariants.

## Meta bar

The badges under the header are populated at load (`initMetaBar` in `js/app.js`):
- **playwright version** — read from `package.json` (`@playwright/test`, range prefix stripped).
- **last updated** — read from `js/meta.json`, which the `stamp-date.yml` workflow
  writes on every push to `master` (committer date). Don't hand-edit `meta.json`.
- **commands** — count derived from the data.
- **visitors** — see below.

All fetches fail gracefully, falling back to the hardcoded values in `index.html`.

## Visitor counter (Supabase)

- **Backend** lives in `supabase/`: `migrations/0001_visits_counter.sql` (single-row
  `visits` table + atomic `increment_visits()` RPC + read-only RLS) and
  `functions/increment-visitor/index.ts` (Edge Function; runs on **Deno** — the
  `@ts-nocheck` and URL imports are intentional, not errors).
- **Reads** are direct REST with the publishable anon key (safe in client JS).
  **Writes** happen only inside the Edge Function via the service-role key (never
  put the service-role key in client code).
- **Increment is once per tab session** (`sessionStorage` guard) — refreshes don't
  re-count.
- **Automated browsers don't count.** `incrementCounter()` returns early when
  `navigator.webdriver` is true (Playwright/CI, Selenium, most bots), so test runs
  and crawlers never inflate the count. Tests that assert the increment fires must
  fake `navigator.webdriver = false` via `addInitScript` before `goto` (see the
  `poseAsRealVisitor` helper in `tests/meta-bar.spec.js`).
- **Reset the count:** run `update public.visits set total_count = 0 where id = 1;`
  in the Supabase SQL editor (cannot be done from client/anon key).
- The Edge Function slug **must** be exactly `increment-visitor`.

## Popular commands (Supabase)

Reuses the visitor-counter infra to count command **opens** and surface the most
popular ones.

- **Backend**: `supabase/migrations/0002_command_views.sql` (`command_views`
  table keyed by `command_id` + atomic `increment_command_view(cmd_id)` upsert
  RPC + read-only RLS) and `functions/increment-command-view/index.ts` (Edge
  Function; validates `command_id`, writes with the service-role key). The
  function slug **must** be exactly `increment-command-view`.
- **Client**: `js/popular-commands.js`. Reads all counts via REST with the anon
  key; writes go only through the Edge Function. `commandId(item)` is
  `` `${item.cls}:${item.name}` `` — the stable per-command key (the data has no
  ids). `app.js` calls `recordOpen()` from `openModal()` and re-renders after
  `loadCounts()` resolves.
- **Counted once per session per command** (`sessionStorage` `cmd-opened:<id>`
  guard) and **never for automated browsers** (`navigator.webdriver`), same as
  the visitor counter.
- **"Popular" = top ~10%** of commands that have at least one view, ranked by
  count. Surfaced as a 🔥 badge on tiles and a "🔥 Popular" filter (next to
  "⭐ Start Here") that sorts most-viewed-first.
- **Reset the counts:** run `delete from public.command_views;` in the Supabase
  SQL editor (cannot be done from the client/anon key).

## Testing

Playwright, configured in `playwright.config.js`. Projects: `chromium`,
`iPhone 16`, `Pixel 7`. Dev server is `npx serve` (auto-started by the config).

- `npm test` — full suite. `npm run test:chromium` for a quick single-project run.
  Single file: `npx playwright test <file>.spec.js --project=chromium`.
- Tests run in a **real browser**; reach app internals via `window.*` inside
  `page.evaluate()` (e.g. `window.categories`).
- **The repo is NOT `"type": "module"`**, so Playwright transpiles specs to CommonJS.
  Do **not** use `import.meta`, `readFileSync`, or filesystem imports of project ESM
  files in specs — test through the page (`fetch('./package.json')` in page context, etc.).
- **Mock external services** (Supabase REST + Edge Function, and `js/meta.json` when
  asserting the date) with `page.route(...)`. This keeps tests deterministic and
  **prevents real visitor-count increments**. See `tests/meta-bar.spec.js` for the
  pattern.
- Existing specs: `cheatsheet.spec.js` (UI), `data-integrity.spec.js` (data shape),
  `meta-bar.spec.js` (meta bar + visitor counter), `highlight.spec.js` (highlighter).

## Lint / format

- `npm run lint` (ESLint flat config, lints `js/` only) and `npm run format:check`.
- Browser/test globals are whitelisted per-block in `eslint.config.js`. If you use a
  new browser global (e.g. `IntersectionObserver`) or a global inside a
  `page.evaluate()` callback in a spec, add it to the relevant `globals` block rather
  than disabling the rule.

## Working on features

Non-trivial features follow brainstorm → spec → plan, saved under
`docs/superpowers/specs/` and `docs/superpowers/plans/`. Check there for context.

### Known / planned improvements
- Other ideas raised: favorites (localStorage), deep-link to a specific command,
  keyboard navigation, light/dark theme toggle, PWA/offline, multi-language snippets.
