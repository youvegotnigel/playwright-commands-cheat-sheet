# Popular Commands Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Track how often each command's modal is opened (once per session per command) and surface the top ~10% as a 🔥 Popular badge on tiles plus a "🔥 Popular" filter that sorts most-viewed-first — reusing the existing Supabase visitor-counter infrastructure.

**Architecture:** A new `command_views` table + atomic upsert RPC + a dedicated Edge Function (`increment-command-view`) handle server-side writes with the service-role key. A new ES module `js/popular-commands.js` records opens (anon → Edge Function) and reads all counts (anon → REST), computing the popular set. `js/app.js` wires the open-write into `openModal()`, adds the filter + tile badge, and re-renders once counts load.

**Tech Stack:** Vanilla ES modules (no build step), Supabase (Postgres + Deno Edge Functions), Playwright tests with `page.route` network mocks.

---

## File Structure

- **Create** `supabase/migrations/0002_command_views.sql` — table, upsert RPC, read-only RLS.
- **Create** `supabase/functions/increment-command-view/index.ts` — Deno Edge Function that validates `command_id` and calls the RPC with the service-role key.
- **Create** `js/popular-commands.js` — `commandId`, `recordOpen`, `loadCounts`, `getViewCount`, `isPopular`. The only module that talks to the command-views backend.
- **Modify** `js/app.js` — import the module, expose it on `window`, call `recordOpen` in `openModal`, add the Popular filter + getItems sort branch, badge tiles, re-render after `loadCounts`.
- **Modify** `style.css` — `.tile-popular` badge rule.
- **Create** `tests/popular-commands.spec.js` — mocked Playwright coverage of write + read + UI.
- **Modify** `AGENTS.md` — document the feature; remove it from "planned improvements".

Note: SQL and the Deno Edge Function have no automated test harness in this repo (the visitor backend is the same). They're verified by inspection here and exercised end-to-end through the mocked client tests, exactly like `increment-visitor`.

---

### Task 1: Database migration

**Files:**
- Create: `supabase/migrations/0002_command_views.sql`

- [ ] **Step 1: Write the migration**

```sql
-- Per-command open counter (one row per command, created on first open)
create table if not exists public.command_views (
  command_id text primary key,
  view_count bigint not null default 0
);

-- Atomic upsert-increment: first open inserts the row, later opens add 1
create or replace function public.increment_command_view(cmd_id text)
returns void
language sql
as $$
  insert into public.command_views (command_id, view_count)
  values (cmd_id, 1)
  on conflict (command_id)
  do update set view_count = public.command_views.view_count + 1;
$$;

-- RLS: allow the public anon key to READ only (writes go through the
-- Edge Function's service-role key, never the client)
alter table public.command_views enable row level security;
drop policy if exists "Allow public read" on public.command_views;
create policy "Allow public read"
  on public.command_views for select
  using (true);
```

- [ ] **Step 2: Verify it parses (visual check against `0001_visits_counter.sql`)**

Confirm: single-statement RPC body, `on conflict` qualifies the column with the table name (`public.command_views.view_count`) to avoid ambiguity, RLS enabled with a select-only policy. There is no local SQL runner; correctness is by inspection (matches the `0001` pattern).

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0002_command_views.sql
git commit -m "feat: add command_views table + increment RPC"
```

---

### Task 2: Edge Function

**Files:**
- Create: `supabase/functions/increment-command-view/index.ts`

- [ ] **Step 1: Write the function**

```ts
// @ts-nocheck — Runs on Supabase's Deno runtime, not the editor's Node TS server.
// URL imports and the `Deno` global are valid in Deno; this suppresses the
// editor-only "Cannot find module / Cannot find name 'Deno'" false positives.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    const { command_id } = await req.json();
    if (typeof command_id !== "string" || command_id.length === 0) {
      return new Response(JSON.stringify({ error: "command_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { error } = await supabase.rpc("increment_command_view", {
      cmd_id: command_id,
    });
    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
```

- [ ] **Step 2: Verify the slug and shape**

Confirm the directory is exactly `supabase/functions/increment-command-view/` (the deployed slug must match the client URL in Task 3). Confirm it mirrors `increment-visitor/index.ts` except for body validation and the RPC name/arg.

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/increment-command-view/index.ts
git commit -m "feat: add increment-command-view Edge Function"
```

---

### Task 3: Client module + record opens (write path)

**Files:**
- Create: `js/popular-commands.js`
- Modify: `js/app.js` (imports at top ~line 5; `openModal` ~line 128)
- Test: `tests/popular-commands.spec.js`

- [ ] **Step 1: Write the failing tests (helper + write-path cases)**

Create `tests/popular-commands.spec.js`:

```js
import { test, expect } from '@playwright/test';

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST, GET, OPTIONS',
  'access-control-allow-headers':
    'authorization, content-type, apikey, x-client-info',
};

// Deterministic mocks so tests never hit real Supabase (flaky, rate-limited,
// and a real write would inflate production counts). `state.rows` feeds the
// command-views read; `state.opens` collects the command_ids written.
async function mockBackends(page, { offline = false } = {}) {
  const state = { rows: [], opens: [] };

  await page.route('**/js/meta.json**', (route) =>
    route.fulfill({
      status: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ lastUpdated: '2025-12-25' }),
    })
  );

  // Visitor counter (unrelated) — stubbed so it never reaches production.
  await page.route('**/rest/v1/visits**', (route) =>
    route.fulfill({
      status: 200,
      headers: { ...CORS, 'content-type': 'application/json' },
      body: JSON.stringify([{ total_count: 0 }]),
    })
  );
  await page.route('**/functions/v1/increment-visitor', (route) =>
    route.fulfill({
      status: 200,
      headers: { ...CORS, 'content-type': 'application/json' },
      body: '{"success":true}',
    })
  );

  if (offline) {
    await page.route('**/rest/v1/command_views**', (route) => route.abort());
    await page.route('**/functions/v1/increment-command-view', (route) =>
      route.abort()
    );
    return state;
  }

  // Read path: all command view counts (served from the mutable state.rows)
  await page.route('**/rest/v1/command_views**', (route) =>
    route.fulfill({
      status: 200,
      headers: { ...CORS, 'content-type': 'application/json' },
      body: JSON.stringify(state.rows),
    })
  );

  // Write path: record an open — capture command_id from real POSTs only
  await page.route('**/functions/v1/increment-command-view', (route) => {
    const req = route.request();
    if (req.method() === 'POST') {
      state.opens.push(JSON.parse(req.postData() || '{}').command_id);
    }
    route.fulfill({
      status: 200,
      headers: { ...CORS, 'content-type': 'application/json' },
      body: '{"success":true}',
    });
  });

  return state;
}

// The recorder skips automated browsers (navigator.webdriver === true under
// Playwright). Tests that assert an open is recorded must pose as a real
// visitor first (same helper idea as meta-bar.spec.js).
async function poseAsRealVisitor(page) {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, 'webdriver', { get: () => false })
  );
}

test.describe('Popular commands — record opens', () => {
  test('does NOT record opens in automated browsers (CI / bots)', async ({
    page,
  }) => {
    const state = await mockBackends(page);
    await page.goto('/'); // navigator.webdriver is true under Playwright
    await page.locator('.tile').first().click();
    await expect(page.locator('#modal')).toBeVisible();
    await page.waitForTimeout(300);

    expect(state.opens.length).toBe(0);
  });

  test('records one open with the command_id (real visitor)', async ({
    page,
  }) => {
    await poseAsRealVisitor(page);
    const state = await mockBackends(page);
    await page.goto('/');

    const tile = page.locator('.tile').first();
    const name = await tile.locator('.tile-name').innerText();
    await tile.click();
    await expect(page.locator('#modal')).toBeVisible();
    await page.waitForTimeout(300);

    expect(state.opens.length).toBe(1);
    // command_id is `${cls}:${name}` — it must contain the command name
    expect(state.opens[0]).toContain(name);
  });

  test('records each command at most once per session', async ({ page }) => {
    await poseAsRealVisitor(page);
    const state = await mockBackends(page);
    await page.goto('/');

    const tile = page.locator('.tile').first();
    await tile.click();
    await page.locator('#btn-close').click();
    await tile.click(); // second open of the same command
    await page.waitForTimeout(300);

    expect(state.opens.length).toBe(1);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx playwright test tests/popular-commands.spec.js --project=chromium`
Expected: FAIL — opens are never recorded (no `recordOpen` wired yet), so the "records one open" and "once per session" tests fail (`state.opens.length` is 0). The bot test may pass vacuously; that's fine.

- [ ] **Step 3: Create the client module**

Create `js/popular-commands.js`:

```js
// =============================================================
// popular-commands.js — per-command "open" counts via Supabase.
// Mirrors the visitor counter: WRITES go server-side through an
// Edge Function (service-role key); READS use the publishable anon
// key directly. Exposes a "popular" set (top ~10% by opens) for the
// UI to badge + sort.
// =============================================================

const SUPABASE_URL = 'https://tilbhgcncnwibnfgebkg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_yCaOt8Z9sl-JEQC5wZ6_sQ_jZi610z1';
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/increment-command-view`;
const REST_URL = `${SUPABASE_URL}/rest/v1/command_views?select=command_id,view_count`;
const CACHE_KEY = 'command-views-cache';
const SESSION_PREFIX = 'cmd-opened:';

// id -> view_count for the current load; `popular` is a Set of ids.
let counts = new Map();
let popular = new Set();

// Stable identity for a command (the data has no ids): category class + name.
export function commandId(item) {
  return `${item.cls}:${item.name}`;
}

export function getViewCount(id) {
  return counts.get(id) || 0;
}

export function isPopular(id) {
  return popular.has(id);
}

// Build the counts map and the popular set (top ~10% of commands that have
// at least one view, ranked by view_count descending).
function applyRows(rows) {
  counts = new Map();
  rows.forEach((r) => counts.set(r.command_id, Number(r.view_count) || 0));

  const viewed = [...counts.entries()]
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1]);
  const topN = Math.ceil(viewed.length * 0.1);
  popular = new Set(viewed.slice(0, topN).map(([id]) => id));
}

// Fetch all counts once. Resolves so the caller can re-render. Falls back to
// the cached rows (then to empty) so the page never breaks on an outage.
export function loadCounts() {
  return fetch(`${REST_URL}&apikey=${SUPABASE_KEY}`, {
    signal: AbortSignal.timeout(5000),
  })
    .then((res) => res.json())
    .then((rows) => {
      if (Array.isArray(rows)) {
        applyRows(rows);
        localStorage.setItem(CACHE_KEY, JSON.stringify(rows));
      }
    })
    .catch((err) => {
      console.debug('Command views unavailable:', err);
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          applyRows(JSON.parse(cached));
        } catch {
          /* ignore a corrupt cache */
        }
      }
    });
}

// Record an open: once per session per command, never for automated browsers.
export function recordOpen(item) {
  try {
    // Skip CI/Playwright/Selenium/most bots so they don't inflate counts.
    if (navigator.webdriver) return;

    const id = commandId(item);
    const key = SESSION_PREFIX + id;
    if (sessionStorage.getItem(key)) return; // already counted this session
    sessionStorage.setItem(key, '1');

    fetch(FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify({ command_id: id }),
    }).catch((err) => {
      console.debug('Command view counter unavailable:', err);
    });
  } catch (err) {
    console.debug('Command view counter error:', err);
  }
}
```

- [ ] **Step 4: Wire the write into app.js**

In `js/app.js`, add the import alongside the existing ones (after the `highlight` import near line 6):

```js
import * as popularCmds from './popular-commands.js';
```

Below the existing `window.*` test exposures (after line 12), add:

```js
// Expose for tests via page.evaluate() (same rationale as window.categories)
window.popularCommands = popularCmds;
```

At the end of `openModal(item)` (after the copy-button reset, ~line 153), add:

```js
  // Record this open for the popularity counter (no-op for bots / repeat opens)
  popularCmds.recordOpen(item);
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx playwright test tests/popular-commands.spec.js --project=chromium`
Expected: PASS — all three "record opens" tests green.

- [ ] **Step 6: Commit**

```bash
git add js/popular-commands.js js/app.js tests/popular-commands.spec.js
git commit -m "feat: record command opens via Supabase (once per session)"
```

---

### Task 4: Popular badge + filter (read path / UI)

**Files:**
- Modify: `js/app.js` (`getItems` ~line 28, `makeTile` ~line 114, `buildFilters` ~line 218, init/end of file ~line 308)
- Modify: `style.css` (after the `.tile-level` rule, ~line 110)
- Test: `tests/popular-commands.spec.js` (append a second describe block)

- [ ] **Step 1: Write the failing tests (badge + filter + graceful failure)**

Append to `tests/popular-commands.spec.js`:

```js
test.describe('Popular commands — badge + filter', () => {
  // Returns the flat list of { id, name } for every command, in render order.
  async function allCommands(page) {
    return page.evaluate(() =>
      window.categories.flatMap((c) =>
        c.items.map((i) => ({ id: `${c.cls}:${i.name}`, name: i.name }))
      )
    );
  }

  test('badges only the popular commands (top ~10% with views)', async ({
    page,
  }) => {
    const state = await mockBackends(page);
    await page.goto('/');
    const cmds = await allCommands(page);

    // Give 20 commands views → top 10% = ceil(2.0) = 2 popular tiles.
    state.rows = cmds
      .slice(0, 20)
      .map((c, i) => ({ command_id: c.id, view_count: 20 - i }));
    await page.reload();

    await expect(page.locator('.tile-popular')).toHaveCount(2);
  });

  test('🔥 Popular filter shows popular commands, most-viewed first', async ({
    page,
  }) => {
    const state = await mockBackends(page);
    await page.goto('/');
    const cmds = await allCommands(page);

    state.rows = cmds
      .slice(0, 20)
      .map((c, i) => ({ command_id: c.id, view_count: 20 - i }));
    await page.reload();
    await page.locator('.tile-popular').first().waitFor();

    await page.getByRole('button', { name: '🔥 Popular' }).click();

    const names = await page.locator('.tile .tile-name').allInnerTexts();
    expect(names.length).toBe(2); // ceil(20 * 0.1)
    expect(names[0]).toBe(cmds[0].name); // highest view_count first
  });

  test('no badges and page still works when counts fail to load', async ({
    page,
  }) => {
    await mockBackends(page, { offline: true });
    await page.goto('/');
    await page.waitForTimeout(300);

    expect(await page.locator('.tile-popular').count()).toBe(0);
    expect(await page.locator('.tile').count()).toBeGreaterThan(10);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx playwright test tests/popular-commands.spec.js --project=chromium`
Expected: FAIL — `.tile-popular` never renders (count 0, not 2) and the `🔥 Popular` filter button doesn't exist, so `getByRole(...).click()` times out.

- [ ] **Step 3: Add the Popular filter button (app.js `buildFilters`)**

In `js/app.js`, change the `defs` array in `buildFilters()` (lines 220-224) to insert the Popular entry right after "Start Here":

```js
  const defs = [
    { label: 'All',          filter: 'all',      color: null },
    { label: '⭐ Start Here', filter: 'beginner', color: null },
    { label: '🔥 Popular',   filter: 'popular',  color: null },
    ...categories.map(c => ({ label: c.cat, filter: c.cat, color: c.color }))
  ];
```

- [ ] **Step 4: Add the popular filter/sort branch (app.js `getItems`)**

In `js/app.js`, replace the filter block in `getItems()` (lines 31-35) with a version that adds a `popular` branch *before* the category branch:

```js
  if (activeFilter === 'beginner') {
    items = items.filter(i => i.level === 'beginner');
  } else if (activeFilter === 'popular') {
    items = items
      .filter(i => popularCmds.isPopular(popularCmds.commandId(i)))
      .sort(
        (a, b) =>
          popularCmds.getViewCount(popularCmds.commandId(b)) -
          popularCmds.getViewCount(popularCmds.commandId(a))
      );
  } else if (activeFilter !== 'all') {
    items = items.filter(i => i.cat === activeFilter);
  }
```

- [ ] **Step 5: Badge popular tiles (app.js `makeTile`)**

In `js/app.js`, update `makeTile()` (lines 114-125) to add the badge:

```js
function makeTile(item, n) {
  const div = document.createElement('div');
  div.className = `tile ${item.cls}`;
  const popularBadge = popularCmds.isPopular(popularCmds.commandId(item))
    ? '<span class="tile-popular" title="Popular">🔥</span>'
    : '';
  div.innerHTML = `
    <span class="tile-level">${levelDots(item.level)}</span>
    ${popularBadge}
    <div class="tile-inner">
      <span class="tile-num">#${n}</span>
      <span class="tile-name">${item.name}</span>
    </div>`;
  div.addEventListener('click', () => openModal(item));
  return div;
}
```

- [ ] **Step 6: Load counts and re-render after first paint (app.js end of file)**

In `js/app.js`, at the very end of the file (after the `applyHashState();` call on line 308), add:

```js
// Popularity data arrives after first paint; re-render once it lands so the
// 🔥 badges appear and the "🔥 Popular" filter has content. Fails gracefully
// (no badges) if the backend is unreachable.
popularCmds.loadCounts().then(render);
```

- [ ] **Step 7: Style the badge (style.css)**

In `style.css`, add after the `.tile-level` rule (after line 110), mirroring its absolute positioning but on the left so it never overlaps the difficulty dots:

```css
.tile-popular {
  position: absolute; top: 6px; left: 8px;
  font-size: 11px; line-height: 1;
}
```

- [ ] **Step 8: Run the tests to verify they pass**

Run: `npx playwright test tests/popular-commands.spec.js --project=chromium`
Expected: PASS — all six tests green (three from Task 3, three here).

- [ ] **Step 9: Lint, format, full suite**

Run: `npm run lint && npm run format:check && npm test`
Expected: lint clean, format clean, all Playwright projects pass. (No new browser globals were introduced — `navigator`, `fetch`, `sessionStorage`, `localStorage`, `AbortSignal` are already whitelisted in `eslint.config.js`; the test file only uses already-whitelisted globals via `window`/`navigator`.)

- [ ] **Step 10: Commit**

```bash
git add js/app.js style.css tests/popular-commands.spec.js
git commit -m "feat: 🔥 Popular badge + filter sorted by command opens"
```

---

### Task 5: Documentation

**Files:**
- Modify: `AGENTS.md` (the "Visitor counter (Supabase)" section ~mid-file, and "Known / planned improvements" near the end)

- [ ] **Step 1: Add a "Popular commands (Supabase)" subsection**

In `AGENTS.md`, immediately after the "Visitor counter (Supabase)" section, add:

```markdown
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
```

- [ ] **Step 2: Remove the item from "Known / planned improvements"**

In `AGENTS.md`, delete the "Popular commands (Supabase)" bullet under "Known / planned improvements" (it's now shipped and documented above).

- [ ] **Step 3: Commit**

```bash
git add AGENTS.md
git commit -m "docs: document Popular commands feature"
```

---

## Self-Review

**Spec coverage:** Backend table/RPC/RLS → Task 1. Edge Function with validation → Task 2. `commandId`/`recordOpen`/`loadCounts`/`getViewCount`/`isPopular`, once-per-session + bot guards, graceful fallback → Task 3 + Task 4. Top-10% popular set → `applyRows` (Task 3). 🔥 badge + "🔥 Popular" filter sorted most-viewed-first → Task 4. Tests for all six spec test cases → Tasks 3-4. Docs + reset instructions → Task 5. No live polling, no modal indicator (Out of scope) — correctly omitted.

**Placeholder scan:** No TBD/TODO; every code step shows complete code; every run step states the exact command and expected result.

**Type/name consistency:** `commandId`, `recordOpen`, `loadCounts`, `getViewCount`, `isPopular` are defined in `popular-commands.js` (Task 3) and called identically in `app.js` (Tasks 3-4). The import alias `popularCmds` is used consistently. The Edge Function RPC arg `cmd_id` matches the SQL function signature (Task 1) and the `{ command_id }` body matches what the client sends and what the function reads. The `.tile-popular` class, `cmd-opened:` session prefix, and `command-views-cache` key are each used consistently across module, CSS, and tests.
