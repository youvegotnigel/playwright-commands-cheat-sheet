// =============================================================
// mocking.js — content of the Network mocking guide (mocking.html).
// SECTIONS is the content source: edit it here to change the page.
// js/guide.js renders it.
// =============================================================

import { renderGuide } from './guide.js';

const SECTIONS = [
  {
    id: 'strategy',
    title: 'Choose how much to fake',
    note: 'Start with the most real option that still gives a fast, stable test. Move down only when you must.',
    cols: ['Approach', 'Use it when', 'Real-world example'],
    rows: [
      [
        'Real backend, no mocks',
        'Critical journeys and a small smoke suite: sign in, book, pay. These are the only tests that prove the pieces fit.',
        `await page.goto('/appointments');
await page.getByRole('button', { name: 'Book appointment' }).click();
await expect(page.getByRole('status')).toHaveText('Appointment confirmed');`,
      ],
      [
        'Seed through the API with `request.post()`',
        'The data has to exist, but the screen under test should be real. Create the data fast through the API, then drive the page.',
        `const res = await request.post('/api/patients', {
  data: { name: 'Amara Okafor', dob: '1984-03-12' },
});
expect(res.ok()).toBeTruthy();
await page.goto('/patients');
await expect(page.getByText('Amara Okafor')).toBeVisible();`,
      ],
      [
        'Modify a real reply with `route.fetch()`',
        'You want realistic data with one thing changed, such as an overdue flag. The rest of the payload stays real, so it cannot drift.',
        `await page.route('**/api/appointments', async (route) => {
  const response = await route.fetch();
  const body = await response.json();
  body[0].status = 'overdue';
  await route.fulfill({ response, json: body });
});
await page.goto('/appointments');`,
      ],
      [
        'Replay a recording with `routeFromHAR()`',
        'Many stable endpoints that are slow or costly to reach, such as a report page that makes a dozen calls. Record once, replay offline.',
        `await page.routeFromHAR('tests/hars/records.har', {
  url: '**/api/**',
  notFound: 'fallback',
});
await page.goto('/records');`,
      ],
      [
        'Fake a reply with `route.fulfill()`',
        'States a real backend rarely gives on demand: an empty list, a 500, a very long name. Fast and exact, but you own keeping it true.',
        `await page.route('**/api/appointments', (route) => route.fulfill({ json: [] }));
await page.goto('/appointments');
await expect(page.getByText('No appointments yet')).toBeVisible();`,
      ],
      [
        'Block with `route.abort()`',
        'Traffic the test does not care about: analytics, chat widgets, fonts, third-party scripts. Less noise and faster pages.',
        `await page.route(/analytics|chat-widget/, (route) => route.abort());
await page.goto('/dashboard');`,
      ],
      [
        'Mock every request <tag>Avoid</tag>',
        'Every call is faked, so the test only checks your mocks. The real API can change and every test stays green.',
        `// Avoid: nothing here ever reaches the real API
await page.route('**/api/**', (route) => route.fulfill({ json: [] }));
await page.goto('/patients');
// Fake only what the test needs, and keep a few real journeys`,
        true,
      ],
    ],
  },
  {
    id: 'outcomes',
    title: 'The four route outcomes',
    note: 'Every handler must end in one of four ways: fulfill, continue, fallback or abort. A handler that does none of them leaves the request hanging.',
    cols: ['Method', 'What happens', 'Example'],
    rows: [
      [
        '`route.fulfill({ json })`',
        'Answers the request itself, so it never reaches the server. `json` sets the body and the JSON content type for you.',
        `await page.route('**/api/patients/42', (route) =>
  route.fulfill({ json: { id: 42, name: 'Amara Okafor' } })
);
await page.goto('/patients/42');`,
      ],
      [
        '`route.fulfill({ status: 500 })`',
        'Fakes a server error to test your error screen. Add `json` to send an error body as well.',
        `await page.route('**/api/records', (route) =>
  route.fulfill({ status: 500, json: { error: 'Records unavailable' } })
);
await page.goto('/records');
await expect(page.getByRole('alert')).toHaveText('Records unavailable');`,
      ],
      [
        '`route.continue({ headers })`',
        'Sends the request to the real server, optionally changed: headers, method, post data or URL. The reply is real, and no other handler sees the request.',
        `await page.route('**/api/**', async (route) => {
  const headers = { ...route.request().headers(), 'x-test-run': 'booking' };
  await route.continue({ headers });
});
await page.goto('/appointments');`,
      ],
      [
        '`route.fallback()`',
        'Hands the request to the next older handler, then to the network. Use it to layer handlers, where each one fakes only part of the traffic.',
        `await page.route('**/api/patients', (route) =>
  route.fulfill({ json: [{ id: 1, name: 'Amara Okafor' }] })
);
await page.route('**/api/patients', (route) =>
  route.request().method() === 'POST'
    ? route.fulfill({ status: 201, json: { id: 2 } })
    : route.fallback()
);`,
      ],
      [
        "`route.abort('failed')`",
        "Fails the request as if the network broke. Pass an error code such as `'timedout'` or `'connectionrefused'` to pick the failure.",
        `await page.route('**/api/appointments', (route) => route.abort('connectionrefused'));
await page.goto('/appointments');
await expect(page.getByText('Could not load appointments')).toBeVisible();`,
      ],
      [
        '`route.fetch()` then `route.fulfill()`',
        'Gets the real reply so you can edit it, then answers with the edit. Pass `response` so the status and headers are kept.',
        `await page.route('**/api/records', async (route) => {
  const response = await route.fetch();
  const records = await response.json();
  await route.fulfill({ response, json: records.slice(0, 1) });
});
await page.goto('/records');`,
      ],
    ],
  },
  {
    id: 'matching',
    title: 'Matching the right requests',
    note: 'A route matches the full URL, query string included. A mock that never fires is nearly always a pattern problem.',
    cols: ['Pattern', 'Matches', 'Example'],
    rows: [
      [
        'Glob: `*` vs `**`',
        'A single `*` stays inside one path segment, `**` crosses slashes, and `{a,b}` groups alternatives. `?` and `[]` are plain characters, not wildcards.',
        `// One segment: /api/patients/42, but not /api/patients/42/notes
await page.route('**/api/patients/*', (route) => route.fulfill({ json: {} }));
// Any depth, in either API version
await page.route('**/api/{v1,v2}/**', (route) => route.fulfill({ json: [] }));`,
      ],
      [
        'Regular expression',
        'Full control, for ids or optional parts. It is tested against the whole URL, query string included.',
        `await page.route(/\\/api\\/patients\\/\\d+$/, (route) =>
  route.fulfill({ json: { id: 7, name: 'Amara Okafor' } })
);`,
      ],
      [
        '`URLPattern`',
        'Matches by URL parts, with named path parameters. Good when the shape of the URL matters more than its text. Needs a runtime that has the `URLPattern` global.',
        `await page.route(new URLPattern({ pathname: '/api/patients/:id' }), (route) =>
  route.fulfill({ json: { name: 'Amara Okafor' } })
);`,
      ],
      [
        'Predicate on the `URL`',
        'Any rule you can write in code: a path prefix, a query parameter, the host. The function receives a `URL` object.',
        `await page.route(
  (url) => url.pathname.startsWith('/api/') && url.searchParams.has('page'),
  (route) => route.fulfill({ json: { items: [], total: 0 } })
);`,
      ],
      [
        'Same URL, different method',
        'Routes match URLs, not methods. Check `route.request().method()` and call `route.fallback()` for everything you do not fake.',
        `await page.route('**/api/patients/*', (route) => {
  if (route.request().method() !== 'DELETE') return route.fallback();
  return route.fulfill({ status: 204 });
});`,
      ],
      [
        'Only the first match: `{ times: 1 }`',
        'The route removes itself after that many matches. Later requests reach older handlers or the real server, which suits "fails once, then works".',
        `await page.route('**/api/appointments', (route) => route.abort('failed'), { times: 1 });
await page.goto('/appointments');
await page.getByRole('button', { name: 'Retry' }).click();
await expect(page.getByRole('table')).toBeVisible();`,
      ],
    ],
  },
  {
    id: 'order',
    title: 'Handler order and scope',
    note: 'Playwright checks handlers newest first, and a page before its context. Knowing the order explains most "my mock was ignored" bugs.',
    cols: ['Rule', 'Why it matters', 'Example'],
    rows: [
      [
        'The last registered route wins',
        'Handlers are checked from newest to oldest. Register the broad mock first and the specific one after it.',
        `await page.route('**/api/**', (route) => route.fulfill({ json: [] }));
await page.route('**/api/patients', (route) =>
  route.fulfill({ json: [{ id: 1, name: 'Amara Okafor' }] })
);`,
      ],
      [
        '`route.fallback()` layers handlers',
        'A handler that calls `route.fallback()` passes the request to the next older one. `route.continue()` skips them and goes straight to the network.',
        `await page.route('**/api/**', (route) => route.fulfill({ json: [] }));
await page.route('**/api/**', (route) => {
  console.log(route.request().method(), route.request().url());
  return route.fallback();
});`,
      ],
      [
        'A page route beats a context route',
        "When both match, the page's handler runs first. Put shared mocks on the context and per-test overrides on the page.",
        `await context.route('**/api/patients', (route) => route.fulfill({ json: [] }));
await page.route('**/api/patients', (route) =>
  route.fulfill({ json: [{ id: 1, name: 'Amara Okafor' }] })
);`,
      ],
      [
        '`context.route()` covers popups and new tabs',
        'A page route covers only that page. A popup or a second tab is a new page, so mock on the context to catch them.',
        `await context.route('**/api/records/*', (route) =>
  route.fulfill({ json: { id: 1, title: 'Discharge summary' } })
);
const popupPromise = page.waitForEvent('popup');
await page.getByRole('link', { name: 'Open record' }).click();
const popup = await popupPromise;
await expect(popup.getByRole('heading')).toHaveText('Discharge summary');`,
      ],
      [
        "`unrouteAll({ behavior: 'ignoreErrors' })` at teardown",
        'Removes every route. `ignoreErrors` does not wait for handlers already running and ignores their errors, while `wait` waits for them to finish.',
        `test.afterEach(async ({ page }) => {
  await page.unrouteAll({ behavior: 'ignoreErrors' });
});`,
      ],
      [
        'Mocks as a fixture',
        'Wrap routes you repeat in a fixture, so a test asks for the state it needs and the cleanup is automatic.',
        `export const test = base.extend<{ emptyAppointments: void }>({
  emptyAppointments: async ({ page }, use) => {
    await page.route('**/api/appointments', (route) => route.fulfill({ json: [] }));
    await use();
    await page.unrouteAll({ behavior: 'ignoreErrors' });
  },
});`,
      ],
      [
        "`serviceWorkers: 'block'`",
        'A service worker can answer requests before Playwright sees them, so a route never fires. Block service workers when you mock an app that registers one.',
        `// playwright.config.ts
export default defineConfig({
  use: { serviceWorkers: 'block' },
});`,
      ],
    ],
  },
  {
    id: 'har',
    title: 'Record and replay with HAR',
    note: 'A HAR file is a recording of real traffic. It gives realistic replies without a live backend, and it needs care because it is a copy of real data.',
    cols: ['Step', 'How', 'Example'],
    rows: [
      [
        'Record',
        "Run once with `update: true` to write the file. `updateMode: 'minimal'` is the default and keeps only what replay needs, so the file stays small.",
        `await page.routeFromHAR('tests/hars/records.har', {
  url: '**/api/**',
  update: true,
  updateMode: 'minimal',
});
await page.goto('/records');`,
      ],
      [
        'Replay',
        'Remove `update` and the same call answers from the file. Requests that are not in the file are aborted unless you change `notFound`.',
        `await page.routeFromHAR('tests/hars/records.har', { url: '**/api/**' });
await page.goto('/records');
await expect(page.getByRole('row')).not.toHaveCount(0);`,
      ],
      [
        'Let unknown requests through',
        "`notFound: 'fallback'` sends unmatched requests to the next handler or the network, so a partial HAR can sit beside live calls.",
        `await page.routeFromHAR('tests/hars/records.har', {
  url: '**/api/records/**',
  notFound: 'fallback',
});
await page.goto('/records');`,
      ],
      [
        'Scope it with `url`',
        'Without `url` the HAR is tried for every request, images and scripts included. Scope it to the API to keep the file small and the matching tight.',
        `await page.routeFromHAR('tests/hars/patients.har', {
  url: '**/api/patients/**',
});
await page.goto('/patients');`,
      ],
      [
        "`updateContent: 'attach'` for reviewable diffs",
        'Saves response bodies as separate files next to the HAR instead of embedding them, so a pull request shows which payload changed.',
        `await page.routeFromHAR('tests/hars/records.har', {
  url: '**/api/**',
  update: true,
  updateContent: 'attach',
});`,
      ],
      [
        'Strip secrets before you commit <tag>Security</tag>',
        'A HAR holds headers, cookies and tokens exactly as sent. Record against a test account, then remove authorization headers and personal data before the file enters git.',
        `// Record against a test account, never real patient data
await page.routeFromHAR('tests/hars/records.har', { update: true });
// Then open the .har and delete authorization, cookie and set-cookie headers`,
        true,
      ],
    ],
  },
  {
    id: 'channels',
    title: 'WebSockets, offline and slow networks',
    note: 'Not every dependency is a plain request. These are the other situations a mock has to cover.',
    cols: ['Situation', 'Approach', 'Example'],
    rows: [
      [
        'A live-status WebSocket',
        'Fake the server with `page.routeWebSocket()`, available since v1.48. The page connects to your handler, so you control every message.',
        `await page.routeWebSocket('**/ws/queue', (ws) => {
  ws.onMessage((message) => {
    if (message === 'status') ws.send(JSON.stringify({ waiting: 3 }));
  });
});
await page.goto('/waiting-room');
await expect(page.getByText('3 patients waiting')).toBeVisible();`,
      ],
      [
        'Watch or edit real WebSocket messages',
        'Call `ws.connectToServer()` to proxy to the real server, then change traffic in either direction. Without it, nothing reaches the server.',
        `await page.routeWebSocket('**/ws/queue', (ws) => {
  const server = ws.connectToServer();
  ws.onMessage((message) => server.send(message));
  server.onMessage((message) => ws.send(String(message).replace('Okafor', 'Test')));
});
await page.goto('/waiting-room');`,
      ],
      [
        'The network drops',
        'Use `context.setOffline(true)` to test offline banners and queued saves, then `false` to test recovery. It affects every page in the context.',
        `await page.goto('/appointments');
await context.setOffline(true);
await page.getByRole('button', { name: 'Save' }).click();
await expect(page.getByText('You are offline')).toBeVisible();
await context.setOffline(false);
await expect(page.getByText('Saved')).toBeVisible();`,
      ],
      [
        'A slow reply, to test a loading state',
        'Hold the reply inside the handler, assert the spinner, then let it through. A promise you resolve yourself is steadier than a fixed sleep.',
        `let release = () => {};
const gate = new Promise<void>((resolve) => {
  release = resolve;
});
await page.route('**/api/records', async (route) => {
  await gate;
  await route.fulfill({ json: [{ id: 1, title: 'Discharge summary' }] });
});
await page.goto('/records');
await expect(page.getByRole('progressbar')).toBeVisible();
release();
await expect(page.getByText('Discharge summary')).toBeVisible();`,
      ],
      [
        'Test the API without a browser',
        'Backend rules need no page. Use `request.get()` and its siblings: they send real HTTP calls with your baseURL and headers. Add the UI only for what the UI adds.',
        `const res = await request.get('/api/patients/42');
expect(res.ok()).toBeTruthy();
expect(await res.json()).toMatchObject({ id: 42 });`,
      ],
    ],
  },
  {
    id: 'verify',
    title: 'Asserting on traffic',
    note: 'A mock answers the page. These patterns check what the page sent, and that the user saw the result.',
    cols: ['Goal', 'Approach', 'Example'],
    rows: [
      [
        'The request had the right body',
        'Start `waitForRequest()` before the click, then read the body with `postDataJSON()`. Starting first catches the request even when it is fast.',
        `const requestPromise = page.waitForRequest('**/api/appointments');
await page.getByRole('button', { name: 'Book' }).click();
const request = await requestPromise;
expect(request.postDataJSON()).toMatchObject({ patientId: 42, slot: '09:30' });`,
      ],
      [
        'It was sent N times',
        'Count calls in the handler and poll the count with `expect.poll()`. This also catches a request sent twice by mistake.',
        `let calls = 0;
await page.route('**/api/appointments', (route) => {
  calls++;
  return route.fulfill({ status: 201, json: { id: 1 } });
});
await page.getByRole('button', { name: 'Book' }).click();
await expect.poll(() => calls).toBe(1);`,
      ],
      [
        'It was never sent',
        'Count a handler that should not run, then check after the page has settled. Assert something the user sees first, so you do not check before the page had a chance to send.',
        `let sent = 0;
await page.route('**/api/appointments', (route) => {
  sent++;
  return route.continue();
});
await page.getByRole('button', { name: 'Cancel' }).click();
await expect(page.getByText('Nothing was booked')).toBeVisible();
expect(sent).toBe(0);`,
      ],
      [
        'Inspect recent traffic',
        '`page.requests()` returns up to the last 100 requests the page made. Read it right away, because older ones are dropped.',
        `await page.getByRole('button', { name: 'Refresh' }).click();
await expect(page.getByText('Updated just now')).toBeVisible();
const urls = (await page.requests()).map((request) => request.url());
expect(urls.filter((url) => url.includes('/api/records'))).toHaveLength(1);`,
      ],
      [
        'Assert the screen, not only the mock',
        'A mock that was called proves the page asked, not that it showed the answer. Finish with what a user sees.',
        `await page.route('**/api/appointments', (route) =>
  route.fulfill({ json: [{ id: 1, time: '09:30', patient: 'Amara Okafor' }] })
);
await page.goto('/appointments');
await expect(page.getByRole('row', { name: /Amara Okafor/ })).toContainText('09:30');`,
      ],
    ],
  },
  {
    id: 'pitfalls',
    title: 'Mistakes that make mocked tests lie',
    note: 'Each of these gives a test that passes, or fails, for the wrong reason.',
    cols: ['Mistake', 'Symptom', 'Wrong vs right'],
    rows: [
      [
        'Route registered after `goto()`',
        'The first request has already gone to the real server, so the page shows real data, or the test passes only when the server is fast.',
        `// Wrong
await page.goto('/appointments');
await page.route('**/api/appointments', (route) => route.fulfill({ json: [] }));

// Right
await page.route('**/api/appointments', (route) => route.fulfill({ json: [] }));
await page.goto('/appointments');`,
        true,
      ],
      [
        'No `await` on `page.route()`',
        'The route may not be in place when the page loads, so the test passes on a fast machine and fails on CI.',
        `// Wrong
page.route('**/api/records', (route) => route.fulfill({ json: [] }));
await page.goto('/records');

// Right
await page.route('**/api/records', (route) => route.fulfill({ json: [] }));
await page.goto('/records');`,
        true,
      ],
      [
        'A glob that misses the query string',
        'The mock never fires for `/api/patients?page=2` and the real server answers. In a glob, `?` is a plain character, not a wildcard.',
        `// Wrong
await page.route('**/api/patients', (route) => route.fulfill({ json: [] }));

// Right: match the path with or without a query string
await page.route(/\\/api\\/patients(\\?.*)?$/, (route) => route.fulfill({ json: [] }));`,
        true,
      ],
      [
        'A handler that never resolves the route',
        'The request hangs until the test times out, with no error that points at the route.',
        `// Wrong
await page.route('**/api/records', (route) => {
  console.log(route.request().url());
});

// Right
await page.route('**/api/records', async (route) => {
  console.log(route.request().url());
  await route.continue();
});`,
        true,
      ],
      [
        'Hand-built JSON with `body`',
        'No JSON content type is sent, so some clients will not parse the reply as JSON. A typo in the string is also easy to miss.',
        `// Wrong
await page.route('**/api/patients', (route) =>
  route.fulfill({ body: JSON.stringify([{ id: 1 }]) })
);

// Right
await page.route('**/api/patients', (route) => route.fulfill({ json: [{ id: 1 }] }));`,
        true,
      ],
      [
        'A cross-origin mock without CORS headers',
        'The browser blocks the mocked reply, so the page sees a network error even though the route ran.',
        `// Wrong
await page.route('https://api.clinic.test/patients', (route) =>
  route.fulfill({ json: [] })
);

// Right
await page.route('https://api.clinic.test/patients', (route) =>
  route.fulfill({ json: [], headers: { 'access-control-allow-origin': '*' } })
);`,
        true,
      ],
      [
        'Mocks that drifted from the real API',
        'The tests stay green while the real API changes shape. The bug ships, and the mock still passes.',
        `// Wrong
await page.route('**/api/patients', (route) => route.fulfill({ json: [{ name: 'Amara' }] }));

// Right: build the reply from the shared type, and keep one real-backend test
const patients: Patient[] = [{ id: 1, name: 'Amara Okafor', dob: '1984-03-12' }];
await page.route('**/api/patients', (route) => route.fulfill({ json: patients }));`,
        true,
      ],
    ],
  },
  {
    id: 'summary',
    title: 'Summary',
    text: true,
    cols: ['Need', 'Use', 'Rule of thumb'],
    rows: [
      [
        'A real journey must work',
        'The real backend, with data seeded through `request`',
        'Keep a few of these. They are the only tests that can notice the real API changed.',
      ],
      [
        'A specific UI state',
        '`route.fulfill()`',
        'Fake the smallest thing that creates the state, and assert what the user sees.',
      ],
      [
        'Realistic data with one change',
        '`route.fetch()` then `route.fulfill()`',
        'Start from the real reply and edit one field, so the rest cannot drift.',
      ],
      [
        'Many stable endpoints',
        '`routeFromHAR()`',
        'Record once against a test account, scope it with `url`, and scrub secrets before commit.',
      ],
      [
        'Noise you are not testing',
        '`route.abort()`',
        'Block analytics and third parties. Never block what the page needs to work.',
      ],
    ],
  },
];

// Expose for tests via page.evaluate() (same rationale as window.categories)
window.mockingSections = SECTIONS;

// Column that holds method names, per section: those chips link back to the dashboard
const LINK_COLUMN = { strategy: 0, outcomes: 0, channels: 1, verify: 1 };

renderGuide(SECTIONS, { linkColumns: LINK_COLUMN });
