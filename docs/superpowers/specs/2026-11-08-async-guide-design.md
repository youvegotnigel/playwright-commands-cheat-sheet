# Async Guide Page — Design

**Date:** 2026-11-08
**Status:** Draft, awaiting approval
**Builds on:** the guide system in `docs/superpowers/specs/2026-11-07-locator-guide-design.md`

## Intent

A guide on using and mastering the async nature of TypeScript in Playwright tests. Misused
promises are a leading cause of flaky tests: a missing `await`, an `async` callback in
`forEach`, actions racing in `Promise.all`, sleeping between steps instead of asserting. The
owner wants modern best practice with real-world automation examples, **especially tests where
two or more browser sessions run at the same time, depend on each other, communicate, and the
test switches back and forth between them.**

Voice: a QA lead and Playwright expert. Examples come from the same healthcare-style app as the
other guides. The multi-actor scenarios are: a doctor and a patient in a telehealth consult,
a nurse handing a triage case to a doctor, an admin approving a booking while the patient
waits, and two receptionists editing the same appointment.

## Goals

- A reader can spot and fix every common promise mistake in a Playwright test.
- A reader can write a reliable multi-user test: one browser context per actor, hand-offs
  synchronised by web-first assertions (never sleeps), simultaneous actions only on different
  pages, and every context closed.
- Examples are TypeScript (typed helpers, `Promise<void>` return types, typed fixtures) and use
  only APIs in the pinned `@playwright/test` 1.65.0.
- Looks and behaves exactly like the other guides, through the shared `js/guide.js`.
- Its own spec, with content rules that catch async mistakes in the guide's own examples.

## Non-goals

- Type-checking the examples with `tsc` (no TypeScript dependency is added). The content-rule
  tests catch the async mistakes instead.
- JavaScript event-loop theory beyond what a tester needs.

## Anti-goals

- An unflagged example with a floating promise, an un-awaited web-first assertion, an `async`
  callback in `forEach`, or a sleep.
- A multi-user example that leaks a browser context or synchronises actors with a timeout.
- Teaching "switching" as if Playwright had a focused tab. Each actor is a `Page` variable;
  the test talks to whichever one it needs. `bringToFront()` is only for focus-dependent behaviour.

## Facts verified in the 1.65.0 types

`page.bringToFront()`; `page.removeAllListeners(type, { behavior })`;
`testInfo.parallelIndex`; `test.step(title, body, { box, timeout })`; the `playwright`
fixture (`typeof import('playwright-core')`), for launching a second browser engine in one test;
`browser.newContext({ storageState })`; `expect.poll`; `locator.or()`; `websocket.waitForEvent()`.

To check while writing, against the plugin docs (drop the row if not confirmed):
`@typescript-eslint/no-floating-promises`, `@typescript-eslint/no-misused-promises`,
`@typescript-eslint/await-thenable`, `playwright/missing-playwright-await`,
`playwright/no-wait-for-timeout`.

## The page

**Files:** `async.html` (shell copied from `locators.html`) and `js/async.js` (the `SECTIONS`
data module, `window.asyncSections`, `LINK_COLUMN`, one `renderGuide()` call).

**Title:** `Playwright Async Cheat Sheet`; `<title>⚡ Playwright Async Guide</title>`.

**Lede:** Every Playwright call returns a promise. Await each one, synchronise on what the user
would see instead of on time, and run things in parallel only when they are truly independent.
The same rules hold when a test drives two browsers that talk to each other.

**Pills (the five rules):** Await every call · Register before you trigger · Assert, don't
sleep · Parallel only when independent · Close what you open. All green.

**Sections** (the guide's three-column table; a trailing `true` flags a row):

1. `basics` — How async works in a Playwright test. Cols: Concept · What it means · Example.
   Rows: every Playwright call returns a promise; locators are lazy (no `await` to create one,
   `await` to act); web-first `expect(locator)` is awaited, `expect(value)` is not;
   `test.step()` returns a promise; `return await` inside `try` / `catch`; typed async helpers
   (`Promise<void>`).
2. `awaits` — Forgotten and misplaced awaits. Cols: Mistake · What goes wrong · Flaky vs
   correct. Every row flagged; code has `// Flaky` then `// Correct`. Rows: missing `await` on
   an action, missing `await` on a web-first assertion, `async` helper called without `await`,
   `.then()` mixed with `await`, `if (await el.isVisible())` as a sync point, `await` on a
   locator (does nothing), an un-awaited `test.step`.
3. `loops` — Loops and collections. Cols: Task · Approach · Example. Rows: one by one
   (`for...of`), independent reads together (`Promise.all` over `map`), assert a list in one go
   (`toHaveText([...])`), iterate locators (`all()` after asserting the count), `forEach(async`
   <tag>Broken</tag> (flagged).
4. `parallel` — Doing things at the same time. Cols: Pattern · Use it when · Example. Rows:
   promise variable then trigger (waits), `Promise.all([waitForResponse, click])`,
   `Promise.all` for independent pages, "either A or B" with `expect(a.or(b))` instead of
   `Promise.race`, `Promise.allSettled` for best-effort cleanup, two actions on one page in
   `Promise.all` <tag>Race</tag> (flagged).
5. `multi-user` — Two or more browsers in one test. Cols: Scenario · Approach · Example. Rows:
   one context per actor (`browser.newContext({ storageState })`), a fixture that gives
   `doctorPage` and `patientPage` and closes them, "switching" is using the other `Page`
   variable, `bringToFront()` only for focus-dependent features, both join at the same moment
   (`Promise.all` across pages), a second engine for interop (`playwright.firefox.launch()`),
   close contexts in teardown, not at the end of the test body.
6. `handoffs` — Hand-offs between actors. Cols: Hand-off · How the other side waits · Example.
   Rows: patient sends a chat message, doctor asserts it appears; nurse submits triage, doctor's
   queue updates (`toHaveCount`); admin approves, patient's status changes (web-first assertion
   on the patient page); backend-only state (`expect.poll` on the API); a real-time WebSocket
   message (`websocket.waitForEvent('framereceived')`); a sleep between actors <tag>Avoid</tag>
   (flagged). Includes the two-receptionist conflict: both edit, the second save shows the
   conflict message.
7. `events` — Events and listeners. Cols: Situation · Approach · Example. Rows: register the
   wait before the action (`waitForEvent` promise), `once` vs `on`, async handlers
   (`page.on('dialog', async (d) => d.accept())`), collect console errors and assert at the
   end, remove listeners with `removeAllListeners(type, { behavior: 'wait' })`.
8. `structure` — Helpers, fixtures and lint. Cols: Practice · Why · Example. Rows: page-object
   methods are `async` and typed, no `await` in a constructor (use a fixture or a static
   `create()`), fixtures `await use()` then tear down, `test.step(..., { box: true })` for
   readable reports, unique data per worker (`test.info().parallelIndex`), sharing one page
   across tests in `beforeAll` <tag>Fragile</tag> (flagged), lint rules that catch floating
   promises.
9. `summary` — Summary (prose third column). Cols: Situation · Do this · Rule of thumb.

**Links back:** `LINK_COLUMN = { parallel: 0, handoffs: 1, events: 1, structure: 0 }` (chips such as
`expect.poll()`, `test.step()`, `test.extend()`, `test.info()`, `on(dialog)`,
`context.waitForEvent()`). Sections whose chips have no dashboard tile stay unlinked.

## Page tabs: a fourth, and a layout that scales

`Commands · Waits · Selectors · Async` on all pages. The new icon is a custom SVG like the
others (`svg.tab-icon.icon-async`, `aria-hidden`, `focusable="false"`): two lanes in the line
colour and a hand-off arrow from one lane to the other as the `.accent` part, with
`--accent: #f996a9` (the dashboard's rose tile shade). On click it plays a "hand-off": the
accent arrow draws across from one lane to the other. Motion stays inside
`@media (prefers-reduced-motion: no-preference)` and is scoped to `.icon-async`. The waiting
icon's unscoped `.tab-icon.play .accent:not(.solid)` rule is scoped to `.icon-waiting`.

Phones (below 600px, the meta-bar's breakpoint): the tabs wrap into at most two centred rows of
equal-width pills, `ceil(n / 2)` per row. Four tabs make a 2 × 2 grid, and five (once the
mocking guide lands) make 3 + 2. It is pure CSS: a `--cols` custom property, 2 by default and 3
when `.page-switch:has(> .page-tab:nth-child(5))`. At 600px and up: one row. The 13px rule below
380px goes.

## Content rules (checked by tests, unflagged rows unless stated)

- No statement line (ending `;`) starts with a Playwright call on a page, locator or context
  without `await`, `return`, or assignment to a `…Promise` variable.
- No statement line starts with `expect(` followed by a web-first matcher without `await`.
- `.forEach(async`, `waitForTimeout(`, `setTimeout(` used as a sleep, and `.then(` appear only
  in flagged rows (all sections).
- Every `awaits` row has `// Flaky` before `// Correct`, and the correct half awaits.
- Every `multi-user` and `handoffs` example that calls `newContext(` also calls `.close()` or
  is a fixture using `await use(`.
- Every `handoffs` example waits on the receiving side with `await expect(` or `expect.poll(`.
- Version notes never name a version above the pinned `@playwright/test`; balanced brackets and
  quotes; at least 20 characters; no em or en dashes; healthcare app, no real people or brands.

## Tests

`tests/async-guide.spec.js` mirrors `tests/locator-guide.spec.js` for shared behaviour and adds
the content rules. Tab and cross-page tests live in one `tests/page-switch.spec.js` driven by a
`PAGES` list in `tests/helpers/guide.js` (the same consolidation the mocking plan describes;
whichever plan runs first does it).

## Also updated

`index.html`, `waiting.html`, `locators.html` (fourth tab), `readme.md`, `AGENTS.md`,
`CLAUDE.md`, the release-sync skill (`async.html` holds meta-bar fallbacks), and the mocking
plan's tab notes.
