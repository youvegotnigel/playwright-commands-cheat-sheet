# Popular Commands — Design

**Date:** 2026-06-07
**Status:** Approved

## Goal

Track which commands people open and surface popularity in the UI:

- A **🔥 Popular** badge on the most-opened command tiles.
- A **🔥 Popular** filter (beside **⭐ Start Here**) that shows only popular
  commands, most-viewed first.

This reuses the existing Supabase visitor-counter infrastructure, making it do
double duty: server-side counting via an Edge Function, read-only anon access
via REST.

## Constraints

- The site is vanilla ES modules with **no build step**, served from GitHub
  Pages, and should keep working **offline-friendly** — no CDN, no third-party
  runtime libraries.
- **Security invariant (must hold):** writes happen only server-side inside an
  Edge Function using the **service-role key**. Client/anon code may **read
  only**. Never expose a write path to the anon key.
- **Automated browsers must not inflate counts** — skip when
  `navigator.webdriver` is true (CI/Playwright/Selenium/most bots), matching
  the visitor counter.
- All Supabase traffic must **fail gracefully**: a network/Supabase outage
  leaves the page fully usable with no badges and no console errors.

## Decisions (settled during brainstorming)

- **Counting granularity:** once per session per command. A session that opens
  a command's modal increments that command exactly once, no matter how many
  times it's reopened (`sessionStorage` guard per command).
- **What "popular" means:** the top ~10% of commands *that have at least one
  view*, ranked by view count descending. Concretely
  `Math.ceil(0.10 × commandsWithViews)`. When nothing has been opened yet, the
  popular set is empty (no badges, no items in the Popular filter).
- **Sort UI:** a `🔥 Popular` filter button next to `⭐ Start Here` that filters
  to the popular set and orders it most-viewed-first (not a third view toggle).

## Command identity

Commands have no stable IDs in the data, so derive one:

```
commandId(item) = `${item.cls}:${item.name}`   // e.g. "action:click()"
```

Exported from `js/popular-commands.js` for reuse in `app.js` and tests. Stable
as long as a command's category (`cls`) and `name` don't change; renaming a
command resets only that command's count — acceptable.

## Architecture

### Backend (`supabase/`)

New migration `migrations/0002_command_views.sql`:

```sql
create table if not exists public.command_views (
  command_id text primary key,
  view_count bigint not null default 0
);

-- Atomic upsert-increment: first open inserts, later opens add 1
create or replace function public.increment_command_view(cmd_id text)
returns void language sql as $$
  insert into public.command_views (command_id, view_count)
  values (cmd_id, 1)
  on conflict (command_id)
  do update set view_count = public.command_views.view_count + 1;
$$;

-- RLS: anon may READ only
alter table public.command_views enable row level security;
drop policy if exists "Allow public read" on public.command_views;
create policy "Allow public read"
  on public.command_views for select using (true);
```

New Edge Function `functions/increment-command-view/index.ts` — a near-copy of
`increment-visitor`:

- Same CORS headers; handle `OPTIONS` preflight.
- Read `{ command_id }` from the JSON body. **Validate** it is a non-empty
  string; if not, return `400` with an error body.
- Create the service-role client and call
  `supabase.rpc("increment_command_view", { cmd_id: command_id })`.
- Return `{ success: true }` on success; `500` with `{ error }` on failure.
- The Deno-runtime conventions (`@ts-nocheck`, URL imports, `Deno` global) are
  intentional, exactly like the existing function.

The function slug **must** be exactly `increment-command-view`.

### Client module (`js/popular-commands.js`, an ES module)

Mirrors the visitor split (write vs read) in one command-scoped module. Uses
the same Supabase project URL and publishable anon key already present in the
visitor scripts. Exports:

- `commandId(item)` — the `cls:name` key (above).
- `recordOpen(item)` — called from `openModal()`. Returns early if
  `navigator.webdriver`, or if `sessionStorage["cmd-opened:"+id]` is set
  (once-per-session-per-command); otherwise sets that guard and fires a
  fire-and-forget `POST` to `…/functions/v1/increment-command-view` with body
  `{ command_id: id }` and the publishable-key `Authorization` header. All
  failures `console.debug` only.
- `loadCounts()` — `GET …/rest/v1/command_views?select=command_id,view_count`
  with the anon `apikey` and a 5s `AbortSignal.timeout`. On success: build an
  `id → count` map; compute the popular set (`view_count > 0`, ranked desc,
  take `Math.ceil(0.10 × commandsWithViews)`); cache the raw rows to
  `localStorage`. On failure: fall back to the cached rows if present, else an
  empty map. Resolves a promise so `app.js` can re-render.
- `getViewCount(id)` / `isPopular(id)` — accessors used during render.

### UI (`js/app.js`, `index.html`, `style.css`)

- **Popular filter:** in `buildFilters()`, insert
  `{ label: '🔥 Popular', filter: 'popular' }` immediately after
  `⭐ Start Here`. In `getItems()`, when `activeFilter === 'popular'`: keep only
  items where `isPopular(commandId(item))`, then sort by `getViewCount`
  descending. Search composes on top as today.
- **Tile badge:** `makeTile()` adds a `🔥` element when the item is popular,
  positioned opposite the existing `tile-level` dots so they don't overlap.
  New `.tile-popular` rule in `style.css`.
- **Async refresh:** counts arrive after first paint, so `app.js` calls
  `loadCounts().then(render)`. First render shows no badges; once data lands it
  re-renders with badges — the same "fill in when ready" model as the meta bar.
- **Wire the write:** `openModal()` calls `recordOpen(item)`.
- **Test hook:** expose `window.popularCommands` (the module) for
  `page.evaluate()`, consistent with `window.categories`.

## Data flow

1. Page loads → `app.js` renders tiles (no badges yet) and calls
   `loadCounts()`.
2. `loadCounts()` resolves → popular set computed → `render()` re-runs → badges
   appear; `🔥 Popular` filter now has content.
3. User opens a command modal → `recordOpen(item)` POSTs to the Edge Function
   (once per session per command, skipped for bots) → DB increments.
4. Updated counts are reflected on the next page load (no live polling — see
   Out of scope).

## Error handling

- Edge Function unreachable / non-2xx on write → swallowed (`console.debug`);
  user sees no error, modal works normally.
- `loadCounts()` fetch fails → cached rows used if available, else empty set →
  no badges, no Popular items, no thrown errors.
- Invalid/empty `command_id` → Edge Function returns `400`; client ignores it.

## Testing (`tests/popular-commands.spec.js`)

All Supabase traffic mocked with `page.route` — deterministic and no real
writes (same pattern as `tests/meta-bar.spec.js`):

- Tiles get the 🔥 badge only for the mocked popular set; non-popular tiles
  don't.
- The `🔥 Popular` filter shows only popular items, ordered most-viewed-first.
- Opening a modal fires exactly one `POST` with the correct `command_id`
  (faking `navigator.webdriver = false` via the `poseAsRealVisitor` pattern).
- Once-per-session guard: reopening the same command fires no second `POST`.
- `navigator.webdriver = true` → no `POST` at all.
- Mocked `500`/failure on `loadCounts()` → no badges, page still works, no
  console errors.

Plus `npm run lint` and `npm run format:check` clean; whitelist any new
browser globals in `eslint.config.js` rather than disabling rules.

## Documentation

Add a **Popular commands (Supabase)** subsection to AGENTS.md (backend files,
the read/write split, the once-per-session-per-command guard, the bot
exclusion, and how to reset counts: `delete from public.command_views;` in the
SQL editor). Move the item out of "Known / planned improvements".

## Out of scope

- Live polling of counts (the visitor display polls; popularity refreshes on
  next load — simpler, and popularity changes slowly). Revisit only if needed.
- A popularity indicator inside the modal (badge is on tiles only).
- Trending / time-windowed popularity (e.g. "this week"); counts are all-time.
- Per-user history or de-duplication beyond the per-session guard.
