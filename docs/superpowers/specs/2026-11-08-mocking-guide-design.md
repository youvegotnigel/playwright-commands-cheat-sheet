# Network Mocking Guide Page — Design

**Date:** 2026-11-08
**Status:** Draft, awaiting approval
**Builds on:** the guide system in `docs/superpowers/specs/2026-11-07-locator-guide-design.md`

## Intent

The third guide, "Network mocking decisions", for Playwright users who want to become experts.
Mocking is where intermediate users get stuck: which level to fake at, which route outcome to
use, why a mock silently didn't match, and why handler order surprises them. Like the other
guides, its value is decisions and comparisons. The dashboard's Network & Mocking and API tiles
already cover single commands; the guide links to them.

The voice is a QA lead and Playwright expert: modern best practice, plainly explained, with
realistic snippets from the same healthcare-style app as the other guides.

## Goals

- A reader can decide, for any test, whether to hit the real backend, seed data through the
  API, modify a real response, replay a HAR, fake a response, or block a request.
- It teaches the four route outcomes (`fulfill`, `continue`, `fallback`, `abort`), URL
  matching (glob, regex, `URLPattern`, predicate), handler order and scope, HAR record and
  replay, WebSockets and offline, verifying traffic, and the mistakes that make mocked tests lie.
- Only APIs in the pinned `@playwright/test` 1.65.0, checked against
  `node_modules/playwright-core/types/types.d.ts` and playwright.dev.
- Looks and behaves exactly like the other two guides, through the shared `js/guide.js`.
- Its own spec, including content-correctness checks specific to mocking.

## Non-goals

- No new dashboard tiles, no dashboard search over guide content, no new table components.
- No mock-server tooling (MSW, WireMock): the guide is about Playwright's own APIs.

## Anti-goals

- A snippet that registers a route after the navigation that needs it, leaves a route
  unresolved, or forgets to `await page.route()`, outside a flagged "wrong" example.
- Recommending "mock everything" without a flag. At least one row must say which journeys
  should still run against a real backend.
- A fourth tab that overflows or wraps awkwardly on a 360px phone.

## Facts verified in the 1.65.0 types

- `page.route(url, handler, { times })`: `url` is a glob, `RegExp`, `URLPattern` or
  `(url: URL) => boolean`. Most recently registered route wins. Page routes take precedence
  over context routes. Relative strings resolve against `baseURL` unless they start with `*`.
  Enabling routing disables the HTTP cache. `route()` resolves to a `Disposable`.
- `route.fallback({ headers, method, postData, url })` passes the request to the next handler.
- `routeFromHAR(har, { notFound: 'abort' | 'fallback', update, updateContent: 'embed' |
  'attach', updateMode: 'full' | 'minimal', url })`; `notFound` defaults to `abort`.
- `unrouteAll({ behavior: 'wait' | 'ignoreErrors' | 'default' })`.
- `page.routeWebSocket(url, handler)`; `WebSocketRoute.connectToServer()`.
- `serviceWorkers: 'allow' | 'block'` context option.
- `page.requests()` returns up to the last 100 requests; read them immediately.
- `request.postDataJSON()`.

To check while writing (drop the row if not confirmed on playwright.dev for 1.65): globs no
longer support `?` and `[]` (the pitfall row about query strings and globs).

## The page

**Files:** `mocking.html` (shell copied from `locators.html`) and `js/mocking.js` (the
`SECTIONS` data module, `window.mockingSections`, `LINK_COLUMN`, one `renderGuide()` call).
Named "mocking" so it can't be confused with the `js/data/network.js` category module.

**Title:** `Playwright Network Mocking Cheat Sheet`; `<title>🔌 Playwright Mocking Guide</title>`.

**Lede:** Mock the network to make tests fast and deterministic, and to reach states a real
backend rarely gives you: empty lists, errors, slow replies. Fake as little as you need, and
keep a few journeys on the real API so the mocks can't drift into fiction.

**Pills (the spectrum, most real to most fake):** Real backend · Seed via API · Modify response ·
Replay HAR · Fake response · Block. All green; no warning pill.

**Sections** (the guide's three-column table; a trailing `true` flags a row):

1. `strategy` — Choose how much to fake. Cols: Approach · Use it when · Real-world example.
   Rows: real backend (critical journeys, smoke), seed with the `request` fixture then drive
   the UI, `route.fetch()` and modify one field, `routeFromHAR()` replay, `route.fulfill()`
   fake (empty, error and edge states), `route.abort()` block (analytics, third parties),
   mock every request <tag>Avoid</tag> (flagged).
2. `outcomes` — The four route outcomes. Cols: Method · What happens · Example. Rows:
   `route.fulfill({ json })`, `route.fulfill({ status: 500 })`, `route.continue({ headers })`,
   `route.fallback()`, `route.abort('failed')`, `route.fetch()` then `fulfill({ response, json })`.
3. `matching` — Matching the right requests. Cols: Pattern · Matches · Example. Rows: glob
   (`*` vs `**`), regex, `URLPattern` with a path parameter, predicate on the `URL`, method
   check inside the handler with `fallback()` for the rest, `{ times: 1 }`.
4. `order` — Handler order and scope. Cols: Rule · Why it matters · Example. Rows: last
   registered wins, `fallback()` layers handlers, page beats context, `context.route()` covers
   popups and new tabs, `unrouteAll({ behavior: 'ignoreErrors' })` at teardown, mocks as a
   fixture, `serviceWorkers: 'block'` when a service worker swallows requests.
5. `har` — Record and replay with HAR. Cols: Step · How · Example. Rows: record
   (`update: true`, `updateMode: 'minimal'`), replay, `notFound: 'fallback'`, scope with
   `url`, `updateContent: 'attach'` for reviewable diffs, strip secrets before committing
   <tag>Security</tag> (flagged).
6. `channels` — WebSockets, offline and slow networks. Cols: Situation · Approach · Example.
   Rows: fake a WebSocket server (`routeWebSocket`), proxy and edit messages
   (`connectToServer()`), offline (`context.setOffline(true)`), slow response to test a
   loading state (a delay inside the handler), API-only tests with the `request` fixture.
7. `verify` — Asserting on traffic. Cols: Goal · Approach · Example. Rows: the request was
   sent with the right body (`waitForRequest` + `postDataJSON()`), it was sent N times (count
   in the handler, `expect.poll`), it was never sent, inspect recent traffic (`page.requests()`),
   assert the UI result, not just the mock.
8. `pitfalls` — Mistakes that make mocked tests lie. Cols: Mistake · Symptom · Wrong vs right.
   Every row flagged; code has `// Wrong` then `// Right`. Rows: route registered after
   `goto`, missing `await` on `page.route`, a glob that misses the query string (if confirmed),
   handler that never resolves the route, `body: JSON.stringify()` instead of `json`,
   cross-origin mock without CORS headers, mocks that drifted from the real API shape.
9. `summary` — Summary (prose third column). Cols: Need · Use · Rule of thumb.

**Links back:** `LINK_COLUMN = { strategy: 0, outcomes: 0, channels: 1, verify: 1 }`.
`matching`, `order`, `har`, `pitfalls` and `summary` hold patterns and rules, not method chips.

## Four page tabs

`Commands · Waits · Selectors · Mocks` on all four pages. The new tab's icon is a custom SVG
like the others (`svg.tab-icon.icon-mocking`, `aria-hidden`, `focusable="false"`): a request
arrow in the line colour and a reply arrow as the `.accent` part, with `--accent: #fbbf24`
(amber, distinct from the guides' orange warning colour). On click it plays a "reply" animation:
the reply arrow slides back in. All motion stays inside
`@media (prefers-reduced-motion: no-preference)` and is scoped to `.icon-mocking`.

Below 600px (the meta-bar's own breakpoint) the switch becomes a 2 × 2 grid of equal pills,
matching the meta-bar's two-column phone grid. At 600px and up, one row. The 13px rule below
380px is no longer needed.

The existing waiting animation rule `.tab-icon.play .accent:not(.solid)` is not scoped to its
icon; it is scoped to `.icon-waiting` so the new icon's accent doesn't inherit the spin.

## Content rules (checked by tests)

- Healthcare-style app throughout (patients, appointments, records). No real people or brands.
- In unflagged examples: every `page.route(`/`context.route(` is awaited and comes before any
  `page.goto(` in the same snippet; every route handler resolves the route (`fulfill`,
  `continue`, `fallback` or `abort`); JSON responses use `json:`, never `body: JSON.stringify(`.
- Discouraged patterns (`waitForTimeout(`, `'networkidle'`, `body: JSON.stringify(`) appear
  only in flagged rows.
- Every `pitfalls` row has `// Wrong` before `// Right`.
- Version notes never name a version above the pinned `@playwright/test`.
- Balanced brackets and quotes in every example; at least 20 characters; no em or en dashes.

## Tests

`tests/mocking-guide.spec.js` mirrors `tests/locator-guide.spec.js` for shared behaviour and
adds the content rules above. The cross-page and page-tab tests move out of the locator spec into
`tests/page-switch.spec.js`, driven by one `PAGES` / `TABS` list in `tests/helpers/guide.js`, so
the next guide changes one list. The waiting spec's page-switch block reads the same list.

## Also updated

`index.html`, `waiting.html`, `locators.html` (fourth tab), `readme.md`, `AGENTS.md`,
`CLAUDE.md` (layout tree, guide list, tab layout), and the release-sync skill (`mocking.html`
holds meta-bar fallbacks too).
